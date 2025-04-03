// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";

import {BaseERC20} from "../src/token/BaseERC20.sol";
import {ERC1967Proxy} from "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {KlimaFairLaunchStaking} from "../src/KlimaFairLaunchStaking.sol";
import {KlimaFairLaunchBurnVault} from "../src/KlimaFairLaunchBurnVault.sol";
import {console2} from "forge-std/console2.sol";

contract DeployBurnVault is Script {

    function run() public {
        vm.startBroadcast();


        KlimaFairLaunchBurnVault burnVaultImplementation = new KlimaFairLaunchBurnVault();
        console2.log("KlimaFairLaunchBurnVault implementation deployed");
        console2.logAddress(address(burnVaultImplementation));

        bytes memory burnVaultInitData = abi.encodeWithSelector(KlimaFairLaunchBurnVault.initialize.selector, msg.sender);
        ERC1967Proxy burnVaultProxy = new ERC1967Proxy(address(burnVaultImplementation), burnVaultInitData);
        console2.log("KlimaFairLaunchBurnVault proxy deployed");
        console2.logAddress(address(burnVaultProxy));


        vm.stopBroadcast();
    }
}