// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {KlimaFairLaunchStaking} from "../src/KlimaFairLaunchStaking.sol";
import {FairLaunchClaim} from "../src/FairLaunchClaim.sol";
import {FairLaunchClaimStorage} from "../src/FairLaunchClaimStorage.sol";

import {KlimaFairLaunchBurnVault} from "../src/KlimaFairLaunchBurnVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IFairLaunchClaim} from "../src/IFairLaunchClaim.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {console2} from "forge-std/console2.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract BaseFairLaunchClaimTest is Test {
    KlimaFairLaunchStaking staking;
    FairLaunchClaim claim;
    KlimaFairLaunchBurnVault burnVault;

    IERC20 KVCM = IERC20(vm.envAddress("KVCM_TOKEN_ADDR"));
    IERC20 K2 = IERC20(vm.envAddress("K2_TOKEN_ADDR"));
    IERC20 KLIMA_V0 = IERC20(0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2);

    address fairLaunchStakingProxy = address(vm.envAddress("STAKING_CONTRACT_ADDRESS"));
    address fairLaunchBurnVaultAddress = address(vm.envAddress("BURN_VAULT_ADDRESS"));
    address treasury = vm.envAddress("TREASURY");
    address fairLaunchClaimProxy = address(vm.envAddress("CLAIM_CONTRACT_ADDRESS"));
    address user = address(0xBA0111F5EC1B6f2F092e9730F5F64840f3B42C95);

    uint256 freezeTime = 1760486400;
    uint256 claimStartTime = 1760572800;

    address deployer = makeAddr("deployer");
    address stakingOwner;

    function setUp() public {
        // Fork Base mainnet so STAKING_CONTRACT_ADDRESS / tokens resolve to live contracts.
        // Requires BASE_URL or BASE_RPC_URL
        string memory rpcUrl = vm.envOr("BASE_URL", string(""));
        if (bytes(rpcUrl).length == 0) {
            rpcUrl = vm.envOr("BASE_RPC_URL", string(""));
        }
        require(bytes(rpcUrl).length > 0, "BASE_URL or BASE_RPC_URL required for FairLaunchClaim fork tests");
        // Optional archive fork (e.g. pre-finalization). If unset, use latest (needs archive RPC for old blocks).
        uint256 forkBlock = vm.envOr("FORK_BLOCK_NUMBER", uint256(0));
        if (forkBlock != 0) {
            vm.createSelectFork(rpcUrl, forkBlock);
        } else {
            vm.createSelectFork(rpcUrl);
        }

        // Use the deployed KlimaFairLaunchStaking *proxy* from the fork (ERC1967), not the implementation.
        staking = KlimaFairLaunchStaking(fairLaunchStakingProxy);
        claim = FairLaunchClaim(fairLaunchClaimProxy);
        stakingOwner = staking.owner();
        require(
            stakingOwner != address(0),
            "Staking owner is zero: STAKING_CONTRACT_ADDRESS must be the UUPS proxy, not the implementation"
        );

        KlimaFairLaunchStaking new_staking_impl = new KlimaFairLaunchStaking();
        FairLaunchClaim claimImpl = new FairLaunchClaim();

        // Link contracts
        vm.startPrank(stakingOwner);
        staking.upgradeToAndCall(address(new_staking_impl), "");
        claim.upgradeToAndCall(address(claimImpl), "");
        vm.stopPrank();
    }

    // STATE_STORAGE_LOCATION = keccak256(abi.encode(uint256(keccak256("fairlaunch.claim.state")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 internal constant STATE_STORAGE_LOCATION =
        0x3768acc97eca7fdb191311f7476746b6649a761c8516c4d4207727e759011100;

    /// @dev Zeroes out userClaimableAmount[_user] so the user can claim again in a test.
    function _resetUserClaimState(address _user) internal {
        // userClaimableAmount is at offset 2 in State struct
        bytes32 mappingSlot = bytes32(uint256(STATE_STORAGE_LOCATION) + 2);
        bytes32 userSlot = keccak256(abi.encode(_user, mappingSlot));
        vm.store(address(claim), userSlot, bytes32(0));
    }

    /// @dev Zeroes out kvcmForClaims so the contract appears to have no KVCM.
    function _resetKvcmForClaims() internal {
        vm.store(address(claim), STATE_STORAGE_LOCATION, bytes32(0));
    }
}

