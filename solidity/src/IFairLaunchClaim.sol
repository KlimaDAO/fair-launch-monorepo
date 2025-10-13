// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {FairLaunchClaimStorage} from "./FairLaunchClaimStorage.sol";

/**
 * @title IFairLaunchClaim
 * @author KlimaDAO
 * @notice Interface for the FairLaunchClaim contract.
 */
interface IFairLaunchClaim {
    /**
     * @notice Emitted when a user claims their KVCM tokens.
     * @param user The address of the user who claimed.
     * @param amount The amount of KVCM claimed.
     */
    event KVCMClaimed(address indexed user, uint256 indexed amount);

    /**
     * @notice Emitted when tokens are withdrawn from the contract.
     * @param token The address of the token withdrawn.
     * @param amount The amount of the token withdrawn.
     */
    event TokenWithdrawn(address indexed token, uint256 indexed amount);

    /**
     * @notice Emitted when KVCM tokens are added to the contract for claims.
     * @param amount The amount of KVCM added.
     */
    event KVCMAdded(uint256 indexed amount);

    /**
     * @notice Emitted when K2 tokens are added to the contract for claims.
     * @param amount The amount of K2 added.
     */
    event K2Added(uint256 indexed amount);

    /**
     * @notice Emitted when token withdrawal is enabled for a specific token.
     * @param token The address of the token for which withdrawal is enabled.
     */
    event TokenWithdrawEnabled(address indexed token);

    /**
     * @notice Emitted when token withdrawal is disabled for a specific token.
     * @param token The address of the token for which withdrawal is disabled.
     */
    event TokenWithdrawDisabled(address indexed token);

    /**
     * @notice Emitted when the admin withdrawal delay period is set.
     * @param delayPeriod The new delay period in seconds.
     */
    event AdminWithdrawDelayPeriodSet(uint128 indexed delayPeriod);

    /**
     * @notice Emitted when KVCM claiming is enabled.
     */
    event KVCMClaimEnabled();

    /**
     * @notice Emitted when KVCM claiming is disabled.
     */
    event KVCMClaimDisabled();

    /**
     * @notice Emitted when the start time for KVCM claims is set.
     * @param startTime The new start time for KVCM claims.
     */
    event KVCMClaimStartTimeSet(uint128 indexed startTime);

    /**
     * @notice Error thrown when a user with no Klima staked in the fair launch tries to claim.
     */
    error NoKlimaStakedInFairLaunch();

    /**
     * @notice Error thrown when there is no KVCM claimable for a user.
     */
    error NoKVCMClaimable();

    /**
     * @notice Error thrown when there is insufficient KVCM in the contract for a claim.
     */
    error InsufficientKVCMForClaims();

    /**
     * @notice Allows a user to claim their KVCM tokens.
     * @return The amount of KVCM claimed.
     */
    function claimKVCM() external returns (uint256);

    /**
     * @notice Checks if a user has already claimed their KVCM tokens.
     * @param user The address of the user to check.
     * @return True if the user has claimed, false otherwise.
     */
    function hasUserClaimed(address user) external view returns (bool);

    /**
     * @notice Gets the amount of KVCM a user can claim.
     * @param user The address of the user.
     * @return The amount of KVCM claimable by the user.
     */
    function getUserClaimableAmount(
        address user
    ) external view returns (uint256);

    /**
     * @notice Gets the current configuration of the contract.
     * @return A memory struct containing the contract's configuration.
     */
    function getConfig()
        external
        view
        returns (FairLaunchClaimStorage.Config memory);

    /**
     * @notice Gets the start time for KVCM claims.
     * @return The timestamp when KVCM claims start.
     */
    function getKVCMClaimStartTime() external view returns (uint128);

    /**
     * @notice Checks if KVCM claiming is currently enabled.
     * @return True if claiming is enabled, false otherwise.
     */
    function isKVCMClaimEnabled() external view returns (bool);

    /**
     * @notice Pauses the contract.
     */
    function pause() external;

    /**
     * @notice Unpauses the contract.
     */
    function unpause() external;

    /**
     * @notice Withdraws a specified amount of a token from the contract.
     * @param token The address of the token to withdraw.
     * @param amount The amount of the token to withdraw.
     */
    function withdrawToken(address token, uint256 amount) external;

    /**
     * @notice Adds KVCM tokens to the contract for claims.
     * @param amount The amount of KVCM to add.
     */
    function addKVCM(uint256 amount) external;

    /**
     * @notice Adds K2 tokens to the contract for claims.
     * @param amount The amount of K2 to add.
     */
    function addK2(uint256 amount) external;

    /**
     * @notice Sets the configuration of the contract.
     * @param kvcm The address of the KVCM token.
     * @param k2 The address of the K2 token.
     * @param fairLaunch The address of the fair launch staking contract.
     * @param isKVCMClaimEnabled Whether KVCM claiming is enabled.
     * @param kVCMClaimStartTime The start time for KVCM claims.
     * @param adminWithdrawDelayPeriod The delay period for admin withdrawals.
     */
    function setConfig(
        address kvcm,
        address k2,
        address fairLaunch,
        bool isKVCMClaimEnabled,
        uint128 kVCMClaimStartTime,
        uint128 adminWithdrawDelayPeriod
    ) external;

    /**
     * @notice Enables KVCM claiming.
     */
    function enableKVCMClaim() external;

    /**
     * @notice Disables KVCM claiming.
     */
    function disableKVCMClaim() external;

    /**
     * @notice Enables withdrawal for a specific token after a delay.
     * @param token The address of the token to enable withdrawal for.
     */
    function enableTokenWithdraw(address token) external;

    /**
     * @notice Disables withdrawal for a specific token.
     * @param token The address of the token to disable withdrawal for.
     */
    function disableTokenWithdraw(address token) external;

    /**
     * @notice Sets the delay period for admin withdrawals.
     * @param delayPeriod The new delay period in seconds.
     */
    function setAdminWithdrawDelayPeriod(uint128 delayPeriod) external;

    /**
     * @notice Sets the start time for KVCM claims.
     * @param startTime The new start time for KVCM claims.
     */
    function setKVCMClaimStartTime(uint128 startTime) external;
}
