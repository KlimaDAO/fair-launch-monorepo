// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {KlimaFairLaunchStaking} from "../../src/KlimaFairLaunchStaking.sol";
import {FairLaunchClaim} from "../../src/FairLaunchClaim.sol";
import {KlimaFairLaunchBurnVault} from "../../src/KlimaFairLaunchBurnVault.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract ClaimLaunchTest is Test {
    address public klimaStakingAddr;
    address public multisigAdmin;

    KlimaFairLaunchStaking public klimaStaking;
    KlimaFairLaunchBurnVault public klimaBurnVault;
    FairLaunchClaim public fairLaunchClaim;

    function deployClaimContract() public {
        FairLaunchClaim fairLaunchClaimImp = new FairLaunchClaim();
        bytes memory claimData = abi.encodeWithSelector(
            FairLaunchClaim.initialize.selector,
            multisigAdmin
        );
        fairLaunchClaim = FairLaunchClaim(
            address(new ERC1967Proxy(address(fairLaunchClaimImp), claimData))
        );
    }

    function getImpl(
        address proxy,
        bytes32 slot
    ) public view returns (address) {
        return address(uint160(uint256(vm.load(proxy, slot))));
    }

    function setUp() public {
        klimaStaking = KlimaFairLaunchStaking(
            vm.envAddress("STAKING_CONTRACT_ADDRESS")
        );
        klimaBurnVault = KlimaFairLaunchBurnVault(
            vm.envAddress("BURN_VAULT_ADDRESS")
        );
        multisigAdmin = klimaStaking.owner();
        deployClaimContract();
    }

    function test_staking_upgrade_and_state_sanity() public {
        // set the claim contract to the staking contract

        address oldImpl = getImpl(
            address(klimaStaking),
            0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
        );

        uint256 totalStakedOld = klimaStaking.totalStaked();
        uint256 totalStakersOld = klimaStaking.getTotalStakerAddresses();
        uint256 userStakesOld = klimaStaking.getUserStakeCount(
            0xBA0111F5EC1B6f2F092e9730F5F64840f3B42C95
        );

        KlimaFairLaunchStaking newImplementation = new KlimaFairLaunchStaking();

        vm.startPrank(multisigAdmin);
        klimaStaking.upgradeToAndCall(address(newImplementation), "");
        vm.stopPrank();

        address newImpl = getImpl(
            address(klimaStaking),
            0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
        );

        assertNotEq(oldImpl, newImpl, "Implementation should be upgraded");

        // Sanity check the state
        assertEq(
            totalStakedOld,
            klimaStaking.totalStaked(),
            "Total staked should be the same"
        );
        assertEq(
            totalStakersOld,
            klimaStaking.getTotalStakerAddresses(),
            "Total stakers should be the same"
        );
        assertEq(
            userStakesOld,
            klimaStaking.getUserStakeCount(
                0xBA0111F5EC1B6f2F092e9730F5F64840f3B42C95
            ),
            "User stakes should be the same"
        );
    }
}