contract FairLaunchClaimTest is BaseFairLaunchClaimTest {
    function test_happyPath_claimKVCM() public {
        // Staking finalization is already complete on the live fork — no need to storeTotalPoints.
        console2.log("User points:", staking.previewUserPoints(user));

        KlimaFairLaunchStaking.Stake[] memory userStakes = staking.getUserStakes(user);

        uint256 totalUserStakedAmount;
        for (uint256 i = 0; i < userStakes.length; i++) {
            console2.log("User stake:", userStakes[i].amount);
            totalUserStakedAmount += userStakes[i].amount;
        }

        console2.log("Total staked amount:", totalUserStakedAmount / 1e9);
        console2.log("KlimaOut", staking.calculateKlimaAllocation(totalUserStakedAmount) / 1e18);

        // Reset user's on-chain claim state so they can claim in this test.
        _resetUserClaimState(user);

        // Fund claim contract
        uint256 klimaToFund = staking.calculateKlimaAllocation(totalUserStakedAmount);
        vm.startPrank(treasury);
        uint256 treasuryBalance = KVCM.balanceOf(treasury);
        uint256 claimContractBalanceBefore = KVCM.balanceOf(address(claim));
        KVCM.approve(address(claim), klimaToFund);
        claim.addKVCM(klimaToFund);

        assertEq(
            KVCM.balanceOf(address(claim)),
            claimContractBalanceBefore + klimaToFund,
            "KVCM balance of claim contract not correct"
        );
        assertEq(KVCM.balanceOf(treasury), treasuryBalance - klimaToFund, "KVCM balance of treasury not correct");
        vm.stopPrank();

        // Warp past claim start time (already in the past on the live fork, but warp is idempotent).
        uint256 claimStartTimeLocal = claim.getKVCMClaimStartTime();
        vm.warp(claimStartTimeLocal + 1);

        // User claims KVCM
        vm.expectEmit(true, true, true, true);
        emit IFairLaunchClaim.KVCMClaimed(user, klimaToFund);
        vm.startPrank(user);
        uint256 claimedAmount = claim.claimKVCM();
        vm.stopPrank();

        // Assertions
        assertEq(claimedAmount, klimaToFund, "Incorrect KLIMA amount claimed");
        assertEq(KVCM.balanceOf(user), klimaToFund, "User did not receive correct KLIMA amount");
        assertTrue(claim.hasUserClaimed(user), "User claim status not updated");

        // // 9. User tries to claim again, should fail
        // vm.startPrank(user);
        // vm.expectRevert("KVCM already claimed");
        // claim.claimKVCM();
        // vm.stopPrank();
    }

    function test_withdraw_revert_if_not_treasury() public {
        vm.startPrank(user);
        vm.expectRevert("Not owner");
        claim.withdrawToken(address(KVCM), 100);
        vm.stopPrank();
    }

    function test_stop_claim_if_not_enabled() public {
        vm.startPrank(treasury);
        claim.disableKVCMClaim();
        vm.stopPrank();

        vm.startPrank(user);
        vm.expectRevert("KVCM claim not enabled");
        claim.claimKVCM();
        vm.stopPrank();
    }

    function test_revert_if_not_started() public {
        // Reset user's on-chain claim state and push start time into the future.
        _resetUserClaimState(user);
        vm.prank(treasury);
        claim.setKVCMClaimStartTime(uint128(block.timestamp + 1 days));

        // Attempt to claim before start time
        vm.startPrank(user);
        vm.expectRevert("KVCM claim not started");
        claim.claimKVCM();
        vm.stopPrank();
    }

    function test_revert_if_already_claimed() public {
        // The live fork already has this user's claim recorded (userClaimableAmount != 0).
        // Attempting to claim again should revert immediately.
        vm.startPrank(user);
        vm.expectRevert("KVCM already claimed");
        claim.claimKVCM();
        vm.stopPrank();
    }

    function test_revert_if_not_enough_KVCM() public {
        // Reset user's on-chain claim state and zero out the contract's KVCM balance
        // so the claim check passes but InsufficientKVCMForClaims is triggered.
        _resetUserClaimState(user);
        _resetKvcmForClaims();

        // User tries to claim without sufficient KVCM
        vm.startPrank(user);
        vm.expectRevert(IFairLaunchClaim.InsufficientKVCMForClaims.selector);
        claim.claimKVCM();
        vm.stopPrank();
    }

    function test_revert_if_paused() public {
        vm.startPrank(treasury);
        claim.setKVCMClaimStartTime(uint128(block.timestamp + 1 hours));
        vm.warp(claimStartTime + 1);
        claim.pause();
        vm.stopPrank();

        vm.startPrank(user);
        vm.expectRevert(PausableUpgradeable.EnforcedPause.selector);
        claim.claimKVCM();
        vm.stopPrank();
    }

    function test_setUserBlacklisted_reverts_if_not_owner() public {
        vm.prank(user);
        vm.expectRevert("Not owner");
        claim.setUserBlacklisted(user, true);
    }

    function test_blacklisted_user_cannot_claimKVCM() public {
        KlimaFairLaunchStaking.Stake[] memory userStakes = staking.getUserStakes(user);
        uint256 totalUserStakedAmount = 0;
        for (uint256 i = 0; i < userStakes.length; i++) {
            totalUserStakedAmount += userStakes[i].amount;
        }
        uint256 klimaToFund = staking.calculateKlimaAllocation(totalUserStakedAmount);

        vm.startPrank(treasury);
        KVCM.approve(address(claim), klimaToFund);
        claim.addKVCM(klimaToFund);
        vm.expectEmit(true, false, false, true);
        emit IFairLaunchClaim.UserBlacklisted(user, true);
        claim.setUserBlacklisted(user, true);
        vm.stopPrank();

        assertTrue(claim.isUserBlacklisted(user));

        vm.warp(claimStartTime + 1);

        vm.startPrank(user);
        vm.expectRevert("User is blacklisted");
        claim.claimKVCM();
        vm.stopPrank();
    }

    function test_unblacklist_then_user_can_claimKVCM() public {
        KlimaFairLaunchStaking.Stake[] memory userStakes = staking.getUserStakes(user);
        uint256 totalUserStakedAmount = 0;
        for (uint256 i = 0; i < userStakes.length; i++) {
            totalUserStakedAmount += userStakes[i].amount;
        }
        uint256 klimaToFund = staking.calculateKlimaAllocation(totalUserStakedAmount);

        // Reset user's on-chain claim state so they can claim in this test.
        _resetUserClaimState(user);

        vm.startPrank(treasury);
        KVCM.approve(address(claim), klimaToFund);
        claim.addKVCM(klimaToFund);
        claim.setUserBlacklisted(user, true);
        vm.expectEmit(true, false, false, true);
        emit IFairLaunchClaim.UserBlacklisted(user, false);
        claim.setUserBlacklisted(user, false);
        vm.stopPrank();

        assertFalse(claim.isUserBlacklisted(user));

        vm.warp(claimStartTime + 1);

        vm.startPrank(user);
        uint256 claimed = claim.claimKVCM();
        vm.stopPrank();

        assertEq(claimed, klimaToFund);
        assertTrue(claim.hasUserClaimed(user));
    }
}

