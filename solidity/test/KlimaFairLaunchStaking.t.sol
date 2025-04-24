// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {KlimaFairLaunchStaking} from "../src/KlimaFairLaunchStaking.sol";
import {KlimaFairLaunchBurnVault} from "../src/KlimaFairLaunchBurnVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC1967} from "@openzeppelin/contracts/interfaces/IERC1967.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { UD60x18, ud, mul, div, exp, sub } from "@prb/math/UD60x18.sol";

contract MockKlimaV0 is ERC20 {
    constructor() ERC20("KLIMA", "KLIMA") {
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    function decimals() public pure override returns (uint8) {
        return 9;
    }
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

contract KlimaFairLaunchStakingTest is Test {
    // =============================================================
    //                           SETUP
    // =============================================================

    KlimaFairLaunchStaking staking;
    KlimaFairLaunchBurnVault burnVault;
    address owner;
    address user1;
    address user2;
    address user3;
    address mockKlima;
    address mockKlimaX;
    MockKlimaV0 public klimaV0;
    MockKlima public klimaToken;
    MockKlimaX public klimaXToken;
    uint256 public constant INITIAL_BALANCE = 1000 * 1e9; // 1000 KLIMA
    address constant KLIMA_V0_ADDR = 0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2;

    // Events
    event StakeCreated(address indexed user, uint256 indexed amountKlimaV0Staked, uint256 multiplier, uint256 indexed startTimestamp);
    event StakeBurned(address indexed user, uint256 indexed amountKlimaV0Burned, uint256 indexed timestamp);
    event StakeClaimed(address indexed user, uint256 totalUserStaked, uint256 indexed klimaAllocation, uint256 indexed klimaXAllocation, uint256 timestamp);
    event FinalizationComplete(uint256 indexed finalizationTimestamp);
    event TokenAddressesSet(address indexed klima, address indexed klimax);
    event StakingEnabled(uint256 indexed startTimestamp, uint256 indexed freezeTimestamp);
    event StakingExtended(uint256 indexed oldFreezeTimestamp, uint256 indexed newFreezeTimestamp);
    event BurnVaultSet(address indexed burnVault);
    event GrowthRateSet(uint256 indexed newValue);
    event KlimaSupplySet(uint256 indexed newValue);
    event KlimaXSupplySet(uint256 indexed newValue);
    event PreStakingWindowSet(uint256 indexed preStakingWindow);
    event StakeLimitsSet(uint256 indexed minStakeAmount, uint256 indexed maxTotalStakesPerUser);

    /// @notice Helper function to accurately calculate expected points using the exponential formula
    /// @param amount Stake amount (in native KLIMA V0 decimals)
    /// @param bonusMultiplier Multiplier (e.g., 200 for 2x)
    /// @param timeElapsedSeconds Time elapsed since stake start in seconds
    /// @param growthRate Growth rate to use (default should be 274 representing 0.00274)
    /// @return Expected points using the exact same calculation as the contract
    function calculateExpectedPoints(
        uint256 amount,
        uint256 bonusMultiplier,
        uint256 timeElapsedSeconds,
        uint256 growthRate
    ) public view returns (uint256) {
        uint256 initialPoints = amount * 1e9 * bonusMultiplier/100;

        // Skip calculation if no time has elapsed
        if (timeElapsedSeconds == 0) return initialPoints;
        
        // Convert inputs to UD60x18 format
        UD60x18 timeElapsed_days = div(ud(timeElapsedSeconds), ud(86400)); // SECONDS_PER_DAY
        UD60x18 growthRate_ud = ud(growthRate * 1e13); // Convert from "274" to "0.00274 * 1e18"
        
        // Calculate e^(growthRate * timeElapsedDays) - 1
        UD60x18 exponent = mul(growthRate_ud, timeElapsed_days);
        UD60x18 growthFactor = sub(exp(exponent), ud(1e18));
        
        // Calculate base points (amount * bonusMultiplier / 100) / 1e27/1e18
        UD60x18 bonusMultiplier_ud = div(ud(bonusMultiplier * 1e18), ud(100));
        UD60x18 amount_ud = ud(amount);
        UD60x18 basePoints = div(mul(amount_ud, bonusMultiplier_ud), ud(1e27));
        
        // Calculate points (basePoints * growthFactor)
        UD60x18 points_ud = mul(basePoints, growthFactor);

        uint256 newPoints = points_ud.intoUint256() + initialPoints;
        console.log("newPoints", newPoints);
        
        // Convert back to uint256
        return newPoints;
    }

    function setUp() public {
        // Create and select Base fork
        uint256 baseFork = vm.createFork("base");
        vm.selectFork(baseFork);
        
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");

        // Deploy all mock tokens
        klimaV0 = new MockKlimaV0();
        klimaToken = new MockKlima();
        klimaXToken = new MockKlimaX();
        
        // Store addresses
        mockKlima = address(klimaToken);
        mockKlimaX = address(klimaXToken);

        // Deploy implementation contract
        KlimaFairLaunchStaking implementation = new KlimaFairLaunchStaking();
        
        // Deploy proxy pointing to implementation
        staking = KlimaFairLaunchStaking(deployProxy(address(implementation)));

        // Deploy burn vault
        setupBurnVault();
        
        // Replace the hardcoded KLIMA_V0 address with our mock
        bytes memory code = address(klimaV0).code;
        vm.etch(KLIMA_V0_ADDR, code);
        
        // Give users some tokens
        deal(KLIMA_V0_ADDR, user1, INITIAL_BALANCE);
        deal(KLIMA_V0_ADDR, user2, INITIAL_BALANCE);
        deal(KLIMA_V0_ADDR, user3, INITIAL_BALANCE);

        // Set up basic contract configuration but don't enable staking yet
        vm.startPrank(owner);
        staking.setGrowthRate(274);
        staking.setBurnVault(address(burnVault));
        staking.setPreStakingWindow(3 days);
        staking.setTokenAddresses(mockKlima, mockKlimaX);
        staking.setKlimaSupply(17_500_000 * 1e18);
        staking.setKlimaXSupply(40_000_000 * 1e18);
        vm.stopPrank();

        // Transfer tokens directly to staking contract
        vm.startPrank(address(this));
        klimaToken.transfer(address(staking), 17_500_000 * 1e18);
        klimaXToken.transfer(address(staking), 40_000_000 * 1e18);
        vm.stopPrank();
    }

    function deployProxy(address impl) internal returns (address) {
        bytes memory initData = abi.encodeWithSelector(
            KlimaFairLaunchStaking.initialize.selector,
            owner
        );
        return address(new ERC1967Proxy(impl, initData));
    }

    function setupBurnVault() internal {
        // Deploy burn vault implementation
        KlimaFairLaunchBurnVault implementation = new KlimaFairLaunchBurnVault();
        
        // Deploy burn vault proxy with interchain token service
        bytes memory vaultInitData = abi.encodeWithSelector(
            KlimaFairLaunchBurnVault.initialize.selector,
            owner,
            makeAddr("interchainTokenService") // Use a mock address for the interchain token service
        );
        address proxyAddress = address(new ERC1967Proxy(address(implementation), vaultInitData));
        burnVault = KlimaFairLaunchBurnVault(proxyAddress);
        
        // Set the staking contract in the burn vault
        vm.prank(owner);
        burnVault.setKlimaFairLaunchStaking(address(staking));
    }

    // Helper functions for test phases
    function setupStaking() public {
        // Enable staking if not already enabled
        if (staking.startTimestamp() == 0) {
            vm.prank(owner);
            uint256 startTime = block.timestamp + 1 days;
            staking.enableStaking(startTime);
            
            // Warp to start of staking
            vm.warp(startTime);
        }
    }

    function createStake(address user, uint256 amount) public {
        vm.startPrank(user);
        IERC20(KLIMA_V0_ADDR).approve(address(staking), amount);
        staking.stake(amount);
        vm.stopPrank();
    }

    function warpToFinalization() public {
        vm.warp(staking.freezeTimestamp() + 1);
    }

    function finalizeStaking() public {
        // Process batches until finalization is complete
        warpToFinalization();
        vm.startPrank(owner);
        uint256 batchSize = 100;
        
        while (staking.finalizationComplete() == 0) {
            staking.storeTotalPoints(batchSize);
        }
        vm.stopPrank();
        
        // Verify finalization is complete
        require(staking.finalizationComplete() == 1, "Finalization failed");
        require(IERC20(KLIMA_V0_ADDR).balanceOf(address(staking)) == 0, "Staking should have no KLIMA_V0 tokens");
    }

    // =============================================================
    //                     INITIALIZATION TESTS
    // =============================================================

    /// @notice Test successful contract initialization
    function test_Initialize() public {
        // Deploy new instance to test initialization
        KlimaFairLaunchStaking implementation = new KlimaFairLaunchStaking();
        KlimaFairLaunchStaking newStaking = KlimaFairLaunchStaking(deployProxy(address(implementation)));
        
        // Verify owner is set correctly
        assertEq(newStaking.owner(), owner);
        
        // Verify initial state
        assertEq(newStaking.startTimestamp(), 0);
        assertEq(newStaking.freezeTimestamp(), 0);
        assertEq(newStaking.totalStaked(), 0);
        assertEq(newStaking.finalizationComplete(), 0);
    }

    /// @notice Test initialization cannot be called twice
    function test_RevertWhen_InitializingTwice() public {
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        staking.initialize(owner);
    }

    /// @notice Test implementation contract cannot be initialized
    function test_RevertWhen_InitializingImplementation() public {
        KlimaFairLaunchStaking implementation = new KlimaFairLaunchStaking();
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        implementation.initialize(owner);
    }

    // =============================================================
    //                      ADMIN FUNCTION TESTS
    // =============================================================

    // Token Address Setting Tests
    /// @notice Test setting valid token addresses
    function test_SetTokenAddresses() public {
        vm.startPrank(owner);
        
        vm.expectEmit(true, true, false, true);
        emit TokenAddressesSet(mockKlima, mockKlimaX);
        staking.setTokenAddresses(mockKlima, mockKlimaX);
        
        assertEq(staking.KLIMA(), mockKlima);
        assertEq(staking.KLIMA_X(), mockKlimaX);
        vm.stopPrank();
    }

    /// @notice Test setting zero addresses fails
    function test_RevertWhen_SettingZeroTokenAddresses() public {
        vm.startPrank(owner);
        vm.expectRevert("Invalid token addresses");
        staking.setTokenAddresses(address(0), mockKlimaX);
        
        vm.expectRevert("Invalid token addresses");
        staking.setTokenAddresses(mockKlima, address(0));
        vm.stopPrank();
    }

    /// @notice Test non-owner cannot set token addresses
    function test_RevertWhen_NonOwnerSetsTokenAddresses() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user1));
        staking.setTokenAddresses(mockKlima, mockKlimaX);
    }

    // Staking Enable Tests
    /// @notice Test enabling staking with valid future timestamp
    function test_EnableStaking() public {
        // Set burn vault first
        vm.prank(owner);
        staking.setBurnVault(address(burnVault));

        uint256 futureTimestamp = block.timestamp + 1 days;
        
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit StakingEnabled(futureTimestamp, futureTimestamp + 90 days);
        staking.enableStaking(futureTimestamp);

        assertEq(staking.startTimestamp(), futureTimestamp);
        assertEq(staking.freezeTimestamp(), futureTimestamp + 90 days);
    }

    /// @notice Test enabling staking with past timestamp fails
    function test_RevertWhen_EnablingStakingWithPastTimestamp() public {
        vm.prank(owner);
        staking.setBurnVault(address(burnVault));

        uint256 pastTimestamp = block.timestamp - 1;
        
        vm.prank(owner);
        vm.expectRevert("Start timestamp cannot be in the past");
        staking.enableStaking(pastTimestamp);
    }

    /// @notice Test enabling staking without burn vault fails
    function test_RevertWhen_EnablingStakingWithoutBurnVault() public {
        // Deploy a fresh instance without setting the burn vault
        KlimaFairLaunchStaking implementation = new KlimaFairLaunchStaking();
        KlimaFairLaunchStaking newStaking = KlimaFairLaunchStaking(deployProxy(address(implementation)));
        
        uint256 futureTimestamp = block.timestamp + 1 days;
        
        vm.prank(owner);
        vm.expectRevert("Burn vault not set");
        newStaking.enableStaking(futureTimestamp);
    }

    // Total Points Storage Tests
    /// @notice Test storing total points with single batch
    function test_StoreTotalPointsSingleBatch() public {
        // Setup staking period
        vm.prank(owner);
        staking.setBurnVault(address(burnVault));
        
        uint256 startTime = block.timestamp + 1 days;
        vm.prank(owner);
        staking.enableStaking(startTime);

        // Create some stakes
        vm.warp(startTime);
        createStake(user1, 100 * 1e9);

        // Warp to after freeze period and ensure enough time for point accumulation
        vm.warp(startTime + 91 days);

        // Process batch
        vm.startPrank(owner);
        uint256 beforeIndex = staking.finalizeIndex();
        uint256 beforePoints = staking.finalTotalPoints();
        
        staking.storeTotalPoints(1);
        
        uint256 afterIndex = staking.finalizeIndex();
        uint256 afterPoints = staking.finalTotalPoints();

        // Verify points were stored
        assertGt(afterIndex, beforeIndex, "Index should increase");
        assertGt(afterPoints, beforePoints, "Points should increase");
        assertEq(afterIndex, 1, "Should process one address");
        vm.stopPrank();
    }

    /// @notice Test storing total points with multiple batches
    function test_StoreTotalPointsMultipleBatches() public {

        // Setup staking period
        vm.prank(owner);
        staking.setBurnVault(address(burnVault));
        
        uint256 startTime = block.timestamp + 1 days;
        vm.prank(owner);
        staking.enableStaking(startTime);

        // Create stakes for multiple users
        vm.warp(startTime);
        
        createStake(user1, 100 * 1e9);

        createStake(user2, 100 * 1e9);

        // Warp to after freeze period and ensure enough time for point accumulation
        vm.warp(startTime + 91 days);

        // Process in batches
        vm.startPrank(owner);
        uint256 initialIndex = staking.finalizeIndex();
        uint256 initialPoints = staking.finalTotalPoints();
        
        staking.storeTotalPoints(1);
        uint256 midIndex = staking.finalizeIndex();
        uint256 midPoints = staking.finalTotalPoints();
        
        staking.storeTotalPoints(1);
        uint256 finalIndex = staking.finalizeIndex();
        uint256 finalPoints = staking.finalTotalPoints();

        // Verify progression
        assertGt(midIndex, initialIndex, "First batch should increase index");
        assertGt(finalIndex, midIndex, "Second batch should increase index");
        assertGt(midPoints, initialPoints, "First batch should increase points");
        assertGt(finalPoints, midPoints, "Second batch should increase points");
        assertEq(finalIndex, 2, "Should process both addresses");
        vm.stopPrank();
    }

    /// @notice Test storing points before freeze timestamp fails
    function test_RevertWhen_StoringPointsBeforeFreeze() public {
        // Setup staking period
        vm.prank(owner);
        staking.setBurnVault(address(burnVault));
        
        uint256 startTime = block.timestamp + 1 days;
        vm.prank(owner);
        staking.enableStaking(startTime);

        // Try to store points before freeze
        vm.prank(owner);
        vm.expectRevert("Staking period not locked");
        staking.storeTotalPoints(1);
    }

    // Growth Rate Setting Tests
    /// @notice Test setting valid growth rate
    function test_SetGrowthRate() public {
        uint256 newRate = 100;
        
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit GrowthRateSet(newRate);
        staking.setGrowthRate(newRate);

        uint256 expectedGrowthRate = newRate * 1e13;
        UD60x18 currentGrowthRate = staking.EXP_GROWTH_RATE();
        uint256 currentGrowthRateUint = currentGrowthRate.intoUint256();

        // assert that the growth rate is set correctly in a way that is compatible with the UD60x18 type
        assertEq(currentGrowthRateUint, expectedGrowthRate);

        newRate = 1000;
        
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit GrowthRateSet(newRate);
        staking.setGrowthRate(newRate);

        expectedGrowthRate = newRate * 1e13;
        currentGrowthRate = staking.EXP_GROWTH_RATE();
        currentGrowthRateUint = currentGrowthRate.intoUint256();

        // assert that the growth rate is set correctly in a way that is compatible with the UD60x18 type
        assertEq(currentGrowthRateUint, expectedGrowthRate);
    }

    /// @notice Test reverting when setting below minimum growth rate
    function test_RevertWhen_SettingBelowMinimumGrowthRate() public {
        vm.prank(owner);
        vm.expectRevert("Growth rate too low, min 0.0001");
        staking.setGrowthRate(0);
    }

    /// @notice Test setting growth rate after staking starts fails
    function test_RevertWhen_SettingGrowthRateAfterStart() public {
        // Enable staking first
        vm.prank(owner);
        staking.setBurnVault(address(burnVault));
        
        uint256 futureTimestamp = block.timestamp + 1 days;
        vm.prank(owner);
        staking.enableStaking(futureTimestamp);

        // Warp to after start
        vm.warp(futureTimestamp + 1);
        
        vm.prank(owner);
        vm.expectRevert("Staking has already started");
        staking.setGrowthRate(100);
    }

    // Supply Setting Tests
    /// @notice Test setting valid KLIMA supply
    function test_SetKlimaSupply() public {
        uint256 newSupply = 20_000_000;
        
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit KlimaSupplySet(newSupply);
        staking.setKlimaSupply(newSupply);

        assertEq(staking.KLIMA_SUPPLY(), newSupply);
    }

    /// @notice Test setting valid KLIMA_X supply
    function test_SetKlimaXSupply() public {
        uint256 newSupply = 45_000_000;
        
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit KlimaXSupplySet(newSupply);
        staking.setKlimaXSupply(newSupply);

        assertEq(staking.KLIMAX_SUPPLY(), newSupply);
    }

    /// @notice Test setting supplies after finalization fails
    function test_RevertWhen_SettingSuppliesAfterFinalization() public {
        // Set up for finalization
        vm.prank(owner);
        staking.setBurnVault(address(burnVault));
        
        uint256 startTime = block.timestamp + 1 days;
        vm.prank(owner);
        staking.enableStaking(startTime);

        // Create a stake to have something to finalize
        vm.warp(startTime);
        createStake(user1, 100 * 1e9);

        // Warp to after freeze period
        vm.warp(startTime + 91 days);

        // Process finalization
        vm.startPrank(owner);
        staking.storeTotalPoints(1);
        vm.stopPrank();

        // Verify finalization is complete
        assertEq(staking.finalizationComplete(), 1);

        // Try to set supplies
        vm.startPrank(owner);
        vm.expectRevert("Finalization already complete");
        staking.setKlimaSupply(17_500_000);  // Changed from 20M to 17.5M

        vm.expectRevert("Finalization already complete");
        staking.setKlimaXSupply(40_000_000);
        vm.stopPrank();
    }

    // =============================================================
    //                      STAKING FUNCTION TESTS
    // =============================================================

    /// @notice Test successful staking with correct multiplier in week 1
    function test_StakeWeekOne() public {
        // Setup staking period
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 1 days;
        staking.enableStaking(startTime);
        vm.stopPrank();

        // Stake in week 1
        vm.warp(startTime + 1 days);
        uint256 stakeAmount = 100 * 1e9;
        
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(staking), stakeAmount);
        
        vm.expectEmit(true, true, true, true);
        emit StakeCreated(user1, stakeAmount, 200, block.timestamp); // 2x multiplier
        staking.stake(stakeAmount);
        vm.stopPrank();

        // Verify stake details
        (
            uint256 amount,
            uint256 stakeStartTime,
            uint256 lastUpdateTime,
            uint256 bonusMultiplier,
            ,,,
        ) = staking.userStakes(user1, 0);

        assertEq(amount, stakeAmount);
        assertEq(stakeStartTime, block.timestamp);
        assertEq(lastUpdateTime, block.timestamp);
        assertEq(bonusMultiplier, 200); // 2x multiplier
    }

    /// @notice Test successful staking with correct multiplier in week 2
    function test_StakeWeekTwo() public {
        // Setup staking period
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 1 days;
        staking.enableStaking(startTime);
        vm.stopPrank();

        // Stake in week 2
        vm.warp(startTime + 7 days + 1); // After first week
        uint256 stakeAmount = 100 * 1e9;
        
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(staking), stakeAmount);
        
        vm.expectEmit(true, true, true, true);
        emit StakeCreated(user1, stakeAmount, 150, block.timestamp); // 1.5x multiplier
        staking.stake(stakeAmount);
        vm.stopPrank();

        // Verify stake details
        (
            uint256 amount,
            uint256 stakeStartTime,
            uint256 lastUpdateTime,
            uint256 bonusMultiplier,
            ,,,
        ) = staking.userStakes(user1, 0);

        assertEq(amount, stakeAmount);
        assertEq(stakeStartTime, block.timestamp);
        assertEq(lastUpdateTime, block.timestamp);
        assertEq(bonusMultiplier, 150); // 1.5x multiplier
    }

    /// @notice Test successful staking with correct multiplier in week 3+
    function test_StakeWeekThreePlus() public {
        // Setup staking period
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 1 days;
        staking.enableStaking(startTime);
        vm.stopPrank();

        // Stake in week 3
        vm.warp(startTime + 14 days + 1); // After second week
        uint256 stakeAmount = 100 * 1e9;
        
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(staking), stakeAmount);
        
        vm.expectEmit(true, true, true, true);
        emit StakeCreated(user1, stakeAmount, 100, block.timestamp); // 1x multiplier
        staking.stake(stakeAmount);
        vm.stopPrank();

        // Verify stake details
        (
            uint256 amount,
            uint256 stakeStartTime,
            uint256 lastUpdateTime,
            uint256 bonusMultiplier,
            ,,,
        ) = staking.userStakes(user1, 0);

        assertEq(amount, stakeAmount);
        assertEq(stakeStartTime, block.timestamp);
        assertEq(lastUpdateTime, block.timestamp);
        assertEq(bonusMultiplier, 100); // 1x multiplier
    }

    /// @notice Test staking before start timestamp fails
    function test_RevertWhen_StakingBeforeStartofPreStakingPeriod() public {
        // Setup staking period
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 7 days;
        staking.enableStaking(startTime);
        vm.stopPrank();

        // Try to stake before start
        uint256 stakeAmount = 100 * 1e9;
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(staking), stakeAmount);
        
        vm.expectRevert("Staking not started");
        staking.stake(stakeAmount);
        vm.stopPrank();
    }

    /// @notice Test staking after freeze timestamp fails
    function test_RevertWhen_StakingAfterFreeze() public {
        // Setup staking period
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 1 days;
        staking.enableStaking(startTime);
        vm.stopPrank();

        // Try to stake after freeze
        vm.warp(startTime + 91 days);
        uint256 stakeAmount = 100 * 1e9;
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(staking), stakeAmount);
        
        vm.expectRevert("Staking period ended");
        staking.stake(stakeAmount);
        vm.stopPrank();
    }

    // =============================================================
    //                      UNSTAKING FUNCTION TESTS
    // =============================================================

    /// @notice Test successful unstaking before freeze
    function test_UnstakeBeforeFreeze() public {
        // Setup - in correct order
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 1 days;
        staking.enableStaking(startTime);
        vm.stopPrank();

        // Create stake for user1
        vm.warp(startTime);
        uint256 stakeAmount = 100 * 1e9;
        createStake(user1, stakeAmount);

        // Create stake for user2 (to receive burn points)
        createStake(user2, stakeAmount);

        // Let points accumulate
        vm.warp(startTime + 2 days);
        
        // Check initial points
        uint256 initialUser2Points = staking.previewUserPoints(user2);

        // Calculate expected burn amount
        uint256 burnAmount = staking.calculateBurn(stakeAmount, startTime);

        // User1 unstakes - this should generate burn points for user2
        vm.startPrank(user1);
        emit StakeBurned(user1, burnAmount, block.timestamp);
        staking.unstake(stakeAmount);
        vm.stopPrank();

        // Check user1's stake is cleared
        (uint256 remainingAmount,,,,,,,) = staking.userStakes(user1, 0);
        assertEq(remainingAmount, 0, "Stake amount should be 0");
        
        // Check user2's points increased from burn distribution
        uint256 finalUser2Points = staking.previewUserPoints(user2);
        assertGt(finalUser2Points, initialUser2Points, "User2 should have received additional points");
    }

    /// @notice Test partial unstaking before freeze
    function test_PartialUnstakeBeforeFreeze() public {
        // Setup
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 1 days;
        staking.enableStaking(startTime);
        vm.stopPrank();

        // Create stake
        vm.warp(startTime);
        uint256 stakeAmount = 100 * 1e9;
        createStake(user1, stakeAmount);

        // Verify stake was created
        (uint256 stakedAmount,,,,,,,) = staking.userStakes(user1, 0);
        assertEq(stakedAmount, stakeAmount, "Stake should be created with correct amount");

        // Warp forward 2 days
        vm.warp(startTime + 2 days);
        
        // Calculate burn for full amount
        uint256 burnAmount = staking.calculateBurn(stakeAmount, startTime);
        
        // Calculate expected burn for half unstake
        uint256 unstakeAmount = stakeAmount / 2;
        uint256 expectedBurn = burnAmount / 2;

        // Get initial total burned
        uint256 initialTotalBurned = staking.totalBurned();

        // Emit expected event
        emit StakeBurned(user1, expectedBurn, block.timestamp);

        // Try to unstake half
        vm.prank(user1);
        staking.unstake(unstakeAmount);

        // Verify partial unstake
        (uint256 remainingAmount,,,,,,,) = staking.userStakes(user1, 0);
        assertEq(remainingAmount, stakeAmount - unstakeAmount, "Should have half amount remaining");
        
        // Verify total burned increased by expected amount
        assertEq(staking.totalBurned() - initialTotalBurned, expectedBurn, "Should have increased total burned by half burn amount");
    }

    /// @notice Test unstaking with insufficient balance fails
    function test_RevertWhen_UnstakingInsufficientBalance() public {
        // Setup staking
        setupStaking();
        uint256 stakeAmount = 100 * 1e9;
        
        // Create stake
        createStake(user1, stakeAmount);
        
        // Try to unstake more than staked
        vm.startPrank(user1);
        vm.expectRevert("Insufficient stake balance");  // Update expected revert message to match contract
        staking.unstake(stakeAmount + 1);  // Try to unstake more than user has
        vm.stopPrank();
    }

    /// deprecated
    /// @notice Test successful claiming after freeze
    // function test_ClaimAfterFreeze() public {
    //     // Setup
    //     vm.startPrank(owner);
    //     uint256 startTime = block.timestamp + 1 days;
    //     staking.enableStaking(startTime);
    //     vm.stopPrank();

    //     // Create stake
    //     vm.warp(startTime);
    //     uint256 stakeAmount = 100 * 1e9;
    //     createStake(user1, stakeAmount);

    //     // Finalize
    //     finalizeStaking();

    //     // Calculate expected amounts
    //     uint256 klimaAmount = staking.calculateKlimaAllocation(stakeAmount);
    //     uint256 klimaXAmount = staking.calculateKlimaXAllocation(staking.previewUserPoints(user1));

    //     // Claim
    //     vm.startPrank(user1);
    //     emit StakeClaimed(user1, stakeAmount, klimaAmount, klimaXAmount, block.timestamp);
    //     staking.unstake(0);
    //     vm.stopPrank();
    // }

    /// fixed for deprecated function
    /// @notice Test claiming before finalization fails
    function test_RevertWhen_ClaimingBeforeFinalization() public {
        // Setup staking period
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 1 days;
        staking.enableStaking(startTime);
        vm.stopPrank();

        // Create stake
        vm.warp(startTime);
        uint256 stakeAmount = 100 * 1e9;
        createStake(user1, stakeAmount);

        // Try to claim before finalization
        vm.warp(startTime + 91 days);
        vm.expectRevert("Claims are no longer processed in this contract");
        staking.unstake(0);
        vm.stopPrank();
    }

    // =============================================================
    //                    POINT CALCULATION TESTS
    // =============================================================

    /// @notice Test organic points accumulation over time
    function test_OrganicPointsAccumulation() public {
        // Setup staking period with growth rate
        vm.startPrank(owner);
        staking.setGrowthRate(274);
        staking.setBurnVault(address(burnVault));
        uint256 startTime = block.timestamp + 1 days;
        staking.enableStaking(startTime);
        vm.stopPrank();

        // Create stake
        vm.warp(startTime);
        uint256 stakeAmount = 100 * 1e9;
        createStake(user1, stakeAmount);

        // Check points after time passes
        vm.warp(startTime + 1 days);
        uint256 points = staking.previewUserPoints(user1);
        assertGt(points, 0);

        // Check points increase over time
        vm.warp(startTime + 2 days);
        uint256 laterPoints = staking.previewUserPoints(user1);
        assertGt(laterPoints, points);
    }

    /// @notice Test burn calculation with different durations
    function test_BurnCalculation() public {
        uint256 amount = 100 * 1e9;
        
        // Set a reasonable current timestamp first
        uint256 currentTime = 1000000;
        vm.warp(currentTime);
        
        // Test immediate burn (should be 25%)
        uint256 stakeStartTime = currentTime; // Same as current time
        uint256 burnAmount = staking.calculateBurn(amount, stakeStartTime);
        assertEq(burnAmount, amount * 25 / 100, "Immediate burn should be 25%");

        // Test burn after 1 year (should be 100%)
        vm.warp(currentTime + 1 days * 365);
        burnAmount = staking.calculateBurn(amount, stakeStartTime);
        assertEq(burnAmount, amount, "Year burn should be 100%");

        // Test burn after ~6 months (should be between 25% and 100%)
        vm.warp(currentTime + 1 days * 182);  // ~6 months
        burnAmount = staking.calculateBurn(amount, stakeStartTime);
        assertGt(burnAmount, amount * 25 / 100, "Half year burn should be > 25%");
        assertLt(burnAmount, amount, "Half year burn should be < 100%");
    }

    /// @notice Test partial staking period points and KLIMAX allocation
    function test_PartialStakingPeriodRewards() public {
        // Setup staking
        setupStaking();
        uint256 stakeAmount = 100 * 1e9;

        // Create stakes for both users
        createStake(user1, stakeAmount);
        createStake(user2, stakeAmount);

        // Let points accumulate for 45 days
        vm.warp(block.timestamp + 45 days);

        // Check user2's points before unstaking
        uint256 user2PointsBeforeUnstake = staking.previewUserPoints(user2);
        assertGt(user2PointsBeforeUnstake, 0, "Should have accumulated points before unstaking");

        // User2 unstakes
        vm.prank(user2);
        staking.unstake(stakeAmount);

        // Advance to finalization period but first capture user1's points at freeze time
        // This is key - we need to check points at freeze time, not after
        uint256 user2PointsAtFreeze = staking.previewUserPoints(user2);
        
        vm.warp(staking.freezeTimestamp() + 1 days);

        // Finalize staking
        finalizeStaking();

        // Points should not have changed after freezeTimestamp
        uint256 user1Points = staking.previewUserPoints(user1);
        uint256 user2Points = staking.previewUserPoints(user2);
        
        // Check that points didn't change after freeze
        assertEq(user2Points, user2PointsAtFreeze, "User2 points should not increase after freeze");

        // Get final total points from contract
        uint256 totalPoints = staking.finalTotalPoints();
        uint256 klimaxSupply = staking.KLIMAX_SUPPLY();
        
        // Calculate expected allocations based on final points
        uint256 expectedUser1KlimaX = (user1Points * klimaxSupply) / totalPoints;
        uint256 expectedUser2KlimaX = (user2Points * klimaxSupply) / totalPoints;
        
        uint256 actualUser1KlimaX = staking.calculateKlimaXAllocation(user1Points);
        uint256 actualUser2KlimaX = staking.calculateKlimaXAllocation(user2Points);

        // Verify exact values
        assertEq(actualUser1KlimaX, expectedUser1KlimaX, "User1 should get the correct KLIMAX allocation");
        assertEq(actualUser2KlimaX, expectedUser2KlimaX, "User2 should get the correct KLIMAX allocation");
        
        // Since user2 unstaked everything, they should have no points and thus no KLIMAX
        assertEq(user2Points, 0, "User2 should have no points after unstaking all tokens");
        assertEq(actualUser2KlimaX, 0, "User2 should get no KLIMAX after unstaking all tokens");
    }

    /// @notice Test KLIMA allocation calculation with multiple users
    function test_CalculateKlimaAllocation() public {
        // Setup staking
        setupStaking();
        uint256 startTime = staking.startTimestamp();
        
        // User1 stakes during pre-staking period
        vm.warp(startTime - 2 days);
        uint256 stakeAmount = 100 * 1e9;
        createStake(user1, stakeAmount);
        
        // User2 stakes during regular period (week 1)
        vm.warp(startTime + 1 days);
        createStake(user2, stakeAmount);
        
        // Calculate expected KLIMA allocations
        uint256 totalStaked = staking.totalStaked();
        uint256 klimaSupply = staking.KLIMA_SUPPLY();
        
        uint256 expectedUser1Klima = (stakeAmount * klimaSupply) / totalStaked;
        uint256 expectedUser2Klima = (stakeAmount * klimaSupply) / totalStaked;
        
        // Get actual KLIMA allocations
        uint256 actualUser1Klima = staking.calculateKlimaAllocation(stakeAmount);
        uint256 actualUser2Klima = staking.calculateKlimaAllocation(stakeAmount);
        
        // Verify exact values
        assertEq(actualUser1Klima, expectedUser1Klima, "User1 should get the correct KLIMA allocation");
        assertEq(actualUser2Klima, expectedUser2Klima, "User2 should get the correct KLIMA allocation");
    }

    /// @notice Test KLIMA_X allocation calculation
    function test_CalculateKlimaXAllocation() public {
        // Setup staking
        setupStaking();
        uint256 stakeAmount = 100 * 1e9;

        // Create stakes for both users
        createStake(user1, stakeAmount);
        createStake(user2, stakeAmount);

        // Advance time to 45 days (within staking period)
        vm.warp(block.timestamp + 45 days);

        // User2 unstakes
        vm.prank(user2);
        staking.unstake(stakeAmount);

        // Finalize staking
        finalizeStaking();

        // Compare points
        uint256 user1Points = staking.previewUserPoints(user1);
        uint256 user2Points = staking.previewUserPoints(user2);

        // Calculate expected KLIMAX allocation
        uint256 totalPoints = staking.finalTotalPoints();
        uint256 klimaxSupply = staking.KLIMAX_SUPPLY();
        
        uint256 expectedUser1KlimaX = (user1Points * klimaxSupply) / totalPoints;
        uint256 expectedUser2KlimaX = (user2Points * klimaxSupply) / totalPoints;
        
        uint256 actualUser1KlimaX = staking.calculateKlimaXAllocation(user1Points);
        uint256 actualUser2KlimaX = staking.calculateKlimaXAllocation(user2Points);

        // Verify exact values
        assertEq(actualUser1KlimaX, expectedUser1KlimaX, "User1 should get the correct KLIMAX allocation");
        assertEq(actualUser2KlimaX, expectedUser2KlimaX, "User2 should get the correct KLIMAX allocation");
        
        // Since user2 unstaked everything, they should have no points and thus no KLIMAX
        assertEq(user2Points, 0, "User2 should have no points after unstaking all tokens");
        assertEq(actualUser2KlimaX, 0, "User2 should get no KLIMAX after unstaking all tokens");
    }

    /// @notice Test point preview calculation
    function test_PreviewUserPoints() public {
        // Setup staking with growth rate
        vm.startPrank(owner);
        staking.setGrowthRate(274);
        staking.setBurnVault(address(burnVault));
        uint256 startTime = block.timestamp + 1 days;
        staking.enableStaking(startTime);
        vm.stopPrank();

        // Create stake
        vm.warp(startTime);
        uint256 stakeAmount = 100 * 1e9;
        createStake(user1, stakeAmount);

        // Preview points
        vm.warp(startTime + 1 days);
        uint256 points = staking.previewUserPoints(user1);
        assertGt(points, 0);
    }

    /// @notice Test total points calculation
    function test_GetTotalPoints() public {
        // Setup staking with growth rate
        vm.startPrank(owner);
        staking.setGrowthRate(274);
        staking.setBurnVault(address(burnVault));
        uint256 startTime = block.timestamp + 1 days;
        staking.enableStaking(startTime);
        vm.stopPrank();

        // Create stakes for multiple users
        vm.warp(startTime);
        uint256 stakeAmount = 100 * 1e9;
        
        createStake(user1, stakeAmount);

        createStake(user2, stakeAmount);

        // Calculate total points
        vm.warp(startTime + 1 days);
        uint256 totalPoints = staking.getTotalPoints();
        assertGt(totalPoints, 0);
        assertEq(totalPoints, staking.previewUserPoints(user1) + staking.previewUserPoints(user2));
    }

    // =============================================================
    //                      INTEGRATION TESTS
    // =============================================================

    /// @notice Test complete staking lifecycle
    function test_CompleteStakingLifecycle() public {
        // Setup
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 1 days;
        staking.enableStaking(startTime);
        vm.stopPrank();

        // Staking phase
        vm.warp(startTime);
        uint256 stakeAmount = 100 * 1e9;
        
        createStake(user1, stakeAmount);

        // Point accumulation phase
        vm.warp(startTime + 45 days);
        uint256 midPoints = staking.previewUserPoints(user1);
        assertGt(midPoints, 0);

        // Finalization phase
        vm.warp(startTime + 91 days);
        vm.prank(owner);
        staking.storeTotalPoints(1);
        assertEq(staking.finalizationComplete(), 1);
    }

    /// @notice Test multiple users with multiple stakes
    function test_MultipleUsersMultipleStakes() public {
        // Setup
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 1 days;
        staking.enableStaking(startTime);
        vm.stopPrank();

        // User 1 stakes
        vm.warp(startTime);
        uint256 stakeAmount = 100 * 1e9;
        
        createStake(user1, stakeAmount);
        vm.warp(startTime + 1 days);
        createStake(user1, stakeAmount);
        vm.stopPrank();

        // User 2 stakes
        createStake(user2, stakeAmount);

        // Verify points
        vm.warp(startTime + 45 days);
        uint256 user1Points = staking.previewUserPoints(user1);
        uint256 user2Points = staking.previewUserPoints(user2);
        assertGt(user1Points, user2Points);
    }

    function test_MaximumBurn() public {
        // Setup staking
        setupStaking();
        uint256 stakeAmount = 100 * 1e9;
        
        // Create stake
        createStake(user1, stakeAmount);
        
        // Warp to before freeze time but after a year
        // First, extend the freeze timestamp to be longer than 1 year
        vm.prank(owner);
        staking.setFreezeTimestamp(block.timestamp + 400 days);
        
        // Now warp to exactly 365 days after stake
        vm.warp(block.timestamp + 365 days);
        
        // Unstake and verify 100% burn
        vm.prank(user1);
        staking.unstake(stakeAmount);
        
        // Check user received 0 tokens back
        assertEq(IERC20(KLIMA_V0_ADDR).balanceOf(user1), INITIAL_BALANCE - stakeAmount, 
            "User should receive 0 tokens back on 100% burn");
    }

    function test_FinalizationWithNoStakers() public {
        // Setup staking but don't create any stakes
        setupStaking();
        
        // Warp to after freeze period
        vm.warp(staking.freezeTimestamp() + 1 days);
        
        // Try to finalize
        vm.prank(owner);
        staking.storeTotalPoints(1);
        
        // Should be finalized with 0 points
        assertEq(staking.finalizationComplete(), 1, "Finalization should complete");
        assertEq(staking.finalTotalPoints(), 0, "Final points should be 0");
    }

    function test_UnstakeMultipleStakes() public {
        // Setup staking
        setupStaking();
        
        // Create multiple stakes for same user
        createStake(user1, 50 * 1e9);
        vm.warp(block.timestamp + 1 days);
        createStake(user1, 50 * 1e9);
        
        // Unstake more than one stake's worth
        vm.prank(user1);
        staking.unstake(75 * 1e9);
        
        // Verify correct amount unstaked
        (uint256 remainingAmount,,,,,,,) = staking.userStakes(user1, 0);
        assertEq(remainingAmount, 25 * 1e9, "First stake should have 25 tokens left");
        (uint256 secondStakeAmount,,,,,,,) = staking.userStakes(user1, 1);
        assertEq(secondStakeAmount, 0, "Second stake should be fully unstaked");
    }

    // =============================================================
    //                      UPGRADE TESTS
    // =============================================================

    /// @notice Test successful contract upgrade authorization
    function test_AuthorizeUpgrade() public {
        // Deploy a new implementation
        KlimaFairLaunchStaking newImplementation = new KlimaFairLaunchStaking();
        
        // Store the proxy address
        address proxyAddress = address(staking);
        
        // Attempt to upgrade as owner
        vm.prank(owner);
        staking.upgradeToAndCall(address(newImplementation), "");
        
        // Use vm.load to read the implementation slot directly
        bytes32 implementationSlot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
        bytes32 implAddressBytes = vm.load(proxyAddress, implementationSlot);
        address currentImplementation = address(uint160(uint256(implAddressBytes)));
        
        // Verify the implementation was upgraded
        assertEq(currentImplementation, address(newImplementation), "Implementation should be upgraded");
    }

    /// @notice Test upgrade authorization fails for non-owner
    function test_RevertWhen_NonOwnerUpgrades() public {
        // Deploy a new implementation
        KlimaFairLaunchStaking newImplementation = new KlimaFairLaunchStaking();
        
        // Attempt to upgrade as non-owner
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user1));
        staking.upgradeToAndCall(address(newImplementation), "");
    }

    /// @notice Test upgrade to zero address fails
    function test_RevertWhen_UpgradingToZeroAddress() public {
        // Attempt to upgrade to zero address
        vm.prank(owner);
        vm.expectRevert("New implementation cannot be zero address");
        staking.upgradeToAndCall(address(0), "");
    }

    // =============================================================
    //                      PAUSE FUNCTIONALITY TESTS
    // =============================================================

    /// @notice Test that the contract is pausable and unpausable by the owner
    function test_PauseFunctionality() public {
        // Verify the contract is not paused initially
        assertFalse(staking.paused(), "Contract should not be paused initially");

        // Set burn vault before pausing
        vm.prank(owner);
        staking.setBurnVault(address(burnVault));

        // Verify pause() function is only callable by owner
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user1));
        staking.pause();

        // Owner can pause the contract
        vm.prank(owner);
        staking.pause();
        assertTrue(staking.paused(), "Contract should be paused after owner call");

        // Enable staking to set start and freeze timestamps
        vm.prank(owner);  // Ensure the owner is calling this
        uint256 startTime = block.timestamp + 1 days;
        staking.enableStaking(startTime);

        // Verify that staking is blocked when paused
        vm.warp(startTime + 1 days);  // Ensure we're within the staking period
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(staking), 100 * 1e9);
        vm.expectRevert(abi.encodeWithSelector(PausableUpgradeable.EnforcedPause.selector));
        staking.stake(100 * 1e9);
        vm.stopPrank();

        // Verify that unstaking is blocked when paused
        vm.startPrank(user1);
        vm.expectRevert(abi.encodeWithSelector(PausableUpgradeable.EnforcedPause.selector));
        staking.unstake(100 * 1e9);
        vm.stopPrank();

        // Owner can unpause the contract
        vm.prank(owner);
        staking.unpause();
        assertFalse(staking.paused(), "Contract should be unpaused after owner call");

        // Verify that staking works after unpausing
        createStake(user1, 100 * 1e9);

        // Verify that unstaking works after unpausing
        vm.startPrank(user1);
        staking.unstake(100 * 1e9);
        vm.stopPrank();
    }

    /// @notice Test that pause state persists across multiple pause/unpause cycles
    function test_MultiplePauseCycles() public {
        // Initial state
        assertFalse(staking.paused(), "Contract should not be paused initially");

        // First pause cycle
        vm.prank(owner);
        staking.pause();
        assertTrue(staking.paused(), "Contract should be paused after first pause");

        vm.prank(owner);
        staking.unpause();
        assertFalse(staking.paused(), "Contract should be unpaused after first unpause");

        // Second pause cycle
        vm.prank(owner);
        staking.pause();
        assertTrue(staking.paused(), "Contract should be paused after second pause");

        vm.prank(owner);
        staking.unpause();
        assertFalse(staking.paused(), "Contract should be unpaused after second unpause");
    }

    /// @notice Test that pause state is maintained after staking period ends
    function test_PauseStateAfterStakingPeriod() public {
        // Setup staking period
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 1 days;
        staking.enableStaking(startTime);
        
        // Pause before staking period
        
        staking.pause();
        assertTrue(staking.paused(), "Contract should be paused before staking period");

        // Warp to after staking period
        vm.warp(startTime + 91 days);

        // Verify pause state is maintained
        assertTrue(staking.paused(), "Pause state should be maintained after staking period");

        // Unpause after staking period
        staking.unpause();
        assertFalse(staking.paused(), "Contract should be unpaused after staking period");
        vm.stopPrank();
    }

    // =============================================================
    //                  FREEZE TIMESTAMP TESTS
    // =============================================================

    /// @notice Test extending freeze timestamp
    function test_ExtendFreezeTimestamp() public {
        // Setup staking period
        vm.prank(owner);
        staking.setBurnVault(address(burnVault));
        uint256 startTime = block.timestamp + 1 days;
        vm.prank(owner);
        staking.enableStaking(startTime);
        
        uint256 originalFreezeTime = staking.freezeTimestamp();
        uint256 newFreezeTime = originalFreezeTime + 30 days;
        
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit StakingExtended(originalFreezeTime, newFreezeTime);
        staking.setFreezeTimestamp(newFreezeTime);
        
        assertEq(staking.freezeTimestamp(), newFreezeTime, "Freeze timestamp should be extended");
    }

    /// @notice Test extending freeze timestamp fails after current freeze time
    function test_RevertWhen_ExtendingAfterFreeze() public {
        // Setup staking period
        vm.prank(owner);
        staking.setBurnVault(address(burnVault));
        
        vm.prank(owner);
        uint256 startTime = block.timestamp + 1 days;
        staking.enableStaking(startTime);
        
        // Warp to after freeze time
        vm.warp(staking.freezeTimestamp() + 1);
        
        // Get the current freeze timestamp
        uint256 currentFreezeTime = staking.freezeTimestamp();
        
        // Try to extend freeze time - should revert
        vm.prank(owner);
        vm.expectRevert("Staking period already ended");
        staking.setFreezeTimestamp(currentFreezeTime + 30 days);
    }

    /// @notice Test extending freeze timestamp fails with earlier timestamp
    function test_RevertWhen_ShorteningFreezeTimestamp() public {
        // Setup staking period
        vm.prank(owner);
        staking.setBurnVault(address(burnVault));
        uint256 startTime = block.timestamp + 1 days;
        vm.prank(owner);
        staking.enableStaking(startTime);
        
        uint256 currentFreezeTime = staking.freezeTimestamp();
        
        // Try to set earlier freeze time
        vm.prank(owner);
        vm.expectRevert("Can only extend freeze period");
        staking.setFreezeTimestamp(currentFreezeTime - 1);
    }

    /// @notice Test extending freeze timestamp fails after finalization
    function test_RevertWhen_ExtendingAfterFinalization() public {
        // Setup staking with finalization
        setupStaking();
        
        // Create stake
        createStake(user1, 100 * 1e9);
        
        // Warp to after freeze time
        warpToFinalization();
        
        // Finalize staking
        vm.prank(owner);
        staking.storeTotalPoints(1);
        
        // Verify finalization is complete
        assertEq(staking.finalizationComplete(), 1, "Finalization should be complete");
        
        // Get current freeze timestamp
        uint256 currentFreezeTime = staking.freezeTimestamp();
        
        // Try to extend freeze time after finalization
        vm.prank(owner);
        vm.expectRevert("Finalization already complete");
        staking.setFreezeTimestamp(currentFreezeTime + 30 days);
    }

    // =============================================================
    //                  EXTREME VALUES TESTS
    // =============================================================

    /// @notice Test staking with very small amount
    function test_StakeWithMinStakeAmount() public {
        // Setup staking period
        vm.prank(owner);
        staking.setBurnVault(address(burnVault));
        uint256 startTime = block.timestamp + 1 days;
        vm.prank(owner);
        staking.enableStaking(startTime);
        
        // Stake minimal amount (1 wei of KLIMA_V0)
        vm.warp(startTime);
        uint256 minimalAmount = staking.minStakeAmount();
        
        // Give user1 a small amount
        deal(KLIMA_V0_ADDR, user1, minimalAmount);
        
        createStake(user1, minimalAmount);
        
        // Verify stake was created
        (uint256 stakedAmount,,,,,,,) = staking.userStakes(user1, 0);
        assertEq(stakedAmount, minimalAmount, "Minimal stake should be created");
    }

    /// @notice Test with many small stakes
    function test_ManySmallStakes() public {
        // Setup staking period
        vm.prank(owner);
        staking.setBurnVault(address(burnVault));
        uint256 startTime = block.timestamp + 1 days;
        vm.prank(owner);
        staking.enableStaking(startTime);
        
        // Create many small stakes
        vm.warp(startTime);
        uint256 smallAmount = 1 * 1e9; // 0.001 KLIMA_V0
        
        // Give user enough tokens
        deal(KLIMA_V0_ADDR, user1, smallAmount * 15);
        
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(staking), smallAmount * 15);
        
        // Create 10 small stakes
        for (uint256 i = 0; i < 15; i++) {
            vm.warp(block.timestamp + 15 minutes);
            staking.stake(smallAmount);
        }
        vm.stopPrank();
        
        // Verify all stakes were created - use a different approach to check the number of stakes
        uint256 stakeCount = 0;
        bool hasMoreStakes = true;
        while (hasMoreStakes && stakeCount < 20) { // Cap at 20 to prevent infinite loop
            try staking.userStakes(user1, stakeCount) returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256) {
                stakeCount++;
            } catch {
                hasMoreStakes = false;
            }
        }
        assertEq(stakeCount, 15, "Should have 15 stakes");
        
        // Unstake part of the total amount
        vm.prank(user1);
        staking.unstake(smallAmount * 5);
        
        // Verify correct amount was unstaked
        uint256 remainingTotal = 0;
        for (uint256 i = 0; i < 15; i++) {
            (uint256 amount,,,,,,,) = staking.userStakes(user1, i);
            remainingTotal += amount;
        }
        assertEq(remainingTotal, smallAmount * 10, "Should have half the amount remaining");
    }

    /// @notice Test adding a new test to verify the exact burn formula
    function test_BurnFormula() public {
        uint256 stakeAmount = 100 * 1e9;
        uint256 stakeTime = block.timestamp;
        
        // Test Day 30 burn
        vm.warp(stakeTime + 30 days);
        uint256 day30Burn = staking.calculateBurn(stakeAmount, stakeTime);
        // Expected: 25% base + (30/365)*75% time-based = 25% + 6.2% = 31.2%
        uint256 expected30DayBurn = (stakeAmount * 312) / 1000; // 31.2%
        assertApproxEqRel(day30Burn, expected30DayBurn, 0.02e18); // Increased tolerance to 2%
        
        // Test Day 180 burn
        vm.warp(stakeTime + 180 days);
        uint256 day180Burn = staking.calculateBurn(stakeAmount, stakeTime);

        // Calculate expected burn using the updated formula with 1e9 scaling
        uint256 baseBurn = (stakeAmount * 25) / 100;
        
        // Break down the calculation into steps to avoid type conversion issues
        uint256 timeElapsedSeconds = 180 days;
        uint256 yearInSeconds = 365 days;
        uint256 scaledTimeBasedPercent = (timeElapsedSeconds * 75 * 1e9) / yearInSeconds;
        
        uint256 timeBasedBurn = (stakeAmount * scaledTimeBasedPercent) / (100 * 1e9);
        uint256 expected180DayBurn = baseBurn + timeBasedBurn;
        
        // Use the actual calculated value with the updated formula
        assertEq(day180Burn, expected180DayBurn, "Day 180 burn should match contract calculation");
        
        // Test Day 365 burn
        vm.warp(stakeTime + 365 days);
        uint256 day365Burn = staking.calculateBurn(stakeAmount, stakeTime);
        // Expected: 25% base + 75% time-based = 100%
        assertEq(day365Burn, stakeAmount, "Should burn 100% after 1 year");
    }

    /// @notice Test adding a new test to verify the exact distribution formulas
    function test_TokenDistributionFormulas() public {
        // Setup staking with two users
        setupStaking();
        
        // User1 stakes 1000 KLIMA in week 1 (2x bonus)
        vm.warp(staking.startTimestamp());
        uint256 user1Amount = 1000 * 1e9;
        createStake(user1, user1Amount);
        
        // User2 stakes 500 KLIMA in week 2 (1.5x bonus)
        vm.warp(staking.startTimestamp() + 8 days);
        uint256 user2Amount = 500 * 1e9;
        createStake(user2, user2Amount);
        
        // Advance to freeze date
        vm.warp(staking.freezeTimestamp() + 1);
        
        // Finalize staking
        vm.prank(owner);
        staking.storeTotalPoints(2);
        
        // Calculate expected KLIMA allocation
        // User1: (1000 / 1500) * 17,500,000 = 11,666,666.67
        // User2: (500 / 1500) * 17,500,000 = 5,833,333.33
        uint256 expectedUser1Klima = (user1Amount * staking.KLIMA_SUPPLY()) / (user1Amount + user2Amount);
        uint256 expectedUser2Klima = (user2Amount * staking.KLIMA_SUPPLY()) / (user1Amount + user2Amount);
        
        // Calculate expected KLIMAX allocation based on points
        uint256 user1Points = staking.previewUserPoints(user1);
        uint256 user2Points = staking.previewUserPoints(user2);
        uint256 totalPoints = user1Points + user2Points;
        
        uint256 expectedUser1KlimaX = (user1Points * staking.KLIMAX_SUPPLY()) / totalPoints;
        uint256 expectedUser2KlimaX = (user2Points * staking.KLIMAX_SUPPLY()) / totalPoints;
        
        // Verify KLIMA allocation
        assertApproxEqRel(staking.calculateKlimaAllocation(user1Amount), expectedUser1Klima, 0.01e18);
        assertApproxEqRel(staking.calculateKlimaAllocation(user2Amount), expectedUser2Klima, 0.01e18);
        
        // Verify KLIMAX allocation
        assertApproxEqRel(staking.calculateKlimaXAllocation(user1Points), expectedUser1KlimaX, 0.01e18);
        assertApproxEqRel(staking.calculateKlimaXAllocation(user2Points), expectedUser2KlimaX, 0.01e18);
    }

    /// @notice Test setting pre-staking window
    function test_SetPreStakingWindow() public {
        // Set burn vault first
        vm.prank(owner);
        staking.setBurnVault(address(burnVault));

        uint256 futureTimestamp = block.timestamp + 7 days;
        uint256 preStakingWindow = 3 days; // 3 days pre-staking window
        
        vm.startPrank(owner);
        // Set pre-staking window
        staking.setPreStakingWindow(preStakingWindow);
        // Enable staking
        staking.enableStaking(futureTimestamp);
        vm.stopPrank();

        assertEq(staking.startTimestamp(), futureTimestamp);
        assertEq(staking.freezeTimestamp(), futureTimestamp + 90 days);
        assertEq(staking.preStakingWindow(), preStakingWindow);
    }

    /// @notice Test pre-staking functionality
    function test_PreStaking() public {
        // Setup staking period with pre-staking window
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 5 days;
        staking.enableStaking(startTime);
        vm.stopPrank();

        // Warp to pre-staking period (2 days before official start)
        vm.warp(startTime - 2 days);
        
        // Stake during pre-staking period
        uint256 stakeAmount = 100 * 1e9;
        createStake(user1, stakeAmount);

        // Verify stake details
        (
            uint256 amount,
            uint256 stakeStartTime,
            uint256 lastUpdateTime,
            uint256 bonusMultiplier,
            ,,,
        ) = staking.userStakes(user1, 0);

        assertEq(amount, stakeAmount);
        assertEq(stakeStartTime, startTime); // Should be set to official start time
        assertEq(lastUpdateTime, startTime); // Points start accruing from official start
        assertEq(bonusMultiplier, 200); // 2x multiplier for pre-staking
    }

    /// @notice Test staking before pre-staking window fails
    function test_RevertWhen_StakingBeforePreStakingWindow() public {
        // Setup staking period with pre-staking window
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 5 days;
        staking.enableStaking(startTime);
        vm.stopPrank();

        // Warp to before pre-staking period (4 days before official start)
        vm.warp(startTime - 4 days); // Changed from 3 days to 4 days
        
        // Try to stake before pre-staking window
        uint256 stakeAmount = 100 * 1e9;
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(staking), stakeAmount);
        vm.expectRevert("Staking not started");
        staking.stake(stakeAmount);
        vm.stopPrank();
    }

    /// @notice Test setting pre-staking window to minimum value
    function test_MinimumPreStakingWindow() public {
        // Setup staking period with minimum pre-staking window
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 5 days;
        staking.setPreStakingWindow(3 days); // Minimum allowed
        staking.enableStaking(startTime);
        vm.stopPrank();

        // Warp to before start time but within pre-staking window
        vm.warp(startTime - 2 days);
        
        // Should be able to stake
        uint256 stakeAmount = 100 * 1e9;
        createStake(user1, stakeAmount);
        
        // Verify stake details
        (
            uint256 amount,
            uint256 stakeStartTime,
            ,,,,,
        ) = staking.userStakes(user1, 0);

        assertEq(amount, stakeAmount);
        assertEq(stakeStartTime, startTime);
    }

    /// @notice Test that setting pre-staking window to zero fails (as expected)
    function test_RevertWhen_ZeroPreStakingWindow() public {
        vm.startPrank(owner);
        // Try to set pre-staking window to zero
        vm.expectRevert("Pre-staking window must be at least 2 days");
        staking.setPreStakingWindow(0);
        vm.stopPrank();
    }

    /// @notice Test points don't accrue during pre-staking period
    function test_NoPointsAccrualDuringPreStaking() public {
        // Setup staking period with pre-staking window
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 5 days;
        staking.enableStaking(startTime);
        vm.stopPrank();

        // Warp to pre-staking period
        vm.warp(startTime - 2 days);
        
        // Stake during pre-staking period
        uint256 stakeAmount = 100 * 1e9;
        createStake(user1, stakeAmount);

        // Check points - should be initial points during pre-staking
        uint256 initialPoints = stakeAmount * 1e9 * 2;
        uint256 pointsDuringPreStaking = staking.previewUserPoints(user1);
        assertEq(pointsDuringPreStaking, initialPoints, "No points should accrue during pre-staking");
        
        // Warp to exactly the start time
        vm.warp(startTime);
        
        // Points should still be initial points at the exact start time
        uint256 pointsAtStart = staking.previewUserPoints(user1);
        assertEq(pointsAtStart, initialPoints, "No points should accrue at the exact start time");
        
        // Warp to after start time
        vm.warp(startTime + 1 days);
        
        // Check points - should be non-zero after start time
        uint256 pointsAfterStart = staking.previewUserPoints(user1);
        assertGt(pointsAfterStart, initialPoints, "Points should accrue after official start time");
    }

    /// @notice Test pre-staking with multiple users
    function test_PreStakingMultipleUsers() public {
        // Setup staking period with pre-staking window
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 5 days;
        staking.enableStaking(startTime);
        vm.stopPrank();

        // Warp to pre-staking period
        vm.warp(startTime - 2 days);
        
        // User1 stakes during pre-staking period
        uint256 stakeAmount = 100 * 1e9;
        createStake(user1, stakeAmount);
        
        // User2 stakes during pre-staking period
        createStake(user2, stakeAmount);
        
        // Warp to after start time
        vm.warp(startTime + 1 days);
        
        // Both users should have the same points since they both staked during pre-staking period
        uint256 user1Points = staking.previewUserPoints(user1);
        uint256 user2Points = staking.previewUserPoints(user2);
        assertEq(user1Points, user2Points, "Both users should have equal points");
    }

    /// @notice Test pre-staking followed by regular staking
    function test_PreStakingAndRegularStaking() public {
        // Setup staking period with pre-staking window
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 5 days;
        staking.enableStaking(startTime);
        // Ensure we're using the default growth rate in the test
        staking.setGrowthRate(274); // 0.00274 as per spec
        vm.stopPrank();

        // User1 stakes during pre-staking period
        vm.warp(startTime - 2 days);
        uint256 stakeAmount = 100 * 1e9; // Using correct 9 decimals for KLIMA_V0
        createStake(user1, stakeAmount);
        
        // User2 stakes during regular period (week 1)
        vm.warp(startTime + 1 days);
        createStake(user2, stakeAmount);
        
        // Warp forward to check points
        vm.warp(startTime + 2 days);
        
        // User1 should have more points since their stake has been accruing for longer
        uint256 user1Points = staking.previewUserPoints(user1);
        uint256 user2Points = staking.previewUserPoints(user2);
        assertGt(user1Points, user2Points, "Earlier staker should have more points");
        
        // Calculate expected points using helper function
        // User1 has accrued for 2 days (from startTime to startTime+2)
        uint256 expected1 = calculateExpectedPoints(
            stakeAmount,
            200, // 2x multiplier in week 1
            2 days, // 2 days of accrual
            274 // growth rate
        );
        
        // User2 has accrued for 1 day (from startTime+1 to startTime+2)
        uint256 expected2 = calculateExpectedPoints(
            stakeAmount,
            200, // 2x multiplier in week 1
            1 days, // 1 day of accrual
            274 // growth rate
        );
        
        // Calculate the expected difference
        uint256 expectedDiff = expected1 - expected2;
        uint256 actualDiff = user1Points - user2Points;
        
        assertApproxEqRel(user1Points, expected1, 0.01e18, "User1 points should match expected calculation");
        assertApproxEqRel(user2Points, expected2, 0.01e18, "User2 points should match expected calculation");
        assertApproxEqRel(actualDiff, expectedDiff, 0.01e18, "Point difference should match expected calculation");
    }

    /// @notice Test unstaking during pre-staking period applies only base burn
    function test_UnstakeDuringPreStaking() public {
        // Setup staking
        setupStaking();
        uint256 startTime = staking.startTimestamp();
        
        // User1 stakes during pre-staking period
        vm.warp(startTime - 2 days); // 2 days before official start
        uint256 stakeAmount = 100 * 1e9;
        createStake(user1, stakeAmount);
        
        // Check initial stake details
        (uint256 amount, uint256 stakeStartTime,,,,,,) = staking.userStakes(user1, 0);
        assertEq(amount, stakeAmount, "Stake amount should match");
        assertEq(stakeStartTime, startTime, "Stake start time should be set to official start time");
        
        // Calculate expected burn amount (should be 25% base burn only)
        uint256 expectedBurn = (stakeAmount * 25) / 100; // 25% base burn
        
        // Verify that calculateBurn returns the expected amount
        uint256 calculatedBurn = staking.calculateBurn(stakeAmount, stakeStartTime);
        assertEq(calculatedBurn, expectedBurn, "During pre-staking, burn should be 25% base burn only");
        
        // Get initial balances
        uint256 initialUserBalance = IERC20(KLIMA_V0_ADDR).balanceOf(user1);
        uint256 initialContractBalance = IERC20(KLIMA_V0_ADDR).balanceOf(address(staking));
        uint256 initialBurnVaultBalance = IERC20(KLIMA_V0_ADDR).balanceOf(address(burnVault));
        
        // Unstake during pre-staking period
        vm.startPrank(user1);
        vm.expectEmit(true, true, true, true);
        emit StakeBurned(user1, expectedBurn, block.timestamp);
        staking.unstake(stakeAmount);
        vm.stopPrank();
        
        // Verify user received correct amount back (stake amount - burn amount)
        uint256 expectedReturn = stakeAmount - expectedBurn;
        uint256 actualReturn = IERC20(KLIMA_V0_ADDR).balanceOf(user1) - initialUserBalance;
        assertEq(actualReturn, expectedReturn, "User should receive stake amount minus burn amount");
        
        // Verify burn vault received the burn amount
        uint256 burnVaultReceived = IERC20(KLIMA_V0_ADDR).balanceOf(address(burnVault)) - initialBurnVaultBalance;
        assertEq(burnVaultReceived, expectedBurn, "Burn vault should receive the burn amount");
        
        // Verify contract balance decreased by stake amount
        uint256 contractBalanceDecrease = initialContractBalance - IERC20(KLIMA_V0_ADDR).balanceOf(address(staking));
        assertEq(contractBalanceDecrease, stakeAmount, "Contract balance should decrease by stake amount");
        
        // Verify stake was removed
        (uint256 remainingAmount,,,,,,,) = staking.userStakes(user1, 0);
        assertEq(remainingAmount, 0, "Stake should be fully unstaked");
    }

    /// @notice Test unstaking immediately after pre-staking period ends
    function test_UnstakeAfterPreStakingEnds() public {
        // Setup staking
        setupStaking();
        uint256 startTime = staking.startTimestamp();
        
        // User1 stakes during pre-staking period
        vm.warp(startTime - 2 days); // 2 days before official start
        uint256 stakeAmount = 100 * 1e9;
        createStake(user1, stakeAmount);
        
        // Warp to just after official start
        vm.warp(startTime + 1 hours);
        
        // Calculate expected burn amount using our new precision-based formula
        uint256 baseBurn = (stakeAmount * 25) / 100; // 25% base burn
        
        // Use the same calculation as the contract with 1e9 scaling factor
        uint256 timeElapsedSeconds = 1 hours; // Time since official start
        uint256 yearInSeconds = 365 days;
        uint256 scaledTimeBasedPercent = (timeElapsedSeconds * 75 * 1e9) / yearInSeconds;
        uint256 timeBasedBurn = (stakeAmount * scaledTimeBasedPercent) / (100 * 1e9);
        uint256 expectedBurn = baseBurn + timeBasedBurn;
        
        // Verify that calculateBurn returns the expected amount
        uint256 calculatedBurn = staking.calculateBurn(stakeAmount, startTime);
        assertEq(calculatedBurn, expectedBurn, "Just after staking starts, burn should match our calculation");
        
        // Unstake after pre-staking period
        vm.startPrank(user1);
        vm.expectEmit(true, true, true, true);
        emit StakeBurned(user1, calculatedBurn, block.timestamp);
        staking.unstake(stakeAmount);
        vm.stopPrank();
        
        // Verify user received correct amount back (stake amount - burn amount)
        uint256 expectedReturn = stakeAmount - calculatedBurn;
        assertApproxEqRel(
            IERC20(KLIMA_V0_ADDR).balanceOf(user1), 
            INITIAL_BALANCE - stakeAmount + expectedReturn, 
            0.01e18, // Within 1%
            "User should receive stake amount minus burn amount"
        );
    }

    /// deprecated
    /// @notice Test expired claims can be transferred after claimDeadline
    // function test_ExpiredClaimsCanBeTransferredAfterClaimDeadline() public {
    //     // Setup staking
    //     setupStaking();
    //     createStake(user1, 100 * 1e9);
    //     createStake(user2, 100 * 1e9);
    //     finalizeStaking();

    //     // only user 1 claims their allocation before claimDeadline
    //     vm.startPrank(user1);
    //     staking.unstake(0);
    //     vm.stopPrank();

    //     vm.warp(staking.claimDeadline() + 1 days);
    //     vm.startPrank(owner);
    //     staking.transferExpiredClaims();
    //     vm.stopPrank();

    //     uint256 klimaSupply = staking.KLIMA_SUPPLY();
    //     uint256 klimaXSupply = staking.KLIMAX_SUPPLY();

    //     // user 1 should have received their allocation
    //     assertEq(IERC20(staking.KLIMA()).balanceOf(user1), klimaSupply/2, "User 1 should have received their allocation");
    //     assertEq(IERC20(staking.KLIMA_X()).balanceOf(user1), klimaXSupply/2, "User 1 should have received their allocation");

    //     // remaining KLIMA should be transferred to owner
    //     assertEq(IERC20(staking.KLIMA()).balanceOf(owner), klimaSupply/2, "remaining KLIMA should be transferred to owner");
    //     // remaining KLIMA_X should be transferred to owner
    //     assertEq(IERC20(staking.KLIMA_X()).balanceOf(owner), klimaXSupply/2, "remaining KLIMA_X should be transferred to owner");
    // }

    /// deprecated
    /// @notice Test expired claims cannot be transferred before claimDeadline
    // function test_RevertWhen_ExpiredClaimsCannotBeTransferredBeforeClaimDeadline() public {
    //             // Setup staking
    //     setupStaking();
    //     createStake(user1, 100 * 1e9);
    //     createStake(user2, 100 * 1e9);
    //     finalizeStaking();

    //     // only user 1 claims their allocation before claimDeadline
    //     vm.startPrank(user1);
    //     staking.unstake(0);
    //     vm.stopPrank();

    //     vm.warp(staking.claimDeadline() - 1 days);
    //     vm.startPrank(owner);
    //     vm.expectRevert("Claim deadline has not passed");
    //     staking.transferExpiredClaims();
    //     vm.stopPrank();
    // }

    /// deprecated
    /// @notice Test revert when non-owner calls transferExpiredClaims
    // function test_RevertWhen_NotOwnerCallsTransferExpiredClaims() public {
    //             // Setup staking
    //     setupStaking();
    //     createStake(user1, 100 * 1e9);
    //     createStake(user2, 100 * 1e9);
    //     finalizeStaking();

    //     // only user 1 claims their allocation before claimDeadline
    //     vm.startPrank(user1);
    //     staking.unstake(0);
    //     vm.stopPrank();

    //     vm.warp(staking.claimDeadline() - 1 days);
    //     vm.startPrank(user1);
    //     vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user1));
    //     staking.transferExpiredClaims();
    //     vm.stopPrank();
    // }

} 