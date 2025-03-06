// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";

import {BaseERC20} from "../src/token/BaseERC20.sol";
import {ERC1967Proxy} from "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {KlimaFairLaunchStaking} from "../src/KlimaFairLaunchStaking.sol";
import {KlimaFairLaunchBurnVault} from "../src/KlimaFairLaunchBurnVault.sol";
import {console2} from "forge-std/console2.sol";

contract DeployFairLaunch is Script {

    function run() public {
        vm.startBroadcast();

        KlimaFairLaunchStaking fairLaunchStakingImplementation = new KlimaFairLaunchStaking();
        console2.log("KlimaFairLaunchStaking implementation deployed");
        console2.logAddress(address(fairLaunchStakingImplementation));

        bytes memory stakingInitData = abi.encodeWithSelector(KlimaFairLaunchStaking.initialize.selector, msg.sender);
        ERC1967Proxy stakingProxy = new ERC1967Proxy(address(fairLaunchStakingImplementation), stakingInitData);
        console2.log("KlimaFairLaunchStaking proxy deployed");
        console2.logAddress(address(stakingProxy));
        console2.logAddress(msg.sender);


    }
}