contract FairLaunchClaimWithdrawTest is BaseFairLaunchClaimTest {
    function test_withdraw_KVCM() public {
        uint256 kvcmAmount = 15_500_000 * 1e18;

        // Fund the claim contract with KVCM
        vm.startPrank(treasury);
        KVCM.approve(address(claim), kvcmAmount);
        claim.addKVCM(kvcmAmount);
        vm.stopPrank();

        // Verify KVCM was added
        assertEq(KVCM.balanceOf(address(claim)), kvcmAmount, "KVCM not added to claim contract");

        uint256 treasuryBalanceBefore = KVCM.balanceOf(treasury);

        // Enable token withdrawal
        vm.prank(treasury);
        vm.expectEmit(true, false, false, false);
        emit IFairLaunchClaim.TokenWithdrawEnabled(address(KVCM));
        claim.enableTokenWithdraw(address(KVCM));

        // Try to withdraw before delay period passes - should fail
        vm.startPrank(treasury);
        vm.expectRevert("Token withdraw not enabled");
        claim.withdrawToken(address(KVCM), kvcmAmount);
        vm.stopPrank();

        // Warp time past the delay period (6 hours + 1 second)
        vm.warp(block.timestamp + 6 hours + 1);

        // Withdraw KVCM
        vm.prank(treasury);
        vm.expectEmit(true, true, false, false);
        emit IFairLaunchClaim.TokenWithdrawn(address(KVCM), kvcmAmount);
        claim.withdrawToken(address(KVCM), kvcmAmount);

        // Verify balances
        assertEq(KVCM.balanceOf(address(claim)), 0, "KVCM not withdrawn from claim contract");
        assertEq(KVCM.balanceOf(treasury), treasuryBalanceBefore + kvcmAmount, "KVCM not received by treasury");
    }

    function test_withdraw_revert_if_withdraw_not_enabled() public {
        uint256 kvcmAmount = 15_500_000 * 1e18;

        // Fund the claim contract
        vm.startPrank(treasury);
        KVCM.approve(address(claim), kvcmAmount);
        claim.addKVCM(kvcmAmount);
        vm.stopPrank();

        // Try to withdraw without enabling - should fail
        vm.startPrank(treasury);
        vm.expectRevert("Token withdraw not enabled");
        claim.withdrawToken(address(KVCM), kvcmAmount);
        vm.stopPrank();
    }

    function test_disable_token_withdraw() public {
        uint256 kvcmAmount = 15_500_000 * 1e18;

        // Fund the claim contract
        vm.startPrank(treasury);
        KVCM.approve(address(claim), kvcmAmount);
        claim.addKVCM(kvcmAmount);

        // Enable token withdrawal
        claim.enableTokenWithdraw(address(KVCM));

        // Disable token withdrawal
        vm.expectEmit(true, false, false, false);
        emit IFairLaunchClaim.TokenWithdrawDisabled(address(KVCM));
        claim.disableTokenWithdraw(address(KVCM));
        vm.stopPrank();

        // Warp time past the delay period
        vm.warp(block.timestamp + 6 hours + 1);

        // Try to withdraw after disabling - should fail
        vm.startPrank(treasury);
        vm.expectRevert("Token withdraw not enabled");
        claim.withdrawToken(address(KVCM), kvcmAmount);
        vm.stopPrank();
    }
}
