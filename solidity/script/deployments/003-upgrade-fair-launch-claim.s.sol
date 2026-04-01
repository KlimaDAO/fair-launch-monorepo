// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {FairLaunchClaim} from "../../src/FairLaunchClaim.sol";

contract UpgradeFairLaunchClaim is Script {
    function run() public {
        vm.startBroadcast();
        FairLaunchClaim newClaimImpl = new FairLaunchClaim();
        vm.stopBroadcast();

        console.log("FairLaunchClaim implementation deployed at:", address(newClaimImpl));
    }
}
