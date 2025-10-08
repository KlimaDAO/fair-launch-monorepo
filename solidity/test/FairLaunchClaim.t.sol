// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {KlimaFairLaunchStaking} from "../src/KlimaFairLaunchStaking.sol";
import {FairLaunchClaim} from "../src/FairLaunchClaim.sol";
import {FairLaunchClaimStorage} from "../src/FairLaunchClaimStorage.sol";

import {KlimaFairLaunchBurnVault} from "../src/KlimaFairLaunchBurnVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IFairLaunchClaim} from "../src/IFairLaunchClaim.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {console2} from "forge-std/console2.sol";

contract MockERC20 is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    function _mint(address _to, uint256 _amount) internal {
        balanceOf[_to] += _amount;
        totalSupply += _amount;
        emit Transfer(address(0), _to, _amount);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function transfer(
        address to,
        uint256 amount
    ) external override returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(
        address spender,
        uint256 amount
    ) external override returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external override returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

contract FairLaunchClaimTest is Test {
    KlimaFairLaunchStaking staking;
    FairLaunchClaim claim;
    KlimaFairLaunchBurnVault burnVault;

    MockERC20 klima;
    MockERC20 klimax;
    IERC20 KLIMA_V0 = IERC20(0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2);
    address fairLaunchStakingProxy =
        address(0xea8a59D0bf9C05B437c6a5396cfB429F1A57B682);
    address fairLaunchBurnVaultAddress =
        address(0x51FE162A4C8bBdE72265edF1667BBf14449d4972);

    address owner = makeAddr("owner");
    address user = makeAddr("user");

    uint256 constant STAKE_AMOUNT = 1000 * 1e9; // KLIMA_V0 has 9 decimals

    function setUp() public {
        // Use the deployed KlimaFairLaunchStaking contract from the fork
        staking = KlimaFairLaunchStaking(fairLaunchStakingProxy);
        address stakingOwner = staking.owner();
        console2.log("Staking contract loaded at:", address(staking));
        console2.log("Staking owner:", stakingOwner);
        // Deploy a new implementation and upgrade the contract
        KlimaFairLaunchStaking new_staking_impl = new KlimaFairLaunchStaking();
        console2.log(
            "New staking implementation deployed at:",
            address(new_staking_impl)
        );
        vm.prank(stakingOwner);
        staking.upgradeToAndCall(address(new_staking_impl), "");
        console2.log("Staking upgraded");
        // Deploy other contracts
        vm.prank(owner);
        FairLaunchClaim claim_impl = new FairLaunchClaim();
        bytes memory claim_data = abi.encodeWithSelector(
            FairLaunchClaim.initialize.selector,
            owner
        );
        claim = FairLaunchClaim(
            address(new ERC1967Proxy(address(claim_impl), claim_data))
        );
        console2.log("FairLaunchClaim Deployed");
        vm.prank(owner);
        KlimaFairLaunchBurnVault burnVault_impl = KlimaFairLaunchBurnVault(
            fairLaunchBurnVaultAddress
        );
        // Deploy Mock Tokens
        klima = new MockERC20("KLIMA Token", "KLIMA", 18);
        klimax = new MockERC20("KLIMAX Token", "KLIMAX", 18);
        // Link contracts
        vm.startPrank(stakingOwner);
        staking.setTokenAddresses(address(klima), address(klimax));
        console2.log("Staking token addresses set");
        vm.stopPrank();
        // Set up FairLaunchClaim configuration
        console2.log("Staking token addresses set");
        vm.prank(owner);
        claim.setConfig(
            address(klima),
            address(klimax),
            address(staking),
            true,
            uint128(block.timestamp + 10 days),
            1 days
        );
        console2.log("FairLaunchClaim configured");
    }

    function test_happyPath_claimKVCM() public {
        // 1. User stakes KLIMA_V0
        console2.log("User staking KLIMA_V0");
        deal(address(KLIMA_V0), user, STAKE_AMOUNT);
        vm.startPrank(user);
        KLIMA_V0.approve(address(staking), STAKE_AMOUNT);
        staking.stake(STAKE_AMOUNT);
        vm.stopPrank();

        // // 2. Time warp to after staking period ends

        console2.log("Freeze timestamp:", staking.freezeTimestamp());
        console2.log("Block timestamp:", block.timestamp);
        uint256 freezeTimestamp = staking.freezeTimestamp();
        vm.roll(block.number + 10);
        vm.warp(freezeTimestamp + 10);

        console2.log("Block timestamp after warp:", block.timestamp);

        // // 3. Finalize staking
        address stakingOwner = staking.owner();
        vm.deal(stakingOwner, 100 ether);
        vm.startPrank(stakingOwner);
        console2.log("Staking owner balance:", address(stakingOwner).balance);

        uint totalStakerAddresses = staking.getTotalStakerAddresses();
        console2.log("Total staker addresses:", totalStakerAddresses);

        console2.log("Storing points in batches");

        uint256 gasStart = gasleft();
        for (uint256 i = 0; i < 8; i++) {
            console2.log("Storing points in batch:", i);
            staking.storeTotalPoints(50);
            vm.roll(block.number + 10);
            vm.warp(block.timestamp + 10);
        }

        vm.stopPrank();

        // // 4. Fund claim contract
        // uint256 klimaToFund = staking.calculateKlimaAllocation(STAKE_AMOUNT);
        // klima.mint(owner, klimaToFund);
        // vm.startPrank(owner);
        // klima.approve(address(claim), klimaToFund);
        // claim.addKVCM(klimaToFund);
        // vm.stopPrank();

        // // 5. Enable claims
        // vm.prank(owner);
        // claim.enableKVCMClaim();

        // // 6. Time warp to after claim start time
        // uint256 claimStartTime = claim.getKVCMClaimStartTime();
        // vm.warp(claimStartTime + 1);

        // // 7. User claims KVCM
        // vm.expectEmit(true, true, true, true);
        // emit IFairLaunchClaim.KVCMClaimed(user, klimaToFund);
        // vm.startPrank(user);
        // uint256 claimedAmount = claim.claimKVCM();
        // vm.stopPrank();

        // // 8. Assertions
        // assertEq(claimedAmount, klimaToFund, "Incorrect KLIMA amount claimed");
        // assertEq(
        //     klima.balanceOf(user),
        //     klimaToFund,
        //     "User did not receive correct KLIMA amount"
        // );
        // assertTrue(claim.hasUserClaimed(user), "User claim status not updated");

        // // 9. User tries to claim again, should fail
        // vm.startPrank(user);
        // vm.expectRevert("KVCM already claimed");
        // claim.claimKVCM();
        // vm.stopPrank();
    }

    // function test_revert_claimKVCM_insufficientFunds() public {
    //     // 1. User stakes KLIMA_V0
    //     deal(address(KLIMA_V0), user, STAKE_AMOUNT);
    //     vm.startPrank(user);
    //     KLIMA_V0.approve(address(staking), STAKE_AMOUNT);
    //     staking.stake(STAKE_AMOUNT);
    //     vm.stopPrank();

    //     // 2. Time warp to after staking period ends
    //     uint256 freezeTimestamp = staking.freezeTimestamp();
    //     vm.warp(freezeTimestamp + 1);

    //     // 3. Finalize staking
    //     address stakingOwner = staking.owner();
    //     vm.startPrank(stakingOwner);
    //     staking.storeTotalPoints(staking.getTotalStakerAddresses());
    //     vm.stopPrank();

    //     // 4. Fund claim contract with insufficient funds
    //     uint256 klimaToFund = staking.calculateKlimaAllocation(STAKE_AMOUNT);
    //     uint256 insufficientFundAmount = klimaToFund - 1;
    //     klima.mint(owner, insufficientFundAmount);
    //     vm.startPrank(owner);
    //     klima.approve(address(claim), insufficientFundAmount);
    //     claim.addKVCM(insufficientFundAmount);
    //     vm.stopPrank();

    //     // 5. Enable claims
    //     vm.prank(owner);
    //     claim.enableKVCMClaim();

    //     // 6. Time warp to after claim start time
    //     uint256 claimStartTime = claim.getKVCMClaimStartTime();
    //     vm.warp(claimStartTime + 1);

    //     // 7. User tries to claim KVCM, should fail
    //     vm.startPrank(user);
    //     vm.expectRevert(IFairLaunchClaim.InsufficientKVCMForClaims.selector);
    //     claim.claimKVCM();
    //     vm.stopPrank();
    // }
}
