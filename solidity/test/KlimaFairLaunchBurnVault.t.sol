// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {KlimaFairLaunchBurnVault} from "../src/KlimaFairLaunchBurnVault.sol";
import {KlimaFairLaunchStaking} from "../src/KlimaFairLaunchStaking.sol";
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

contract MockKlima is ERC20 {
    constructor() ERC20("KLIMA", "KLIMA") {
        _mint(msg.sender, 50_000_000 * 10**decimals());
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}

contract MockKlimaX is ERC20 {
    constructor() ERC20("KLIMA-X", "KLIMA-X") {
        _mint(msg.sender, 50_000_000 * 10**decimals());
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}

contract KlimaFairLaunchBurnVaultTest is Test {
    // Contracts
    KlimaFairLaunchBurnVault public vault;
    KlimaFairLaunchBurnVault public implementation;
    KlimaFairLaunchStaking public stakingContract;
    
    // Token contracts
    MockKlima public klimaToken;
    MockKlimaX public klimaXToken;
    
    // Addresses
    address public owner;
    address public user1;
    address public user2;
    address public constant KLIMA_V0_ADDR = 0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2;
    address public constant INTERCHAIN_SERVICE = 0xB5FB4BE02232B1bBA4dC8f81dc24C26980dE9e3C;
    
    // Test parameters
    uint256 public constant INITIAL_BALANCE = 1000 * 1e9; // 1000 KLIMA (9 decimals)
    uint256 private baseFork;
    uint256 public stakingStartTime;
    uint256 public stakingFreezeTime;
    
    // Events matching the contract
    event KlimaFairLaunchStakingSet(address indexed klimaFairLaunchStaking);
    event FinalBurnInitiated(uint256 finalAmountBurned);
    event AddedKlimaAmountToBurn(address indexed user, uint256 amount);
    event HelperContractOnPolygonSet(address indexed helperContractOnPolygon);
    event InterchainTokenServiceSet(address indexed interchainTokenService);

    function setUp() public {
        // Create fork of Base chain
        baseFork = vm.createFork("base");
        vm.selectFork(baseFork);
        
        // Setup test accounts
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy contracts
        deployContracts();
        
        // Setup staking contract
        setupStakingContract();
        
        // Give users some tokens
        deal(KLIMA_V0_ADDR, user1, INITIAL_BALANCE);
        deal(KLIMA_V0_ADDR, user2, INITIAL_BALANCE);
        
        // Warp to staking period so tests can start staking immediately
        vm.warp(stakingStartTime);
    }
    
    // Helper function to deploy contracts
    function deployContracts() internal {
        // Deploy staking contract implementation
        KlimaFairLaunchStaking stakingImplementation = new KlimaFairLaunchStaking();
        
        // Deploy staking proxy
        bytes memory stakingInitData = abi.encodeWithSelector(
            KlimaFairLaunchStaking.initialize.selector,
            owner
        );
        address stakingProxyAddress = address(new ERC1967Proxy(address(stakingImplementation), stakingInitData));
        stakingContract = KlimaFairLaunchStaking(stakingProxyAddress);
        
        // Deploy burn vault implementation
        implementation = new KlimaFairLaunchBurnVault();
        
        // Deploy burn vault proxy with interchain service address
        bytes memory vaultInitData = abi.encodeWithSelector(
            KlimaFairLaunchBurnVault.initialize.selector,
            owner,
            INTERCHAIN_SERVICE
        );
        address proxyAddress = address(new ERC1967Proxy(address(implementation), vaultInitData));
        vault = KlimaFairLaunchBurnVault(proxyAddress);
    }
    
    // Helper function to setup staking contract
    function setupStakingContract() internal {
        // Deploy token contracts first
        klimaToken = new MockKlima();
        klimaXToken = new MockKlimaX();
        
        // Transfer tokens to owner for setup
        vm.startPrank(address(this));
        klimaToken.transfer(owner, 17_500_000 * 1e18);
        klimaXToken.transfer(owner, 40_000_000 * 1e18);
        vm.stopPrank();
        
        vm.startPrank(owner);
        
        // Connect contracts
        vault.setKlimaFairLaunchStaking(address(stakingContract));
        vault.setInterchainTokenService(INTERCHAIN_SERVICE);
        stakingContract.setBurnVault(address(vault));
        
        // Setup token addresses
        stakingContract.setTokenAddresses(address(klimaToken), address(klimaXToken));
        
        // Set token supplies
        stakingContract.setKlimaSupply(17_500_000 * 1e18);
        stakingContract.setKlimaXSupply(40_000_000 * 1e18);
        
        // Set growth rate
        stakingContract.setGrowthRate(274);
        
        // Transfer tokens to staking contract for distribution
        klimaToken.transfer(address(stakingContract), 17_500_000 * 1e18);
        klimaXToken.transfer(address(stakingContract), 40_000_000 * 1e18);
        
        // Enable staking (starts now, freezes in 90 days)
        stakingStartTime = block.timestamp + 15;
        stakingFreezeTime = stakingStartTime + 90 days;
        stakingContract.enableStaking(stakingStartTime);
        
        vm.stopPrank();
    }
    
    // Helper function to finalize staking
    function finalizeStaking() internal {
        // Warp to after freeze period
        vm.warp(stakingFreezeTime + 1 days);
        
        // Finalize staking
        vm.startPrank(owner);
        stakingContract.storeTotalPoints(100); // Process all stakers
        vm.stopPrank();
        
        // Verify finalization is complete
        assertEq(stakingContract.finalizationComplete(), 1);
    }
    
    // Helper function to create a stake
    function createStake(address user, uint256 amount) internal {
        vm.startPrank(user);
        IERC20(KLIMA_V0_ADDR).approve(address(stakingContract), amount);
        stakingContract.stake(amount);
        vm.stopPrank();
    }
    
    // Helper function to unstake
    function unstake(address user, uint256 amount) internal {
        vm.prank(user);
        stakingContract.unstake(amount);
    }

    // ======== Initialization Tests ========
    function test_InitializeWithValidOwner() public {
        // Verify owner is set correctly
        assertEq(vault.owner(), owner);
        
        // Verify implementation is initialized
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        implementation.initialize(owner, INTERCHAIN_SERVICE);
    }

    function test_RevertWhen_InitializingTwice() public {
        // First initialization was done in setUp
        // Second initialization should fail
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        vault.initialize(owner, INTERCHAIN_SERVICE);
    }

    // ======== Ownership & Authorization Tests ========
    function test_UpgradeImplementation_OnlyOwner() public {
        address newImpl = address(new KlimaFairLaunchBurnVault());
        
        vm.prank(owner);
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

    // ======== Configuration Tests ========
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

    function test_RevertWhen_SettingZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("Staking contract cannot be zero address");
        vault.setKlimaFairLaunchStaking(address(0));
    }

    function test_SetInterchainTokenService_OnlyOwner() public {
        address newService = makeAddr("newService");
        
        vm.prank(owner);
        vm.expectEmit();
        emit InterchainTokenServiceSet(newService);
        vault.setInterchainTokenService(newService);
        assertEq(vault.interchainTokenService(), newService);
    }

    function test_RevertWhen_SettingZeroAddressForInterchainService() public {
        vm.prank(owner);
        vm.expectRevert("Interchain token service cannot be zero address");
        vault.setInterchainTokenService(address(0));
    }

    function test_SetHelperContractOnPolygon_OnlyOwner() public {
        address newHelper = makeAddr("newHelper");
        
        vm.prank(owner);
        vm.expectEmit();
        emit HelperContractOnPolygonSet(newHelper);
        vault.setHelperContractOnPolygon(newHelper);
        assertEq(vault.helperContractOnPolygon(), newHelper);
    }

    function test_RevertWhen_SettingZeroAddressForHelper() public {
        vm.prank(owner);
        vm.expectRevert("Helper contract cannot be zero address");
        vault.setHelperContractOnPolygon(address(0));
    }

    // ======== User Interaction Tests ========
    function test_AddKlimaAmountToBurn() public {
        
        // User stakes tokens
        uint256 amount = 100 * 1e9;
        createStake(user1, amount);
        
        // Advance time to calculate some burn
        vm.warp(stakingStartTime + 10 days);
        
        // Unstake, which triggers burn
        unstake(user1, amount);
        
        // Verify state - burn amount will be calculated by the staking contract
        uint256 burnAmount = vault.klimaAmountToBurn(user1);
        assertTrue(burnAmount > 0, "User should have tokens to burn");
        assertEq(IERC20(KLIMA_V0_ADDR).balanceOf(address(vault)), burnAmount);
    }

    function test_AddKlimaAmountToBurn_MultipleUsers() public {
        
        // User 1 stakes tokens
        uint256 amount1 = 100 * 1e9;
        createStake(user1, amount1);
        
        // User 2 stakes tokens
        uint256 amount2 = 150 * 1e9;
        createStake(user2, amount2);
        
        // Advance time to calculate some burn
        vm.warp(stakingStartTime + 10 days);
        
        // Both users unstake, which triggers burn
        unstake(user1, amount1);
        unstake(user2, amount2);
        
        // Verify state - burn amounts will be calculated by the staking contract
        uint256 user1BurnAmount = vault.klimaAmountToBurn(user1);
        uint256 user2BurnAmount = vault.klimaAmountToBurn(user2);
        
        assertTrue(user1BurnAmount > 0, "User1 should have tokens to burn");
        assertTrue(user2BurnAmount > 0, "User2 should have tokens to burn");
        assertEq(IERC20(KLIMA_V0_ADDR).balanceOf(address(vault)), user1BurnAmount + user2BurnAmount);
    }

    function test_AddKlimaAmountToBurn_MultipleDeposits() public {
        
        // User creates two stakes
        uint256 firstAmount = 100 * 1e9;
        uint256 secondAmount = 150 * 1e9;
        
        // First stake
        createStake(user1, firstAmount);
        
        // Second stake
        createStake(user1, secondAmount);
        
        // Advance time to calculate some burn
        vm.warp(stakingStartTime + 10 days);
        
        // Unstake both amounts
        unstake(user1, firstAmount);
        unstake(user1, secondAmount);
        
        // Verify state - burn amounts will be calculated by the staking contract
        uint256 totalBurnAmount = vault.klimaAmountToBurn(user1);
        assertTrue(totalBurnAmount > 0, "User should have tokens to burn");
        assertEq(IERC20(KLIMA_V0_ADDR).balanceOf(address(vault)), totalBurnAmount);
    }

    function test_RevertWhen_InsufficientAllowance() public {
        
        uint256 amount = 100 * 1e9;
        
        vm.startPrank(user1);
        // Don't approve, or approve less than needed
        IERC20(KLIMA_V0_ADDR).approve(address(stakingContract), amount - 1);
        
        vm.expectRevert();
        stakingContract.stake(amount);
        vm.stopPrank();
    }

    function test_RevertWhen_InsufficientBalance() public {
        
        uint256 amount = INITIAL_BALANCE + 1; // More than user has
        
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(stakingContract), amount);
        
        vm.expectRevert();
        stakingContract.stake(amount);
        vm.stopPrank();
    }

    // ======== Burn Tests ========
    function test_InitiateFinalBurn_Success() public {
        // Setup helper contract on Polygon
        address helperContract = makeAddr("helperContract");
        vm.prank(owner);
        vault.setHelperContractOnPolygon(helperContract);
        
        // User stakes and unstakes to add tokens to burn
        uint256 stakeAmount = 100 * 1e9;
        createStake(user1, stakeAmount);
        vm.warp(stakingStartTime + 10 days);
        unstake(user1, stakeAmount);
        
        // Finalize staking
        finalizeStaking();
        
        // Provide ETH for gas
        vm.deal(owner, 1 ether);
        
        // Get the burn amount before burning
        uint256 burnAmount = vault.totalKlimaToBurn();
        
        // Initiate burn
        vm.prank(owner);
        vm.expectEmit();
        emit FinalBurnInitiated(burnAmount);
        vault.initiateFinalBurn{value: 0.1 ether}();
        
        // Verify state after burn
        assertEq(IERC20(KLIMA_V0_ADDR).balanceOf(address(vault)), 0);
    }

    function test_RevertWhen_BurnWithoutHelper() public {
        // User stakes and unstakes to add tokens to burn
        uint256 stakeAmount = 100 * 1e9;
        createStake(user1, stakeAmount);
        vm.warp(stakingStartTime + 10 days);
        unstake(user1, stakeAmount);
        
        // Finalize staking
        finalizeStaking();
        
        // Give some ETH to the account making the call
        vm.deal(owner, 1 ether);
        
        // Initiate burn without helper set
        vm.prank(owner);
        vm.expectRevert("Helper contract not set");
        vault.initiateFinalBurn{value: 0.1 ether}();
    }

    // ======== Integration Tests ========
    function test_Integration_StakingToBurn() public {
        // Setup helper contract
        address helperContract = makeAddr("helperContract");
        vm.prank(owner);
        vault.setHelperContractOnPolygon(helperContract);
        
        // User stakes tokens during week 1 (2x multiplier)
        uint256 stakeAmount = 100 * 1e9;
        createStake(user1, stakeAmount);
        
        // Advance time to week 2
        vm.warp(stakingStartTime + 10 days);
        
        // User unstakes tokens (which triggers burn via the unstakeAndBurn function)
        unstake(user1, stakeAmount);
        
        // Verify tokens were sent to burn vault
        uint256 userBurnAmount = vault.klimaAmountToBurn(user1);
        assertTrue(userBurnAmount > 0, "No tokens were sent to burn vault");
        console.log("Burn amount:", userBurnAmount);
        
        // Finalize staking
        finalizeStaking();
        
        // Initiate burn
        vm.deal(owner, 1 ether);
        vm.prank(owner);
        vault.initiateFinalBurn{value: 0.1 ether}();
        
        // Verify burn vault is empty
        assertEq(IERC20(KLIMA_V0_ADDR).balanceOf(address(vault)), 0);
    }

    function test_Integration_MultipleUsers() public {
        // Setup helper contract
        address helperContract = makeAddr("helperContract");
        vm.prank(owner);
        vault.setHelperContractOnPolygon(helperContract);
        
        // User1 stakes tokens during week 1 (2x multiplier)
        uint256 user1StakeAmount = 100 * 1e9;
        createStake(user1, user1StakeAmount);
        
        // User2 stakes tokens during week 1 (2x multiplier)
        uint256 user2StakeAmount = 150 * 1e9;
        createStake(user2, user2StakeAmount);
        
        // Advance time to week 2
        vm.warp(stakingStartTime + 10 days);
        
        // Both users unstake
        unstake(user1, user1StakeAmount);
        unstake(user2, user2StakeAmount);
        
        // Verify tokens were sent to burn vault
        uint256 user1BurnAmount = vault.klimaAmountToBurn(user1);
        uint256 user2BurnAmount = vault.klimaAmountToBurn(user2);
        assertTrue(user1BurnAmount > 0, "No tokens were sent to burn vault for user1");
        assertTrue(user2BurnAmount > 0, "No tokens were sent to burn vault for user2");
        
        // Finalize staking
        finalizeStaking();
        
        // Initiate burn
        vm.deal(owner, 1 ether);
        vm.prank(owner);
        vault.initiateFinalBurn{value: 0.1 ether}();

        // Verify burn vault is empty
        assertEq(IERC20(KLIMA_V0_ADDR).balanceOf(address(vault)), 0);
    }

    // Fallback to receive any refunded ETH
    receive() external payable {}
} 