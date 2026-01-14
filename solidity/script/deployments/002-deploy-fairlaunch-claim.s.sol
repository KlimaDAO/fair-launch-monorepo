// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {FairLaunchClaim} from "../../src/FairLaunchClaim.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployFairLaunchClaim is Script {
    function run() public {
        vm.startBroadcast();

        address owner = vm.envAddress("TREASURY");

        console.log("DeployFairLaunchClaim deployed");
        FairLaunchClaim claimImpl = new FairLaunchClaim();
        bytes memory claimData = abi.encodeWithSelector(
            FairLaunchClaim.initialize.selector,
            owner
        );
        FairLaunchClaim claim = FairLaunchClaim(
            address(new ERC1967Proxy(address(claimImpl), claimData))
        );

        vm.stopBroadcast();
    }
}
