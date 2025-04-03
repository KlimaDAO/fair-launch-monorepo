// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";

import {BaseERC20} from "../src/token/BaseERC20.sol";
import {ERC1967Proxy} from "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {KlimaFairLaunchStaking} from "../src/KlimaFairLaunchStaking.sol";
import {KlimaFairLaunchBurnVault} from "../src/KlimaFairLaunchBurnVault.sol";
import {console2} from "forge-std/console2.sol";

contract Deploy is Script {

    function run() public {
        vm.startBroadcast();

        BaseERC20 oldKlima = new BaseERC20("oldKlima", "KLIMA_V0", 1000000 * 10 ** 18);
        console2.log("old Klima deployed at:", address(oldKlima));

        BaseERC20 newKlima = new BaseERC20("Klima", "KLIMA", 1000000 * 10 ** 18);
        console2.log("new Klima deployed at:", address(newKlima));

        BaseERC20 klimaX = new BaseERC20("KlimaX", "KLIMAX", 1000000 * 10 ** 18);
        console2.log("KlimaX deployed at:", address(klimaX));

        KlimaFairLaunchStaking fairLaunchStakingImplementation = new KlimaFairLaunchStaking();
        console2.log("KlimaFairLaunchStaking implementation deployed");
        console2.logAddress(address(fairLaunchStakingImplementation));

        bytes memory stakingInitData = abi.encodeWithSelector(KlimaFairLaunchStaking.initialize.selector, msg.sender);
        ERC1967Proxy stakingProxy = new ERC1967Proxy(address(fairLaunchStakingImplementation), stakingInitData);
        console2.log("KlimaFairLaunchStaking proxy deployed");
        console2.logAddress(address(stakingProxy));

        KlimaFairLaunchBurnVault burnVaultImplementation = new KlimaFairLaunchBurnVault();
        console2.log("KlimaFairLaunchBurnVault implementation deployed");
        console2.logAddress(address(burnVaultImplementation));

        bytes memory burnVaultInitData = abi.encodeWithSelector(KlimaFairLaunchBurnVault.initialize.selector, msg.sender);
        ERC1967Proxy burnVaultProxy = new ERC1967Proxy(address(burnVaultImplementation), burnVaultInitData);
        console2.log("KlimaFairLaunchBurnVault proxy deployed");
        console2.logAddress(address(burnVaultProxy));
    }
}