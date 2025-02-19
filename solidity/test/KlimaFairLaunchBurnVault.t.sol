// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {KlimaFairLaunchBurnVault} from "../src/KlimaFairLaunchBurnVault.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC1967} from "@openzeppelin/contracts/interfaces/IERC1967.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

interface IKlimaFairLaunchStaking {
    function finalizationComplete() external view returns (uint256);
}

interface IERC20Burnable {
    function burn(address from, uint256 amount) external;
}

contract KlimaFairLaunchBurnVaultTest is Test {
    KlimaFairLaunchBurnVault public vault;
    KlimaFairLaunchBurnVault public implementation;
    address public owner;
    
    // Events matching the contract
    event KlimaFairLaunchStakingSet(address indexed klimaFairLaunchStaking);
    event FinalBurnPerformed();
    event AddedKlimaAmountToBurn(address indexed user, uint256 amount);

    function setUp() public {
        owner = makeAddr("owner");
        // Deploy implementation contract
        implementation = new KlimaFairLaunchBurnVault();
        // Deploy proxy pointing to implementation
        vault = KlimaFairLaunchBurnVault(deployProxy(address(implementation)));
    }

    function deployProxy(address impl) internal returns (address) {
        bytes memory initData = abi.encodeWithSelector(
            KlimaFairLaunchBurnVault.initialize.selector,
            owner
        );
        return address(new ERC1967Proxy(impl, initData));
    }

    // ======== Initialization Tests ========
    function test_InitializeWithValidOwner() public {
        // Verify owner is set correctly
        assertEq(vault.owner(), owner);
        
        // Verify implementation is initialized
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        implementation.initialize(owner);
    }

    function test_RevertWhen_InitializingTwice() public {
        // First initialization was done in setUp
        // Second initialization should fail
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        vault.initialize(owner);
    }

    function test_InitializeImplementationContract() public {
        // Attempting to initialize implementation should revert
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        implementation.initialize(owner);
    }

    // ======== Ownership & Authorization Tests ========
    function test_UpgradeImplementation_OnlyOwner() public {
        address newImpl = address(new KlimaFairLaunchBurnVault());
        
        vm.prank(owner);
        // Emit the event from IERC1967
        vm.expectEmit();
        emit IERC1967.Upgraded(newImpl);
        vault.upgradeToAndCall(newImpl, "");
    }

    function test_RevertWhen_NonOwnerUpgradesImplementation() public {
        address newImpl = address(new KlimaFairLaunchBurnVault());
        address nonOwner = makeAddr("nonOwner");
        
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, nonOwner));
        vault.upgradeToAndCall(newImpl, "");
    }

    function test_RevertWhen_UpgradingToZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("New implementation cannot be zero address");
        vault.upgradeToAndCall(address(0), "");
    }

    function test_SetStaking_OnlyOwner() public {
        address newStaking = makeAddr("newStaking");
        
        vm.prank(owner);
        vm.expectEmit();
        emit KlimaFairLaunchStakingSet(newStaking);
        vault.setKlimaFairLaunchStaking(newStaking);
        assertEq(vault.klimaFairLaunchStaking(), newStaking);
    }

    function test_RevertWhen_NonOwnerSetsStaking() public {
        address nonOwner = makeAddr("nonOwner");
        address newStaking = makeAddr("newStaking");
        
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, nonOwner));
        vault.setKlimaFairLaunchStaking(newStaking);
    }

    function test_PerformBurn_OnlyOwner() public {
        // Setup staking contract mock
        address mockStaking = makeAddr("mockStaking");
        vm.mockCall(
            mockStaking,
            abi.encodeWithSelector(IKlimaFairLaunchStaking.finalizationComplete.selector),
            abi.encode(1)
        );

        // Mock KLIMA_V0 token balance and burn calls
        address KLIMA_V0 = 0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2;
        vm.mockCall(
            KLIMA_V0,
            abi.encodeWithSelector(IERC20.balanceOf.selector, address(vault)),
            abi.encode(100)  // Mock some balance
        );
        vm.mockCall(
            KLIMA_V0,
            abi.encodeWithSelector(IERC20Burnable.burn.selector),
            abi.encode()
        );
        
        vm.prank(owner);
        vault.setKlimaFairLaunchStaking(mockStaking);
        
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit FinalBurnPerformed();
        vault.performFinalBurn();
    }

    function test_RevertWhen_NonOwnerPerformsBurn() public {
        address nonOwner = makeAddr("nonOwner");
        
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, nonOwner));
        vault.performFinalBurn();
    }

    // ======== KlimaFairLaunchStaking Setting Tests ========
    function test_SetStakingAddress_ValidAddress() public {
        address newStaking = makeAddr("newStaking");
        
        vm.prank(owner);
        vault.setKlimaFairLaunchStaking(newStaking);
        
        assertEq(vault.klimaFairLaunchStaking(), newStaking, "Staking address not set correctly");
    }

    function test_SetStakingAddress_EmitsEvent() public {
        address newStaking = makeAddr("newStaking");
        
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit KlimaFairLaunchStakingSet(newStaking);
        vault.setKlimaFairLaunchStaking(newStaking);
    }

    function test_SetStakingAddress_CanBeZero() public {
        // First set to non-zero address
        address newStaking = makeAddr("newStaking");
        vm.prank(owner);
        vault.setKlimaFairLaunchStaking(newStaking);
        
        // Then set to zero address
        vm.prank(owner);
        vault.setKlimaFairLaunchStaking(address(0));
        
        assertEq(vault.klimaFairLaunchStaking(), address(0), "Should allow setting zero address");
    }

    function test_SetStakingAddress_CanBeUpdated() public {
        address firstStaking = makeAddr("firstStaking");
        address secondStaking = makeAddr("secondStaking");
        
        // Set first address
        vm.prank(owner);
        vault.setKlimaFairLaunchStaking(firstStaking);
        assertEq(vault.klimaFairLaunchStaking(), firstStaking, "First address not set");
        
        // Update to second address
        vm.prank(owner);
        vault.setKlimaFairLaunchStaking(secondStaking);
        assertEq(vault.klimaFairLaunchStaking(), secondStaking, "Second address not set");
    }

    // ======== addKlimaAmountToBurn Tests ========
    // function test_AddKlimaToBurn_Success()
    // function testFail_AddKlimaToBurn_NoApproval()
    // function testFail_AddKlimaToBurn_InsufficientBalance()
    // function test_AddKlimaToBurn_MultipleAdditions()
    // function test_AddKlimaToBurn_EmitsEvent()
    // function test_AddKlimaToBurn_UpdatesMapping()

    // ======== performFinalBurn Tests ========
    // function testFail_PerformBurn_StakingNotSet()
    // function testFail_PerformBurn_NotFinalized()
    // function test_PerformBurn_Success()
    // function test_PerformBurn_EmitsEvent()
    // function test_PerformBurn_EntireBalance()
    // function test_PerformBurn_ZeroBalance()

    // ======== Integration Tests ========
    // function test_Integration_FullFlow()
    // function test_Integration_KlimaV0Token()
    // function test_Integration_StakingContract()

    // ======== Edge Cases and Security Tests ========
    // function test_AddKlimaToBurn_LargeNumbers()
    // function test_AddKlimaToBurn_ZeroAmount()
    // function test_DirectTokenTransfer()
} 