// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";

import {BaseERC20} from "../src/token/BaseERC20.sol";
import {ERC1967Proxy} from "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {KlimaFairLaunchStaking} from "../src/KlimaFairLaunchStaking.sol";
import {KlimaFairLaunchBurnVault} from "../src/KlimaFairLaunchBurnVault.sol";
import {console2} from "forge-std/console2.sol";

contract Deploy is Script {

    address USER_2 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address USER_3 = 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359;
    address USER_4 = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;
    address USER_5 = 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65;

    function run() public {
        vm.startBroadcast();

        // only necessary if we use sepolia
        // BaseERC20 oldKlima = new BaseERC20("oldKlima", "KLIMA_V0", 1000000 * 10 ** 18);
        // console2.log("old Klima deployed at:", address(oldKlima));

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
        console2.logAddress(msg.sender);

        new KlimaFairLaunchBurnVault();
        console2.log("KlimaFairLaunchBurnVault implementation deployed");
        console2.logAddress(address(new KlimaFairLaunchBurnVault()));
        vm.stopBroadcast();
    }
}