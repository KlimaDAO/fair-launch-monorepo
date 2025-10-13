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
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract FairLaunchClaimTest is Test {
    KlimaFairLaunchStaking staking;
    FairLaunchClaim claim;
    KlimaFairLaunchBurnVault burnVault;

    IERC20 KVCM = IERC20(vm.envAddress("KVCM_TOKEN_ADDR"));
    IERC20 K2 = IERC20(vm.envAddress("K2_TOKEN_ADDR"));
    IERC20 KLIMA_V0 = IERC20(0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2);

    address fairLaunchStakingProxy =
        address(vm.envAddress("STAKING_CONTRACT_ADDRESS"));
    address fairLaunchBurnVaultAddress =
        address(vm.envAddress("BURN_VAULT_ADDRESS"));
    address treasury = vm.envAddress("TREASURY");
    address user = address(0xBA0111F5EC1B6f2F092e9730F5F64840f3B42C95);

    uint freezeTime = 1760486400;
    uint claimStartTime = 1760572800;

    address deployer = makeAddr("deployer");
    address stakingOwner;

    function deployClaimContract() public {
        FairLaunchClaim claimImpl = new FairLaunchClaim();
        bytes memory claimData = abi.encodeWithSelector(
            FairLaunchClaim.initialize.selector,
            treasury
        );
        claim = FairLaunchClaim(
            address(new ERC1967Proxy(address(claimImpl), claimData))
        );
    }

    function setUp() public {
        // Use the deployed KlimaFairLaunchStaking contract from the fork
        staking = KlimaFairLaunchStaking(fairLaunchStakingProxy);
        stakingOwner = staking.owner();

        KlimaFairLaunchStaking new_staking_impl = new KlimaFairLaunchStaking();

        // Link contracts
        vm.startPrank(stakingOwner);
        staking.upgradeToAndCall(address(new_staking_impl), "");
        staking.setTokenAddresses(address(KVCM), address(K2));
        staking.setKlimaSupply(15_500_000 * 1e18);

        uint256 freezeTimestamp = staking.freezeTimestamp();
        staking.manualFreeze(freezeTime);
        uint256 newFreezeTimestamp = staking.freezeTimestamp();
        assertLt(
            newFreezeTimestamp,
            freezeTimestamp,
            "Freeze timestamp should change"
        );
        vm.stopPrank();

        // Deploy other contracts
        vm.prank(deployer);
        deployClaimContract();

        // Set up FairLaunchClaim configuration
        vm.prank(treasury);
        claim.setConfig(
            address(KVCM),
            address(K2),
            address(staking),
            false,
            uint128(claimStartTime),
            6 hours
        );
    }

    function test_happyPath_claimKVCM() public {
        uint256 userPointsBeforeFreeze = staking.previewUserPoints(user);

        // Time warp to after staking period ends
        uint256 freezeTimestamp = staking.freezeTimestamp();

        console2.log("Freeze timestamp:", freezeTimestamp);
        vm.roll(block.number + 10);
        vm.warp(freezeTimestamp + 10);

        // Finalize staking
        uint totalStakerAddresses = staking.getTotalStakerAddresses();

        address stakingOwner = staking.owner();
        vm.deal(stakingOwner, 1 ether); // Add gas money

        // Store points only for the first user for Quick Test
        vm.startPrank(stakingOwner);
        staking.storeTotalPoints(1);
        vm.stopPrank();

        console2.log(
            "User points after freeze:",
            staking.previewUserPoints(user)
        );

        KlimaFairLaunchStaking.Stake[] memory userStakes = staking
            .getUserStakes(user);

        uint totalUserStakedAmount;

        for (uint256 i = 0; i < userStakes.length; i++) {
            console2.log("User stake:", userStakes[i].amount);
            totalUserStakedAmount += userStakes[i].amount;
        }

        console2.log("Total staked amount:", totalUserStakedAmount / 1e9);
        console2.log(
            "KlimaOut",
            staking.calculateKlimaAllocation(totalUserStakedAmount) / 1e18
        );
        console2.log("User Points", staking.previewUserPoints(user));

        // Only storing points for the first 50 users
        // for (uint256 i = 0; i < 1; i++) {
        //     console2.log("Storing points in batch:", i);
        //     staking.storeTotalPoints(50);
        //     vm.roll(block.number + 10);
        //     vm.warp(block.timestamp + 10);
        // }

        // Fund claim contract
        uint256 klimaToFund = staking.calculateKlimaAllocation(
            totalUserStakedAmount
        );
        vm.startPrank(treasury);
        uint256 treasuryBalance = KVCM.balanceOf(treasury);
        KVCM.approve(address(claim), klimaToFund);
        claim.addKVCM(klimaToFund);

        assertEq(
            KVCM.balanceOf(address(claim)),
            klimaToFund,
            "KVCM balance of claim contract not correct"
        );
        assertEq(
            KVCM.balanceOf(treasury),
            treasuryBalance - klimaToFund,
            "KVCM balance of treasury not correct"
        );
        vm.stopPrank();

        // Time warp to after claim start time
        uint256 claimStartTime = claim.getKVCMClaimStartTime();
        vm.warp(claimStartTime + 1);

        vm.prank(treasury);
        claim.enableKVCMClaim();

        // User claims KVCM
        vm.expectEmit(true, true, true, true);
        emit IFairLaunchClaim.KVCMClaimed(user, klimaToFund);
        vm.startPrank(user);
        uint256 claimedAmount = claim.claimKVCM();
        vm.stopPrank();

        // Assertions
        assertEq(claimedAmount, klimaToFund, "Incorrect KLIMA amount claimed");
        assertEq(
            KVCM.balanceOf(user),
            klimaToFund,
            "User did not receive correct KLIMA amount"
        );
        assertTrue(claim.hasUserClaimed(user), "User claim status not updated");

        // // 9. User tries to claim again, should fail
        // vm.startPrank(user);
        // vm.expectRevert("KVCM already claimed");
        // claim.claimKVCM();
        // vm.stopPrank();
    }

    function test_withdraw_revert_if_not_treasury() public {
        vm.startPrank(user);
        vm.expectRevert("Not owner");
        claim.withdrawToken(address(KVCM), 100);
        vm.stopPrank();
    }

    function test_stop_claim_if_not_enabled() public {
        vm.startPrank(treasury);
        claim.enableKVCMClaim();
        claim.disableKVCMClaim();
        vm.stopPrank();

        vm.startPrank(user);
        vm.expectRevert("KVCM claim not enabled");
        claim.claimKVCM();
        vm.stopPrank();
    }

    function test_revert_if_not_started() public {
        // Enable claim but don't warp time to claimStartTime
        vm.prank(treasury);
        claim.enableKVCMClaim();

        // Attempt to claim before start time
        vm.startPrank(user);
        vm.expectRevert("KVCM claim not started");
        claim.claimKVCM();
        vm.stopPrank();
    }

    function test_revert_if_already_claimed() public {
        // Freeze and store points
        vm.warp(freezeTime + 10);
        vm.prank(staking.owner());
        staking.storeTotalPoints(1);

        // Fund claim contract
        KlimaFairLaunchStaking.Stake[] memory userStakes = staking
            .getUserStakes(user);
        uint256 totalUserStakedAmount = 0;
        for (uint256 i = 0; i < userStakes.length; i++) {
            totalUserStakedAmount += userStakes[i].amount;
        }
        uint256 klimaToFund = staking.calculateKlimaAllocation(
            totalUserStakedAmount
        );

        vm.startPrank(treasury);
        KVCM.approve(address(claim), klimaToFund);
        claim.addKVCM(klimaToFund);
        claim.enableKVCMClaim();
        vm.stopPrank();

        // Warp to claim start time
        vm.warp(claimStartTime + 1);

        // User claims once
        vm.prank(user);
        claim.claimKVCM();

        // User tries to claim again
        vm.startPrank(user);
        vm.expectRevert("KVCM already claimed");
        claim.claimKVCM();
        vm.stopPrank();
    }

    function test_revert_if_not_enough_KVCM() public {
        // Freeze and store points
        vm.warp(freezeTime + 10);
        vm.prank(staking.owner());
        staking.storeTotalPoints(1);

        // Don't fund enough KVCM (fund 0)
        vm.startPrank(treasury);
        claim.enableKVCMClaim();
        vm.stopPrank();

        // Warp to claim start time
        vm.warp(claimStartTime + 1);

        // User tries to claim without sufficient KVCM
        vm.startPrank(user);
        vm.expectRevert(IFairLaunchClaim.InsufficientKVCMForClaims.selector);
        claim.claimKVCM();
        vm.stopPrank();
    }

    function test_revert_if_paused() public {
        vm.startPrank(treasury);
        claim.enableKVCMClaim();
        claim.setKVCMClaimStartTime(uint128(block.timestamp + 1 hours));
        vm.warp(claimStartTime + 1);
        claim.pause();
        vm.stopPrank();

        vm.startPrank(user);
        vm.expectRevert(PausableUpgradeable.EnforcedPause.selector);
        claim.claimKVCM();
        vm.stopPrank();
    }
}
