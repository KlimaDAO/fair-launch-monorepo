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
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

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
    address user4;
    address user5;
    address mockKlima;
    address mockKlimaX;
    MockKlimaV0 public klimaV0;
    MockKlima public klimaToken;
    MockKlimaX public klimaXToken;
    uint256 public constant INITIAL_BALANCE = 1000 * 1e9; // 1000 KLIMA
    address constant KLIMA_V0_ADDR = 0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2;

    // Events
    event StakeCreated(address indexed user, uint256 amount, uint256 multiplier, uint256 startTimestamp);
    event StakeBurned(address indexed user, uint256 burnAmount, uint256 timestamp);
    event Claimed(address indexed user, uint256 klimaAmount, uint256 klimaXAmount);
    event FinalizationComplete();
    event TokenAddressesSet(address indexed klima, address indexed klimax);
    event StakingEnabled(uint256 startTimestamp, uint256 freezeTimestamp);
    event StakingExtended(uint256 oldFreezeTimestamp, uint256 newFreezeTimestamp);
    event BurnVaultSet(address indexed burnVault);
    event GrowthRateSet(uint256 newValue);
    event KlimaSupplySet(uint256 newValue);
    event KlimaXSupplySet(uint256 newValue);

    function setUp() public {
        // Create and select Base fork
        uint256 baseFork = vm.createFork("base");
        vm.selectFork(baseFork);
        
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");
        user4 = makeAddr("user4");
        user5 = makeAddr("user5");

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
        deal(KLIMA_V0_ADDR, user4, INITIAL_BALANCE);
        deal(KLIMA_V0_ADDR, user5, INITIAL_BALANCE);

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
    }

    function stakeMultipleTimes(address user, uint256 count) public {
        // Use a minimal stake amount to maximize number of stakes created
        uint256 tinyStakeAmount = staking.minStakeAmount(); // Very small amount
        vm.startPrank(user);
        IERC20(KLIMA_V0_ADDR).approve(address(staking), tinyStakeAmount * count);

        for (uint256 i = 0; i < count; i++) {
            // Each stake creates additional entries in the user's stake array
            staking.stake(tinyStakeAmount);

            // Optional: Add minor time variation to simulate real-world scenario
            // Also helps ensure each stake has slightly different timestamps/points
            vm.warp(block.timestamp + 1 minutes);
        }
    }

    function test_DOSMitigationLimits() public {
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 1 days;
        staking.enableStaking(startTime);
        vm.stopPrank();
        vm.warp(startTime);
        createStake(user1, 100e9);
        createStake(user2, 100e9);
        deal(KLIMA_V0_ADDR, user3, 1000e9);
        vm.startPrank(user3);
        IERC20(KLIMA_V0_ADDR).approve(address(staking), 1000e9);
        uint256 maxStakes = staking.maxTotalStakesPerUser();
        stakeMultipleTimes(user3, maxStakes);
        vm.stopPrank();
        createStake(user4, 100e9);
        createStake(user5, 100e9);
        vm.warp(block.timestamp + 100 days);
        uint256 gasBefore = gasleft();
        vm.startPrank(owner);
        staking.storeTotalPoints(5);
        uint256 gasAfter = gasleft();
        uint256 gasConsumed = gasBefore - gasAfter;
        console.log("gas consumed", gasConsumed);
    }

    function test_RevertIfMaxStakesReached() public {
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 1 days;
        staking.enableStaking(startTime);
        vm.stopPrank();
        vm.warp(startTime);
        deal(KLIMA_V0_ADDR, user1, 1000e9);
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(staking), 1000e9);
        uint256 maxStakes = staking.maxTotalStakesPerUser();
        stakeMultipleTimes(user1, maxStakes);
        vm.expectRevert("Max total stakes per user reached");
        staking.stake(1e9);
        vm.stopPrank();
    }

    function test_RevertIfMinStakeAmountNotMet() public {
        vm.startPrank(owner);
        uint256 startTime = block.timestamp + 1 days;
        console.log("minStakeAmount", staking.minStakeAmount());
        staking.enableStaking(startTime);
        vm.stopPrank();
        vm.warp(startTime);
        deal(KLIMA_V0_ADDR, user1, 1000e9);
        vm.startPrank(user1);
        IERC20(KLIMA_V0_ADDR).approve(address(staking), 1000e9);
        uint256 minStakeAmount = staking.minStakeAmount();
        vm.expectRevert("Amount must be greater than or equal to minStakeAmount");
        staking.stake(minStakeAmount - 1);
        vm.stopPrank();
    }

}