// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// OpenZeppelin Contracts
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

// Local Contracts
import {FairLaunchClaimStorage} from "./FairLaunchClaimStorage.sol";
import {IFairLaunchClaim} from "./IFairLaunchClaim.sol";
import {KlimaFairLaunchStaking} from "./KlimaFairLaunchStaking.sol";

/**
 * @title FairLaunchClaim
 * @author KlimaDAO
 * @notice This contract allows users who participated in the KlimaDAO Fair Launch to claim their KVCM tokens.
 * @dev This contract is upgradeable using the UUPS proxy pattern.
 */
contract FairLaunchClaim is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    IFairLaunchClaim
{
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    using SafeERC20 for IERC20;

    /**
     * @notice Modifier to restrict access to functions to the owner (DEFAULT_ADMIN_ROLE).
     */
    modifier onlyOwner() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not owner");
        _;
    }

    /**
     * @notice Disables the initializer for the implementation contract.
     */
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract, setting the initial owner and upgrader.
     * @param initialOwner The address of the initial owner.
     */
    function initialize(address initialOwner) external initializer {
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(UPGRADER_ROLE, initialOwner);
    }

    // =============================================================
    // EXTERNAL FUNCTIONS
    // =============================================================

    /**
     * @notice Allows a user to claim their KVCM tokens based on their staked amount in the Fair Launch.
     * @return kVCMClaimAmount The amount of KVCM tokens claimed.
     */
    function claimKVCM()
        external
        nonReentrant
        returns (uint256 kVCMClaimAmount)
    {
        FairLaunchClaimStorage.Config storage config = FairLaunchClaimStorage
            .getConfig();
        FairLaunchClaimStorage.State storage state = FairLaunchClaimStorage
            .getState();

        require(config.isKVCMClaimEnabled, "KVCM claim not enabled");
        require(
            block.timestamp >= config.kVCMClaimStartTime,
            "KVCM claim not started"
        );
        require(
            state.userClaimableAmount[msg.sender] == 0,
            "KVCM already claimed"
        );

        KlimaFairLaunchStaking fairLaunchStaking = KlimaFairLaunchStaking(
            _getConfig().fairLaunch
        );

        KlimaFairLaunchStaking.Stake[] memory userStakes = fairLaunchStaking
            .getUserStakes(msg.sender);

        // If the user has no stakes, revert.
        if (userStakes.length == 0) {
            revert NoKlimaStakedInFairLaunch();
        }

        uint256 totalKlimaUserStaked = 0;
        for (uint256 i = 0; i < userStakes.length; i++) {
            totalKlimaUserStaked += userStakes[i].amount;
        }

        // We can do it for the total user staked amount rather than each stake.
        kVCMClaimAmount += fairLaunchStaking.calculateKlimaAllocation(
            totalKlimaUserStaked
        );

        if (kVCMClaimAmount == 0) {
            revert NoKVCMClaimable();
        }

        if (kVCMClaimAmount > state.kvcmForClaims) {
            revert InsufficientKVCMForClaims();
        }

        state.userClaimableAmount[msg.sender] = kVCMClaimAmount;
        state.kvcmForClaims -= kVCMClaimAmount;

        emit KVCMClaimed(msg.sender, kVCMClaimAmount);

        IERC20(config.kvcm).safeTransfer(msg.sender, kVCMClaimAmount);
    }

    // =============================================================
    // EXTERNAL VIEW FUNCTIONS
    // =============================================================

    /**
     * @notice Checks if a user has already claimed their KVCM tokens.
     * @param user The address of the user to check.
     * @return True if the user has claimed, false otherwise.
     */
    function hasUserClaimed(address user) external view returns (bool) {
        return FairLaunchClaimStorage.getState().userClaimableAmount[user] > 0;
    }

    /**
     * @notice Gets the amount of KVCM a user can claim.
     * @param user The address of the user.
     * @return The amount of KVCM claimable by the user.
     */
    function getUserClaimableAmount(
        address user
    ) external view returns (uint256) {
        FairLaunchClaimStorage.Config storage config = FairLaunchClaimStorage
            .getConfig();

        // Ensure the fairLaunch contract is set
        if (config.fairLaunch == address(0)) {
            return 0;
        }

        KlimaFairLaunchStaking fairLaunchStaking = KlimaFairLaunchStaking(
            config.fairLaunch
        );
        KlimaFairLaunchStaking.Stake[] memory userStakes = fairLaunchStaking
            .getUserStakes(user);

        if (userStakes.length == 0) {
            return 0;
        }

        uint256 totalKlimaUserStaked = 0;
        for (uint256 i = 0; i < userStakes.length; i++) {
            totalKlimaUserStaked += userStakes[i].amount;
        }

        return fairLaunchStaking.calculateKlimaAllocation(totalKlimaUserStaked);
    }

    /**
     * @notice Gets the current configuration of the contract.
     * @return A memory struct containing the contract's configuration.
     */
    function getConfig()
        external
        view
        returns (FairLaunchClaimStorage.Config memory)
    {
        return FairLaunchClaimStorage.getConfig();
    }

    /**
     * @notice Gets the start time for KVCM claims.
     * @return The timestamp when KVCM claims start.
     */
    function getKVCMClaimStartTime() external view returns (uint128) {
        return FairLaunchClaimStorage.getConfig().kVCMClaimStartTime;
    }

    /**
     * @notice Checks if KVCM claiming is currently enabled.
     * @return True if claiming is enabled, false otherwise.
     */
    function isKVCMClaimEnabled() external view returns (bool) {
        return FairLaunchClaimStorage.getConfig().isKVCMClaimEnabled;
    }

    // =============================================================
    // EXTERNAL ADMIN FUNCTIONS
    // =============================================================

    /**
     * @notice Sets the configuration parameters for the contract. Can only be called by the owner.
     * @param kvcm The address of the KVCM token.
     * @param k2 The address of the K2 token.
     * @param fairLaunch The address of the fair launch staking contract.
     * @param isKVCMClaimEnabled A flag to enable or disable KVCM claims.
     * @param kVCMClaimStartTime The timestamp when KVCM claims can start.
     * @param adminWithdrawDelayPeriod The delay period for admin withdrawals.
     */
    function setConfig(
        address kvcm,
        address k2,
        address fairLaunch,
        bool isKVCMClaimEnabled,
        uint128 kVCMClaimStartTime,
        uint128 adminWithdrawDelayPeriod
    ) external onlyOwner {
        require(kvcm != address(0), "KVCM cannot be zero address");
        require(k2 != address(0), "K2 cannot be zero address");
        require(fairLaunch != address(0), "FairLaunch cannot be zero address");
        require(
            kVCMClaimStartTime > block.timestamp,
            "KVCM claim start time must be in the future"
        );

        FairLaunchClaimStorage.Config storage config = FairLaunchClaimStorage
            .getConfig();

        config.kvcm = kvcm;
        config.k2 = k2;
        config.fairLaunch = fairLaunch;
        config.isKVCMClaimEnabled = isKVCMClaimEnabled;
        config.kVCMClaimStartTime = kVCMClaimStartTime;
        config.adminWithdrawDelayPeriod = adminWithdrawDelayPeriod;
    }

    /**
     * @notice Adds a specified amount of KVCM tokens to the contract for claims.
     * @param amount The amount of KVCM to add.
     */
    function addKVCM(uint256 amount) external onlyOwner {
        // We have an option to pull it from an escrow, but using claim contract as an escrow should be fine.
        FairLaunchClaimStorage.Config storage config = FairLaunchClaimStorage
            .getConfig();
        IERC20(config.kvcm).safeTransferFrom(msg.sender, address(this), amount);
        FairLaunchClaimStorage.getState().kvcmForClaims += amount;
        emit KVCMAdded(amount);
    }

    function addK2(uint256 amount) external onlyOwner {
        FairLaunchClaimStorage.Config storage config = FairLaunchClaimStorage
            .getConfig();
        IERC20(config.k2).safeTransferFrom(msg.sender, address(this), amount);
        FairLaunchClaimStorage.getState().k2ForClaims += amount;
        emit K2Added(amount);
    }

    /**
     * @notice Withdraws a specified amount of a token from the contract.
     * @dev The withdrawal is subject to a time delay configured by the owner.
     * @param token The address of the token to withdraw.
     * @param amount The amount of the token to withdraw.
     */
    function withdrawToken(
        address token,
        uint256 amount
    ) external onlyOwner nonReentrant {
        FairLaunchClaimStorage.State storage state = FairLaunchClaimStorage
            .getState();
        require(
            state.tokenWithdrawTime[token] > 0,
            "Token withdraw not enabled"
        );
        require(
            block.timestamp >= state.tokenWithdrawTime[token],
            "Token withdraw not enabled"
        );
        IERC20(token).safeTransfer(msg.sender, amount);
        emit TokenWithdrawn(token, amount);
        state.tokenWithdrawTime[token] = 0;
    }

    /**
     * @notice Enables the withdrawal of a specific token after a delay period.
     * @param token The address of the token to enable withdrawal for.
     */
    function enableTokenWithdraw(address token) external onlyOwner {
        FairLaunchClaimStorage.State storage state = FairLaunchClaimStorage
            .getState();
        state.tokenWithdrawTime[token] =
            uint128(block.timestamp) +
            FairLaunchClaimStorage.getConfig().adminWithdrawDelayPeriod;
        emit TokenWithdrawEnabled(token);
    }

    /**
     * @notice Disables the withdrawal of a specific token.
     * @param token The address of the token to disable withdrawal for.
     */
    function disableTokenWithdraw(address token) external onlyOwner {
        FairLaunchClaimStorage.getState().tokenWithdrawTime[token] = 0;
        emit TokenWithdrawDisabled(token);
    }

    /**
     * @notice Sets the delay period for admin withdrawals.
     * @param delayPeriod The new delay period in seconds.
     */
    function setAdminWithdrawDelayPeriod(
        uint128 delayPeriod
    ) external onlyOwner {
        FairLaunchClaimStorage
            .getConfig()
            .adminWithdrawDelayPeriod = delayPeriod;
        emit AdminWithdrawDelayPeriodSet(delayPeriod);
    }

    /**
     * @notice Enables KVCM claiming. Can only be called by the owner.
     */
    function enableKVCMClaim() external onlyOwner {
        FairLaunchClaimStorage.Config storage config = FairLaunchClaimStorage
            .getConfig();
        require(!config.isKVCMClaimEnabled, "KVCM claim already enabled");
        config.isKVCMClaimEnabled = true;
        emit KVCMClaimEnabled();
    }

    /**
     * @notice Disables KVCM claiming. Can only be called by the owner.
     */
    function disableKVCMClaim() external onlyOwner {
        FairLaunchClaimStorage.Config storage config = FairLaunchClaimStorage
            .getConfig();
        require(config.isKVCMClaimEnabled, "KVCM claim already disabled");
        config.isKVCMClaimEnabled = false;
        emit KVCMClaimDisabled();
    }

    /**
     * @notice Pauses the contract. Can only be called by the owner.
     */
    function pause() external onlyOwner whenNotPaused {
        _pause();
    }

    /**
     * @notice Unpauses the contract. Can only be called by the owner.
     */
    function unpause() external onlyOwner whenPaused {
        _unpause();
    }

    // =============================================================
    // INTERNAL FUNCTIONS
    // =============================================================

    /**
     * @notice Authorizes an upgrade to a new implementation contract.
     * @dev Can only be called by the owner.
     * @param newImplementation The address of the new implementation contract.
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {
        require(
            newImplementation != address(0),
            "New implementation cannot be zero address"
        );
    }

    // =============================================================
    // PRIVATE FUNCTIONS
    // =============================================================

    /**
     * @notice Gets the storage slot for the configuration variables.
     * @return storageSlot The storage pointer to the Config struct.
     */
    function _getConfig()
        private
        pure
        returns (FairLaunchClaimStorage.Config storage storageSlot)
    {
        return FairLaunchClaimStorage.getConfig();
    }

    /**
     * @notice Gets the storage slot for the state variables.
     * @return storageSlot The storage pointer to the State struct.
     */
    function _getStorage()
        private
        pure
        returns (FairLaunchClaimStorage.State storage storageSlot)
    {
        return FairLaunchClaimStorage.getState();
    }
}
