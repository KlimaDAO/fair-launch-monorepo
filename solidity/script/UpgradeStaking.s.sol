// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {KlimaFairLaunchStaking} from "../src/KlimaFairLaunchStaking.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title UpgradeStaking
 * @notice Script to upgrade the KlimaFairLaunchStaking contract on Base chain
 * @dev This script deploys a new implementation and upgrades the existing proxy
 */
contract UpgradeStaking is Script {
    // Existing proxy address on Base
    address public constant STAKING_PROXY = 0xea8a59D0bf9C05B437c6a5396cfB429F1A57B682;

    // New implementation address (will be set after deployment)
    address public newImplementation;

    // Storage for before values
    address public beforeBurnVault;
    uint256 public beforeStartTimestamp;
    uint256 public beforeFreezeTimestamp;
    uint256 public beforeTotalStaked;
    uint256 public beforeTotalStakers;
    uint256 public beforeFinalizationComplete;

    function run() public {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("FAIRLAUNCH_DEPLOYER_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Log deployment parameters
        console.log("=== Upgrade Configuration ===");
        console.log("Deployer:", deployer);
        console.log("Existing Proxy:", STAKING_PROXY);

        // Read before values
        readBeforeValues();

        // Start the deployment process
        vm.startBroadcast(deployerPrivateKey);

        // Deploy new implementation
        console.log("\n=== Deploying new implementation ===");
        KlimaFairLaunchStaking newImplementationContract = new KlimaFairLaunchStaking();
        newImplementation = address(newImplementationContract);
        console.log("New implementation deployed at:", newImplementation);

        // Upgrade proxy to new implementation
        console.log("\n=== Upgrading proxy ===");
        KlimaFairLaunchStaking proxy = KlimaFairLaunchStaking(STAKING_PROXY);
        proxy.upgradeToAndCall(newImplementation, "");

        vm.stopBroadcast();

        // Log upgrade summary
        logUpgradeSummary();

        // Verify storage preservation
        verifyStoragePreservation();
    }

    /**
     * @notice Reads key storage values before upgrade
     */
    function readBeforeValues() internal {
        KlimaFairLaunchStaking proxy = KlimaFairLaunchStaking(STAKING_PROXY);
        
        beforeBurnVault = proxy.burnVault();
        beforeStartTimestamp = proxy.startTimestamp();
        beforeFreezeTimestamp = proxy.freezeTimestamp();
        beforeTotalStaked = proxy.totalStaked();
        beforeTotalStakers = proxy.getTotalStakerAddresses();
        beforeFinalizationComplete = proxy.finalizationComplete();
    }

    /**
     * @notice Verifies that key storage values are preserved after upgrade
     */
    function verifyStoragePreservation() internal view {
        KlimaFairLaunchStaking proxy = KlimaFairLaunchStaking(STAKING_PROXY);
        
        console.log("\n=== Storage Preservation Check ===");
        
        // Read after values and compare
        address afterBurnVault = proxy.burnVault();
        uint256 afterStartTimestamp = proxy.startTimestamp();
        uint256 afterFreezeTimestamp = proxy.freezeTimestamp();
        uint256 afterTotalStaked = proxy.totalStaked();
        uint256 afterTotalStakers = proxy.getTotalStakerAddresses();
        uint256 afterFinalizationComplete = proxy.finalizationComplete();

        // Compare and log each value
        logComparisonAddress("burnVault", beforeBurnVault, afterBurnVault);
        logComparisonUint("startTimestamp", beforeStartTimestamp, afterStartTimestamp);
        logComparisonUint("freezeTimestamp", beforeFreezeTimestamp, afterFreezeTimestamp);
        logComparisonUint("totalStaked", beforeTotalStaked, afterTotalStaked);
        logComparisonUint("totalStakers", beforeTotalStakers, afterTotalStakers);
        logComparisonUint("finalizationComplete", beforeFinalizationComplete, afterFinalizationComplete);

        console.log("All key storage values preserved successfully!");
    }

    /**
     * @notice Logs a single comparison row for uint256 values
     */
    function logComparisonUint(string memory name, uint256 before, uint256 afterValue) internal view {
        bool matches = before == afterValue;
        string memory status = matches ? "OK" : "FAIL";
        console.log(name);
        console.log("  Before:", before);
        console.log("  After:", afterValue);
        console.log("  Status:", status);
    }

    /**
     * @notice Logs a single comparison row for addresses
     */
    function logComparisonAddress(string memory name, address before, address afterValue) internal view {
        bool matches = before == afterValue;
        string memory status = matches ? "OK" : "FAIL";
        console.log(name);
        console.log("  Before:", before);
        console.log("  After:", afterValue);
        console.log("  Status:", status);
    }

    /**
     * @notice Logs a summary of the upgrade
     */
    function logUpgradeSummary() internal view {
        console.log("\n=== UPGRADE SUMMARY ===");
        console.log("Contracts:");
        console.log("- KlimaFairLaunchStaking Proxy:", STAKING_PROXY);
        console.log("- New KlimaFairLaunchStaking Implementation:", newImplementation);
    }
}
