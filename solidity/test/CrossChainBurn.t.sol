// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console2} from "forge-std/Test.sol";
import {KlimaFairLaunchBurnVault} from "../src/KlimaFairLaunchBurnVault.sol";
import {KlimaFairLaunchPolygonBurnHelper} from "../src/KlimaFairLaunchPolygonBurnHelper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Vm} from "forge-std/Vm.sol";

interface IInterchainTokenService {
    function interchainTransfer(
        bytes32 tokenId,
        string calldata destinationChain,
        bytes calldata destinationAddress,
        uint256 amount,
        bytes calldata metadata,
        uint256 gasValue
    ) external payable;
}

interface IKlimaToken is IERC20 {
    function burn(uint256 amount) external;
    function totalSupply() external view returns (uint256);
}

contract KlimaFairLaunchStakingForTest {
    uint256 public finalizationComplete = 1;

    function setFinalizationComplete(uint256 value) external {
        finalizationComplete = value;
    }
}

contract CrossChainBurnTest is Test {
    // Chain forks
    uint256 private baseFork;
    uint256 private polygonFork;

    // Base chain contracts
    KlimaFairLaunchBurnVault public burnVault;
    address public baseKlima = 0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2; // KLIMA on Base
    address public baseInterchainService = 0xB5FB4BE02232B1bBA4dC8f81dc24C26980dE9e3C;

    // Polygon chain contracts
    KlimaFairLaunchPolygonBurnHelper public polygonHelper;
    address public polygonKlima = 0x4e78011Ce80ee02d2c3e649Fb657E45898257815; // KLIMA on Polygon
    address public polygonInterchainService = 0xB5FB4BE02232B1bBA4dC8f81dc24C26980dE9e3C;

    // Test accounts
    address public owner = address(0x1);
    address public user1 = address(0x2);

    // Test parameters
    uint256 public burnAmount = 100 * 1e9; // 100 KLIMA (9 decimals)
    bytes32 public tokenId;
    KlimaFairLaunchStakingForTest public stakingContract;

    // TokenId for cross-chain transfers
    bytes32 public constant TOKEN_ID = 0xdc30a9bd9048b5a833e3f90ea281f70ae77e82018fa5b96831d3a1f563e38aaf;

    function setUp() public {
        // Create forks of both chains
        baseFork = vm.createFork("base");
        polygonFork = vm.createFork("polygon");

        // Initialize contracts on Base
        vm.selectFork(baseFork);

        stakingContract = new KlimaFairLaunchStakingForTest();

        // Deploy implementation and proxy separately
        KlimaFairLaunchBurnVault implementation = new KlimaFairLaunchBurnVault();

        // Deploy proxy with initialization data
        bytes memory initData =
            abi.encodeWithSelector(KlimaFairLaunchBurnVault.initialize.selector, owner, address(baseInterchainService));
        address proxyAddress = address(new ERC1967Proxy(address(implementation), initData));
        burnVault = KlimaFairLaunchBurnVault(proxyAddress);

        vm.startPrank(owner);
        burnVault.setKlimaFairLaunchStaking(address(stakingContract));
        burnVault.setInterchainTokenService(baseInterchainService);
        tokenId = burnVault.TOKEN_ID();
        vm.stopPrank();

        // Initialize contracts on Polygon
        vm.selectFork(polygonFork);

        // Deploy implementation and proxy separately
        KlimaFairLaunchPolygonBurnHelper helperImplementation =
            new KlimaFairLaunchPolygonBurnHelper(polygonInterchainService, polygonKlima, TOKEN_ID);

        // Deploy proxy with initialization data
        bytes memory helperInitData =
            abi.encodeWithSelector(KlimaFairLaunchPolygonBurnHelper.initialize.selector, owner);
        address helperProxyAddress = address(new ERC1967Proxy(address(helperImplementation), helperInitData));
        polygonHelper = KlimaFairLaunchPolygonBurnHelper(helperProxyAddress);

        // Go back to Base to set helper address
        vm.selectFork(baseFork);
        vm.prank(owner);
        burnVault.setHelperContractOnPolygon(address(polygonHelper));
    }

    function testCrossChainBurn() public {
        // Step 1: Prepare Base chain state
        vm.selectFork(baseFork);

        // First give tokens to the staking contract
        deal(baseKlima, address(stakingContract), burnAmount);

        // Approve the vault to take tokens from staking contract
        vm.prank(address(stakingContract));
        IERC20(baseKlima).approve(address(burnVault), burnAmount);

        // Have the staking contract call addKlimaAmountToBurn
        vm.prank(address(stakingContract));
        burnVault.addKlimaAmountToBurn(user1, burnAmount);

        // Step 2: Initiate the cross-chain burn from Base
        vm.deal(owner, 1 ether);
        vm.prank(owner);
        burnVault.initiateFinalBurn{value: 0.1 ether}();

        // Verify Base side effects
        uint256 vaultBalanceAfter = IERC20(baseKlima).balanceOf(address(burnVault));
        assertEq(vaultBalanceAfter, 0, "Vault should have 0 KLIMA after initiating burn");

        // Step 3: Simulate Axelar relaying the message to Polygon
        vm.selectFork(polygonFork);

        // Record initial state on Polygon
        uint256 polyTotalSupplyBefore = IKlimaToken(polygonKlima).totalSupply();

        // Simulate the token transfer to the helper before execution
        deal(polygonKlima, address(polygonHelper), burnAmount);

        // Prepare the parameters for the executeWithInterchainToken call
        bytes32 mockCommandId = bytes32(uint256(1)); // Dummy command ID
        string memory sourceChain = "Base";
        bytes memory sourceAddress = abi.encodePacked(address(burnVault));
        bytes memory data = abi.encode(burnAmount, address(burnVault));

        // Simulate the Axelar ITS calling the helper
        vm.prank(polygonInterchainService);
        polygonHelper.executeWithInterchainToken(
            mockCommandId, sourceChain, sourceAddress, data, tokenId, polygonKlima, burnAmount
        );

        // Step 4: Verify effects on Polygon
        // Check that helper has 0 KLIMA (all burned)
        uint256 helperBalanceAfter = IERC20(polygonKlima).balanceOf(address(polygonHelper));
        assertEq(helperBalanceAfter, 0, "Helper should have 0 KLIMA after burn");

        // Verify total supply decreased (tokens were truly burned)
        uint256 polyTotalSupplyAfter = IKlimaToken(polygonKlima).totalSupply();
        assertEq(
            polyTotalSupplyAfter, polyTotalSupplyBefore - burnAmount, "Total supply should decrease by burned amount"
        );
    }

    function testInitiateBurnWhenNotFinalized() public {
        vm.selectFork(baseFork);

        // Set finalization to 0 (not finalized)
        stakingContract.setFinalizationComplete(0);

        // Fund vault
        deal(baseKlima, address(burnVault), burnAmount);

        // Attempt to initiate burn - should revert
        vm.prank(owner);
        vm.expectRevert("Staking contract not finalized");
        burnVault.initiateFinalBurn{value: 0.1 ether}();
    }

    // Fallback to receive any refunded ETH
    receive() external payable {}
}
