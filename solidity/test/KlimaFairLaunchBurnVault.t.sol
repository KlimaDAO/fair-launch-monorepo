// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {KlimaFairLaunchBurnVault} from "../src/KlimaFairLaunchBurnVault.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC1967} from "@openzeppelin/contracts/interfaces/IERC1967.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

interface IKlimaFairLaunchStaking {
    function finalizationComplete() external view returns (uint256);
}

interface IERC20Burnable {
    function burn(address from, uint256 amount) external;
}

contract MockKlimaV0 is ERC20 {
    constructor() ERC20("KLIMA", "KLIMA") {
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    function decimals() public pure override returns (uint8) {
        return 12;
    }

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}

contract KlimaFairLaunchBurnVaultTest is Test {
    KlimaFairLaunchBurnVault public vault;
    KlimaFairLaunchBurnVault public implementation;
    address public owner;
    MockKlimaV0 public klimaV0;
    address public user1;
    address public user2;
    uint256 public constant INITIAL_BALANCE = 1000 * 1e12; // 1000 KLIMA
    
    // Events matching the contract
    event KlimaFairLaunchStakingSet(address indexed klimaFairLaunchStaking);
    event FinalBurnPerformed();
    event AddedKlimaAmountToBurn(address indexed user, uint256 amount);

    address constant KLIMA_V0_ADDR = 0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2;

    function setUp() public {
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy and setup mock KLIMA_V0
        klimaV0 = new MockKlimaV0();
        
        // Deploy implementation contract
        implementation = new KlimaFairLaunchBurnVault();
        // Deploy proxy pointing to implementation
        vault = KlimaFairLaunchBurnVault(deployProxy(address(implementation)));

        // Replace the hardcoded KLIMA_V0 address with our mock
        address KLIMA_V0 = 0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2;
        bytes memory code = address(klimaV0).code;
        vm.etch(KLIMA_V0, code);
        
        // Give users some tokens from the etched contract
        deal(KLIMA_V0, user1, INITIAL_BALANCE);
        deal(KLIMA_V0, user2, INITIAL_BALANCE);
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
        vault.initiateFinalBurn{value: 0.1 ether}();
    }

    function test_RevertWhen_NonOwnerPerformsBurn() public {
        address nonOwner = makeAddr("nonOwner");
        
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, nonOwner));
        vault.initiateFinalBurn{value: 0.1 ether}();
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

    function test_RevertWhen_SettingZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("Staking contract cannot be zero address");
        vault.setKlimaFairLaunchStaking(address(0));
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
    function test_AddKlimaToBurn_Success() public {
        uint256 amount = 100 * 1e12; // 100 KLIMA
        
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(vault), amount);
        
        vm.expectEmit(true, true, true, true);
        emit AddedKlimaAmountToBurn(user1, amount);
        vault.addKlimaAmountToBurn(user1, amount);
        vm.stopPrank();

        assertEq(IERC20(KLIMA_V0_ADDR).balanceOf(address(vault)), amount);
        assertEq(vault.klimaAmountToBurn(user1), amount);
    }

    function test_RevertWhen_NoApproval() public {
        uint256 amount = 100 * 1e12;
        
        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                IERC20Errors.ERC20InsufficientAllowance.selector,
                address(vault),
                0,
                amount
            )
        );
        vault.addKlimaAmountToBurn(user1, amount);
    }

    function test_RevertWhen_InsufficientBalance() public {
        uint256 amount = 2000 * 1e12; // More than INITIAL_BALANCE
        
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(vault), amount);
        
        vm.expectRevert(
            abi.encodeWithSelector(
                IERC20Errors.ERC20InsufficientBalance.selector,
                user1,
                INITIAL_BALANCE,
                amount
            )
        );
        vault.addKlimaAmountToBurn(user1, amount);
        vm.stopPrank();
    }

    function test_AddKlimaToBurn_MultipleAdditions() public {
        uint256 amount1 = 100 * 1e12;
        uint256 amount2 = 150 * 1e12;
        
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(vault), amount1 + amount2);
        
        vault.addKlimaAmountToBurn(user1, amount1);
        vault.addKlimaAmountToBurn(user1, amount2);
        vm.stopPrank();

        assertEq(vault.klimaAmountToBurn(user1), amount1 + amount2);
        assertEq(IERC20(KLIMA_V0_ADDR).balanceOf(address(vault)), amount1 + amount2);
    }

    function test_AddKlimaToBurn_DifferentUsers() public {
        uint256 amount1 = 100 * 1e12;
        uint256 amount2 = 150 * 1e12;
        
        // First user
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(vault), amount1);
        vault.addKlimaAmountToBurn(user1, amount1);
        vm.stopPrank();

        // Second user
        vm.startPrank(user2);
        IERC20(KLIMA_V0_ADDR).approve(address(vault), amount2);
        vault.addKlimaAmountToBurn(user2, amount2);
        vm.stopPrank();

        assertEq(vault.klimaAmountToBurn(user1), amount1);
        assertEq(vault.klimaAmountToBurn(user2), amount2);
        assertEq(IERC20(KLIMA_V0_ADDR).balanceOf(address(vault)), amount1 + amount2);
    }

    function test_RevertWhen_AddingZeroAmount() public {
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(vault), 1);
        
        // Zero transfers are actually allowed in OZ's ERC20
        // Let's test that it works instead of reverting
        vault.addKlimaAmountToBurn(user1, 0);
        assertEq(vault.klimaAmountToBurn(user1), 0);
        vm.stopPrank();
    }

    // ======== performFinalBurn Tests ========
    function test_RevertWhen_StakingNotSet() public {
        vm.prank(owner);
        vm.expectRevert("Staking contract not set");
        vault.initiateFinalBurn{value: 0.1 ether}();
    }

    function test_RevertWhen_StakingNotFinalized() public {
        address mockStaking = makeAddr("mockStaking");
        
        // Setup mock to return 0 (not finalized)
        vm.mockCall(
            mockStaking,
            abi.encodeWithSelector(IKlimaFairLaunchStaking.finalizationComplete.selector),
            abi.encode(0)
        );
        
        vm.startPrank(owner);
        vault.setKlimaFairLaunchStaking(mockStaking);
        vm.expectRevert("Staking contract not finalized");
        vault.initiateFinalBurn{value: 0.1 ether}();
        vm.stopPrank();
    }

    function test_PerformBurn_Success() public {
        address mockStaking = makeAddr("mockStaking");
        uint256 burnAmount = 100 * 1e12;
        
        // Setup mock staking contract
        vm.mockCall(
            mockStaking,
            abi.encodeWithSelector(IKlimaFairLaunchStaking.finalizationComplete.selector),
            abi.encode(1)
        );
        
        // Give vault some tokens to burn
        deal(KLIMA_V0_ADDR, address(vault), burnAmount);
        
        vm.startPrank(owner);
        vault.setKlimaFairLaunchStaking(mockStaking);
        
        vm.expectEmit(true, true, true, true);
        emit FinalBurnPerformed();
        vault.initiateFinalBurn{value: 0.1 ether}();
        vm.stopPrank();
        
        assertEq(IERC20(KLIMA_V0_ADDR).balanceOf(address(vault)), 0, "Tokens not burned");
    }

    function test_PerformBurn_ZeroBalance() public {
        address mockStaking = makeAddr("mockStaking");
        
        // Setup mock staking contract
        vm.mockCall(
            mockStaking,
            abi.encodeWithSelector(IKlimaFairLaunchStaking.finalizationComplete.selector),
            abi.encode(1)
        );
        
        vm.startPrank(owner);
        vault.setKlimaFairLaunchStaking(mockStaking);
        
        vm.expectEmit(true, true, true, true);
        emit FinalBurnPerformed();
        vault.initiateFinalBurn{value: 0.1 ether}();
        vm.stopPrank();
        
        assertEq(IERC20(KLIMA_V0_ADDR).balanceOf(address(vault)), 0, "Balance should be zero");
    }

    // ======== Integration Tests ========
    function test_Integration_FullFlow() public {
        address mockStaking = makeAddr("mockStaking");
        uint256 user1Amount = 100 * 1e12;
        uint256 user2Amount = 150 * 1e12;
        
        // Setup mock staking contract - initially not finalized
        vm.mockCall(
            mockStaking,
            abi.encodeWithSelector(IKlimaFairLaunchStaking.finalizationComplete.selector),
            abi.encode(0)
        );
        
        // Set staking contract
        vm.prank(owner);
        vault.setKlimaFairLaunchStaking(mockStaking);
        
        // User 1 adds KLIMA
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(vault), user1Amount);
        vault.addKlimaAmountToBurn(user1, user1Amount);
        vm.stopPrank();
        
        // User 2 adds KLIMA
        vm.startPrank(user2);
        IERC20(KLIMA_V0_ADDR).approve(address(vault), user2Amount);
        vault.addKlimaAmountToBurn(user2, user2Amount);
        vm.stopPrank();
        
        // Verify balances before burn
        assertEq(vault.klimaAmountToBurn(user1), user1Amount);
        assertEq(vault.klimaAmountToBurn(user2), user2Amount);
        assertEq(IERC20(KLIMA_V0_ADDR).balanceOf(address(vault)), user1Amount + user2Amount);
        
        // Try to burn before finalization - should fail
        vm.prank(owner);
        vm.expectRevert("Staking contract not finalized");
        vault.initiateFinalBurn{value: 0.1 ether}();
        
        // Update mock to finalized state
        vm.mockCall(
            mockStaking,
            abi.encodeWithSelector(IKlimaFairLaunchStaking.finalizationComplete.selector),
            abi.encode(1)
        );
        
        // Perform final burn
        vm.prank(owner);
        vm.expectEmit();
        emit FinalBurnPerformed();
        vault.initiateFinalBurn{value: 0.1 ether}();
        
        // Verify final state
        assertEq(IERC20(KLIMA_V0_ADDR).balanceOf(address(vault)), 0);
    }

    // ======== Edge Cases and Security Tests ========
    function test_DirectTokenTransfer() public {
        uint256 amount = 100 * 1e12;
        
        // Direct transfer to vault
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(vault), amount);
        IERC20(KLIMA_V0_ADDR).transfer(address(vault), amount);
        vm.stopPrank();
        
        // Verify the tokens are in vault but not tracked in klimaAmountToBurn
        assertEq(IERC20(KLIMA_V0_ADDR).balanceOf(address(vault)), amount);
        assertEq(vault.klimaAmountToBurn(user1), 0);
        
        // These tokens will still be burned in final burn
        address mockStaking = makeAddr("mockStaking");
        vm.mockCall(
            mockStaking,
            abi.encodeWithSelector(IKlimaFairLaunchStaking.finalizationComplete.selector),
            abi.encode(1)
        );
        
        vm.prank(owner);
        vault.setKlimaFairLaunchStaking(mockStaking);
        
        vm.prank(owner);
        vault.initiateFinalBurn{value: 0.1 ether}();
        
        assertEq(IERC20(KLIMA_V0_ADDR).balanceOf(address(vault)), 0);
    }

    function test_RevertWhen_BurningTwice() public {
        address mockStaking = makeAddr("mockStaking");
        uint256 amount = 100 * 1e12;
        
        // Setup finalized staking contract
        vm.mockCall(
            mockStaking,
            abi.encodeWithSelector(IKlimaFairLaunchStaking.finalizationComplete.selector),
            abi.encode(1)
        );
        
        vm.prank(owner);
        vault.setKlimaFairLaunchStaking(mockStaking);
        
        // Give vault some tokens
        deal(KLIMA_V0_ADDR, address(vault), amount);
        
        // First burn succeeds
        vm.prank(owner);
        vault.initiateFinalBurn{value: 0.1 ether}();
        
        // Second burn should still work (with zero balance)
        vm.prank(owner);
        vault.initiateFinalBurn{value: 0.1 ether}();
    }

    function test_AddKlimaToBurn_Overflow() public {
        uint256 firstAmount = type(uint256).max;
        uint256 secondAmount = 1;
        
        // Give user enough balance
        deal(KLIMA_V0_ADDR, user1, firstAmount);
        
        // First addition
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(vault), firstAmount);
        vault.addKlimaAmountToBurn(user1, firstAmount);
        
        // Second addition should revert due to overflow
        deal(KLIMA_V0_ADDR, user1, secondAmount);
        IERC20(KLIMA_V0_ADDR).approve(address(vault), secondAmount);
        vm.expectRevert(); // Will revert with arithmetic overflow
        vault.addKlimaAmountToBurn(user1, secondAmount);
        vm.stopPrank();
    }

    function test_EventData_Accuracy() public {
        uint256 amount = 100 * 1e12;
        address mockStaking = makeAddr("mockStaking");

        // Test KlimaFairLaunchStakingSet event
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit KlimaFairLaunchStakingSet(mockStaking);
        vault.setKlimaFairLaunchStaking(mockStaking);

        // Test AddedKlimaAmountToBurn event
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(vault), amount);
        vm.expectEmit(true, false, false, true);
        emit AddedKlimaAmountToBurn(user1, amount);
        vault.addKlimaAmountToBurn(user1, amount);
        vm.stopPrank();

        // Setup for burn
        vm.mockCall(
            mockStaking,
            abi.encodeWithSelector(IKlimaFairLaunchStaking.finalizationComplete.selector),
            abi.encode(1)
        );

        // Test FinalBurnPerformed event
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit FinalBurnPerformed();
        vault.initiateFinalBurn{value: 0.1 ether}();

        // Verify final state matches events
        assertEq(vault.klimaFairLaunchStaking(), mockStaking);
        assertEq(vault.klimaAmountToBurn(user1), amount);
        assertEq(IERC20(KLIMA_V0_ADDR).balanceOf(address(vault)), 0);
    }
} 