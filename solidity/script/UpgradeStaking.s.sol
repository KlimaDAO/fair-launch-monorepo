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

    function run() public {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("FAIRLAUNCH_DEPLOYER_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Log deployment parameters
        console.log("=== Upgrade Configuration ===");
        console.log("Deployer:", deployer);
        console.log("Existing Proxy:", STAKING_PROXY);

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
