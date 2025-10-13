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

        address staking = vm.envAddress("STAKING_CONTRACT_ADDRESS");
        address user = address(0xBA0111F5EC1B6f2F092e9730F5F64840f3B42C95);

        KlimaFairLaunchStaking stakingOld = KlimaFairLaunchStaking(staking);
        address stakingOwner = stakingOld.owner();

        uint256 userStakesLength = stakingOld.getUserStakeCount(user);

        console2.log("Staking contract address:", staking);
        console2.log("Staking owner:", stakingOwner);

        console2.log("UpgradeStaking deployed");
        KlimaFairLaunchStaking newImplementation = new KlimaFairLaunchStaking();
        console2.log("Staking deployed at:", address(staking));

        // vm.startPrank(stakingOwner);
        // stakingOld.upgradeToAndCall(address(newImplementation), "");
        // vm.stopPrank();

        // KlimaFairLaunchStaking.Stake[] memory userStakes = stakingOld
        //     .getUserStakes(user);

        // uint256 userStakesLengthAfter = stakingOld.getUserStakes(user).length;

        // console2.log("User stakes length after:", userStakesLengthAfter);
        // console2.log("User stakes length before:", userStakesLength);

        vm.stopBroadcast();
    }
}
