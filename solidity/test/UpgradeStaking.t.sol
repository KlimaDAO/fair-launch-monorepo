// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {KlimaFairLaunchStaking} from "../src/KlimaFairLaunchStaking.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {UD60x18} from "@prb/math/UD60x18.sol";

/**
 * @title UpgradeStakingTest
 * @notice Test suite to verify KlimaFairLaunchStaking upgrade
 * @dev Uses forked testing to verify state variables are preserved
 */
contract UpgradeStakingTest is Test {
    // Existing proxy address on Base
    address public constant STAKING_PROXY = 0xea8a59D0bf9C05B437c6a5396cfB429F1A57B682;

    // Contract instances
    KlimaFairLaunchStaking public proxy;
    KlimaFairLaunchStaking public newImplementation;

    // Storage for test data to avoid stack depth issues
    uint256 public beforeValue;
    uint256 public afterValue;
    address public beforeAddress;
    address public afterAddress;

    // Storage for random staker selection
    uint256 public selectedStakerIndex;
    address public selectedStaker;
    uint256 public selectedStakeIndex;

    // Storage for stake data
    uint256 public beforeStakeAmount;
    uint256 public afterStakeAmount;
    uint256 public beforeStakeStartTime;
    uint256 public afterStakeStartTime;
    uint256 public beforeLastUpdateTime;
    uint256 public afterLastUpdateTime;
    uint256 public beforeBonusMultiplier;
    uint256 public afterBonusMultiplier;
    uint256 public beforeOrganicPoints;
    uint256 public afterOrganicPoints;
    uint256 public beforeBurnRatioSnapshot;
    uint256 public afterBurnRatioSnapshot;
    uint256 public beforeBurnAccrued;
    uint256 public afterBurnAccrued;
    uint256 public beforeHasBeenClaimed;
    uint256 public afterHasBeenClaimed;

    function setUp() public {
        // Fork Base mainnet
        vm.createSelectFork(vm.envString("BASE_RPC_URL"));

        // Get proxy instance
        proxy = KlimaFairLaunchStaking(STAKING_PROXY);

        // Deploy new implementation
        newImplementation = new KlimaFairLaunchStaking();

        // Select a random staker if any exist
        uint256 stakerCount = proxy.getTotalStakerAddresses();
        if (stakerCount > 0) {
            // Use a hash of block timestamp and number for randomness
            uint256 randomSeed = uint256(keccak256(abi.encodePacked(block.timestamp, block.number)));
            selectedStakerIndex = randomSeed % stakerCount;
            selectedStaker = proxy.stakerAddresses(selectedStakerIndex);

            // Also select a random stake if this staker has any
            uint256 stakeCount = proxy.getUserStakeCount(selectedStaker);
            if (stakeCount > 0) {
                selectedStakeIndex = (randomSeed / 100) % stakeCount;
            }
        }
    }

    function upgradeProxy() internal {
        vm.prank(proxy.owner());
        console.log("Upgrading proxy to new implementation");
        //current proxy address
        console.log("Current proxy address:", address(proxy));
        // get current implementation address from proxy
        bytes32 implementationSlot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
        address currentImplementation = address(uint160(uint256(vm.load(address(proxy), implementationSlot))));
        console.log("Current implementation address:", currentImplementation);
        proxy.upgradeToAndCall(address(newImplementation), "");
        console.log("New implementation:", address(newImplementation));

        //testing new function to ensure it is new contract
        // try calling transferExpiredClaims
        vm.startPrank(proxy.owner());
        vm.expectRevert("Function deprecated and no longer available");
        proxy.transferExpiredClaims();
        vm.stopPrank();
    }

    // Test total staked preservation
    function test_PreservesTotalStaked() public {
        beforeValue = proxy.totalStaked();
        upgradeProxy();
        afterValue = proxy.totalStaked();

        console.log("=== Total Staked ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "totalStaked changed");
    }

    // Test total organic points preservation
    function test_PreservesTotalOrganicPoints() public {
        beforeValue = proxy.totalOrganicPoints();
        upgradeProxy();
        afterValue = proxy.totalOrganicPoints();

        console.log("=== Total Organic Points ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "totalOrganicPoints changed");
    }

    // Test total burned preservation
    function test_PreservesTotalBurned() public {
        beforeValue = proxy.totalBurned();
        upgradeProxy();
        afterValue = proxy.totalBurned();

        console.log("=== Total Burned ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "totalBurned changed");
    }

    // Test burn ratio preservation
    function test_PreservesBurnRatio() public {
        beforeValue = proxy.burnRatio();
        upgradeProxy();
        afterValue = proxy.burnRatio();

        console.log("=== Burn Ratio ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "burnRatio changed");
    }

    // Test start timestamp preservation
    function test_PreservesStartTimestamp() public {
        beforeValue = proxy.startTimestamp();
        upgradeProxy();
        afterValue = proxy.startTimestamp();

        console.log("=== Start Timestamp ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "startTimestamp changed");
    }

    // Test freeze timestamp preservation
    function test_PreservesFreezeTimestamp() public {
        beforeValue = proxy.freezeTimestamp();
        upgradeProxy();
        afterValue = proxy.freezeTimestamp();

        console.log("=== Freeze Timestamp ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "freezeTimestamp changed");
    }

    // Test pre-staking window preservation
    function test_PreservesPreStakingWindow() public {
        beforeValue = proxy.preStakingWindow();
        upgradeProxy();
        afterValue = proxy.preStakingWindow();

        console.log("=== Pre-Staking Window ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "preStakingWindow changed");
    }

    // Test min stake amount preservation
    function test_PreservesMinStakeAmount() public {
        beforeValue = proxy.minStakeAmount();
        upgradeProxy();
        afterValue = proxy.minStakeAmount();

        console.log("=== Min Stake Amount ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "minStakeAmount changed");
    }

    // Test max total stakes per user preservation
    function test_PreservesMaxTotalStakesPerUser() public {
        beforeValue = proxy.maxTotalStakesPerUser();
        upgradeProxy();
        afterValue = proxy.maxTotalStakesPerUser();

        console.log("=== Max Total Stakes Per User ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "maxTotalStakesPerUser changed");
    }

    // Test burn vault address preservation
    function test_PreservesBurnVault() public {
        beforeAddress = proxy.burnVault();
        upgradeProxy();
        afterAddress = proxy.burnVault();

        console.log("=== Burn Vault Address ===");
        console.log("Before:", beforeAddress);
        console.log("After:", afterAddress);

        assertEq(afterAddress, beforeAddress, "burnVault changed");
    }

    // Test KLIMA address preservation
    function test_PreservesKlimaAddress() public {
        beforeAddress = proxy.KLIMA();
        upgradeProxy();
        afterAddress = proxy.KLIMA();

        console.log("=== KLIMA Address ===");
        console.log("Before:", beforeAddress);
        console.log("After:", afterAddress);

        assertEq(afterAddress, beforeAddress, "KLIMA address changed");
    }

    // Test KLIMA_X address preservation
    function test_PreservesKlimaXAddress() public {
        beforeAddress = proxy.KLIMA_X();
        upgradeProxy();
        afterAddress = proxy.KLIMA_X();

        console.log("=== KLIMA_X Address ===");
        console.log("Before:", beforeAddress);
        console.log("After:", afterAddress);

        assertEq(afterAddress, beforeAddress, "KLIMA_X address changed");
    }

    // Test KLIMA supply preservation
    function test_PreservesKlimaSupply() public {
        beforeValue = proxy.KLIMA_SUPPLY();
        upgradeProxy();
        afterValue = proxy.KLIMA_SUPPLY();

        console.log("=== KLIMA Supply ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "KLIMA_SUPPLY changed");
    }

    // Test KLIMA_X supply preservation
    function test_PreservesKlimaXSupply() public {
        beforeValue = proxy.KLIMAX_SUPPLY();
        upgradeProxy();
        afterValue = proxy.KLIMAX_SUPPLY();

        console.log("=== KLIMA_X Supply ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "KLIMAX_SUPPLY changed");
    }

    // Test KLIMA_V0 address preservation
    function test_PreservesKlimaV0Address() public {
        beforeAddress = proxy.KLIMA_V0();
        upgradeProxy();
        afterAddress = proxy.KLIMA_V0();

        console.log("=== KLIMA_V0 Address ===");
        console.log("Before:", beforeAddress);
        console.log("After:", afterAddress);

        assertEq(afterAddress, beforeAddress, "KLIMA_V0 address changed");
    }

    // Test burn distribution precision preservation
    function test_PreservesBurnDistributionPrecision() public {
        beforeValue = proxy.BURN_DISTRIBUTION_PRECISION();
        upgradeProxy();
        afterValue = proxy.BURN_DISTRIBUTION_PRECISION();

        console.log("=== Burn Distribution Precision ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "BURN_DISTRIBUTION_PRECISION changed");
    }

    // Test staker count preservation
    function test_PreservesStakerCount() public {
        beforeValue = proxy.getTotalStakerAddresses();
        upgradeProxy();
        afterValue = proxy.getTotalStakerAddresses();

        console.log("=== Total Staker Count ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "Total staker addresses count changed");
    }

    // Test selected staker preservation
    function test_PreservesSelectedStaker() public {
        // Skip if no stakers
        uint256 stakerCount = proxy.getTotalStakerAddresses();
        if (stakerCount == 0) return;

        beforeAddress = proxy.stakerAddresses(selectedStakerIndex);
        upgradeProxy();
        afterAddress = proxy.stakerAddresses(selectedStakerIndex);

        console.log("=== Selected Staker Address ===");
        console.log("Staker Index:", selectedStakerIndex);
        console.log("Before:", beforeAddress);
        console.log("After:", afterAddress);

        assertEq(afterAddress, beforeAddress, "Selected staker address changed");
    }

    // Test selected staker's stake count preservation
    function test_PreservesSelectedStakerStakeCount() public {
        // Skip if no stakers
        if (selectedStaker == address(0)) return;

        beforeValue = proxy.getUserStakeCount(selectedStaker);
        upgradeProxy();
        afterValue = proxy.getUserStakeCount(selectedStaker);

        console.log("=== Selected Staker's Stake Count ===");
        console.log("Staker:", selectedStaker);
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "Selected staker stake count changed");
    }

    // Helper function to check if we have stakers with stakes
    function _hasStakesToTest() internal view returns (bool) {
        return selectedStaker != address(0) && proxy.getUserStakeCount(selectedStaker) > 0;
    }

    // Load stake data fields into storage variables
    function _loadStakeData() internal {
        // We split getting the stake data into multiple calls to avoid stack issues
        (beforeStakeAmount, beforeStakeStartTime, beforeLastUpdateTime, beforeBonusMultiplier,,,,) =
            proxy.userStakes(selectedStaker, selectedStakeIndex);

        // Get the remaining fields in a separate call
        (,,,, beforeOrganicPoints, beforeBurnRatioSnapshot, beforeBurnAccrued, beforeHasBeenClaimed) =
            proxy.userStakes(selectedStaker, selectedStakeIndex);
    }

    // Load post-upgrade stake data fields into storage variables
    function _loadPostUpgradeStakeData() internal {
        // We split getting the stake data into multiple calls to avoid stack issues
        (afterStakeAmount, afterStakeStartTime, afterLastUpdateTime, afterBonusMultiplier,,,,) =
            proxy.userStakes(selectedStaker, selectedStakeIndex);

        // Get the remaining fields in a separate call
        (,,,, afterOrganicPoints, afterBurnRatioSnapshot, afterBurnAccrued, afterHasBeenClaimed) =
            proxy.userStakes(selectedStaker, selectedStakeIndex);
    }

    // Test selected staker's selected stake amount
    function test_PreservesStakeAmount() public {
        if (!_hasStakesToTest()) return;

        _loadStakeData();
        upgradeProxy();
        _loadPostUpgradeStakeData();

        console.log("=== Stake Amount ===");
        console.log("Staker:", selectedStaker);
        console.log("Stake Index:", selectedStakeIndex);
        console.log("Before:", beforeStakeAmount);
        console.log("After:", afterStakeAmount);

        assertEq(afterStakeAmount, beforeStakeAmount, "Stake amount changed");
    }

    // Test selected staker's selected stake start time
    function test_PreservesStakeStartTime() public {
        if (!_hasStakesToTest()) return;

        _loadStakeData();
        upgradeProxy();
        _loadPostUpgradeStakeData();

        console.log("=== Stake Start Time ===");
        console.log("Staker:", selectedStaker);
        console.log("Stake Index:", selectedStakeIndex);
        console.log("Before:", beforeStakeStartTime);
        console.log("After:", afterStakeStartTime);

        assertEq(afterStakeStartTime, beforeStakeStartTime, "Stake start time changed");
    }

    // Test selected staker's selected stake last update time
    function test_PreservesLastUpdateTime() public {
        if (!_hasStakesToTest()) return;

        _loadStakeData();
        upgradeProxy();
        _loadPostUpgradeStakeData();

        console.log("=== Stake Last Update Time ===");
        console.log("Staker:", selectedStaker);
        console.log("Stake Index:", selectedStakeIndex);
        console.log("Before:", beforeLastUpdateTime);
        console.log("After:", afterLastUpdateTime);

        assertEq(afterLastUpdateTime, beforeLastUpdateTime, "Last update time changed");
    }

    // Test selected staker's selected stake bonus multiplier
    function test_PreservesBonusMultiplier() public {
        if (!_hasStakesToTest()) return;

        _loadStakeData();
        upgradeProxy();
        _loadPostUpgradeStakeData();

        console.log("=== Stake Bonus Multiplier ===");
        console.log("Staker:", selectedStaker);
        console.log("Stake Index:", selectedStakeIndex);
        console.log("Before:", beforeBonusMultiplier);
        console.log("After:", afterBonusMultiplier);

        assertEq(afterBonusMultiplier, beforeBonusMultiplier, "Bonus multiplier changed");
    }

    // Test selected staker's selected stake organic points
    function test_PreservesOrganicPoints() public {
        if (!_hasStakesToTest()) return;

        _loadStakeData();
        upgradeProxy();
        _loadPostUpgradeStakeData();

        console.log("=== Stake Organic Points ===");
        console.log("Staker:", selectedStaker);
        console.log("Stake Index:", selectedStakeIndex);
        console.log("Before:", beforeOrganicPoints);
        console.log("After:", afterOrganicPoints);

        assertEq(afterOrganicPoints, beforeOrganicPoints, "Organic points changed");
    }

    // Test selected staker's selected stake burn ratio snapshot
    function test_PreservesBurnRatioSnapshot() public {
        if (!_hasStakesToTest()) return;

        _loadStakeData();
        upgradeProxy();
        _loadPostUpgradeStakeData();

        console.log("=== Stake Burn Ratio Snapshot ===");
        console.log("Staker:", selectedStaker);
        console.log("Stake Index:", selectedStakeIndex);
        console.log("Before:", beforeBurnRatioSnapshot);
        console.log("After:", afterBurnRatioSnapshot);

        assertEq(afterBurnRatioSnapshot, beforeBurnRatioSnapshot, "Burn ratio snapshot changed");
    }

    // Test selected staker's selected stake burn accrued
    function test_PreservesBurnAccrued() public {
        if (!_hasStakesToTest()) return;

        _loadStakeData();
        upgradeProxy();
        _loadPostUpgradeStakeData();

        console.log("=== Stake Burn Accrued ===");
        console.log("Staker:", selectedStaker);
        console.log("Stake Index:", selectedStakeIndex);
        console.log("Before:", beforeBurnAccrued);
        console.log("After:", afterBurnAccrued);

        assertEq(afterBurnAccrued, beforeBurnAccrued, "Burn accrued changed");
    }

    // Test selected staker's selected stake has been claimed
    function test_PreservesHasBeenClaimed() public {
        if (!_hasStakesToTest()) return;

        _loadStakeData();
        upgradeProxy();
        _loadPostUpgradeStakeData();

        console.log("=== Stake Has Been Claimed ===");
        console.log("Staker:", selectedStaker);
        console.log("Stake Index:", selectedStakeIndex);
        console.log("Before:", beforeHasBeenClaimed);
        console.log("After:", afterHasBeenClaimed);

        assertEq(afterHasBeenClaimed, beforeHasBeenClaimed, "Has been claimed changed");
    }

    // Add logging function to show which staker and stake are being tested
    function test_LogSelectedStakerAndStake() public {
        if (!_hasStakesToTest()) {
            console.log("No stakers with stakes to test");
            return;
        }

        console.log("=== Selected Staker and Stake Summary ===");
        console.log("Testing staker at index:", selectedStakerIndex);
        console.log("Staker address:", selectedStaker);
        console.log("Testing stake at index:", selectedStakeIndex);

        // Load stake data to see what we're testing
        _loadStakeData();

        console.log("Stake amount:", beforeStakeAmount);
        console.log("Stake start time:", beforeStakeStartTime);
        console.log("Last update time:", beforeLastUpdateTime);
        console.log("Bonus multiplier:", beforeBonusMultiplier);
        console.log("Organic points:", beforeOrganicPoints);
        console.log("Burn ratio snapshot:", beforeBurnRatioSnapshot);
        console.log("Burn accrued:", beforeBurnAccrued);
        console.log("Has been claimed:", beforeHasBeenClaimed);
    }

    // Test claim deadline preservation
    function test_PreservesClaimDeadline() public {
        beforeValue = proxy.claimDeadline();
        upgradeProxy();
        afterValue = proxy.claimDeadline();

        console.log("=== Claim Deadline ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "claimDeadline changed");
    }

    // Test final total points preservation  
    function test_PreservesFinalTotalPoints() public {
        beforeValue = proxy.finalTotalPoints();
        upgradeProxy();
        afterValue = proxy.finalTotalPoints();

        console.log("=== Final Total Points ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "finalTotalPoints changed");
    }

    // Test finalize index preservation
    function test_PreservesFinalizeIndex() public {
        beforeValue = proxy.finalizeIndex();
        upgradeProxy();
        afterValue = proxy.finalizeIndex();

        console.log("=== Finalize Index ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "finalizeIndex changed");
    }

    // Test finalization complete flag preservation
    function test_PreservesFinalizationComplete() public {
        beforeValue = proxy.finalizationComplete();
        upgradeProxy();
        afterValue = proxy.finalizationComplete();

        console.log("=== Finalization Complete ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "finalizationComplete changed");
    }

    // Test UD60x18 constants preservation - these are critical for points calculation
    function test_PreservesSecondsPerDay() public {
        // UD60x18 values need to be unwrapped to compare
        beforeValue = proxy.SECONDS_PER_DAY().unwrap();
        upgradeProxy();
        afterValue = proxy.SECONDS_PER_DAY().unwrap();

        console.log("=== Seconds Per Day ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "SECONDS_PER_DAY changed");
    }

    function test_PreservesPercentageScale() public {
        beforeValue = proxy.PERCENTAGE_SCALE().unwrap();
        upgradeProxy();
        afterValue = proxy.PERCENTAGE_SCALE().unwrap();

        console.log("=== Percentage Scale ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "PERCENTAGE_SCALE changed");
    }

    function test_PreservesPointsScaleDenominator() public {
        beforeValue = proxy.POINTS_SCALE_DENOMINATOR().unwrap();
        upgradeProxy();
        afterValue = proxy.POINTS_SCALE_DENOMINATOR().unwrap();

        console.log("=== Points Scale Denominator ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "POINTS_SCALE_DENOMINATOR changed");
    }

    function test_PreservesExpGrowthRate() public {
        beforeValue = proxy.EXP_GROWTH_RATE().unwrap();
        upgradeProxy();
        afterValue = proxy.EXP_GROWTH_RATE().unwrap();

        console.log("=== Exp Growth Rate ===");
        console.log("Before:", beforeValue);
        console.log("After:", afterValue);

        assertEq(afterValue, beforeValue, "EXP_GROWTH_RATE changed");
    }
}
