// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {KlimaFairLaunchStaking} from "../../src/KlimaFairLaunchStaking.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

// This script will deploy implementation for staking v3
// The upgrade will be done in a separate
contract UpgradeStakingToV3 is Script {
    function run() public {
        vm.startBroadcast();
        console2.log("Deploying KlimaFairLaunchStaking implementation...");
        KlimaFairLaunchStaking newImplementation = new KlimaFairLaunchStaking();
        console2.log(
            "KlimaFairLaunchStaking implementation deployed at:",
            address(newImplementation)
        );

        vm.stopBroadcast();
    }
}
