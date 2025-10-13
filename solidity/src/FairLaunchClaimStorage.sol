// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title FairLaunchClaimStorage
 * @notice A library defining the storage layout for the FairLaunchClaim contract.
 * @dev This library uses the unstructured storage pattern to prevent storage layout collisions during upgrades.
 * The storage pointers are retrieved using specific function calls that point to a predetermined memory slot.
 * See: https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable#storage-only-contracts
 */
library FairLaunchClaimStorage {
    // keccak256(abi.encode(uint256(keccak256("fairlaunch.claim.state")) - 1)) & ~bytes32(uint256(0xff));
    bytes32 private constant STATE_STORAGE_LOCATION =
        0x3768acc97eca7fdb191311f7476746b6649a761c8516c4d4207727e759011100;

    // keccak256(abi.encode(uint256(keccak256("fairlaunch.claim.config")) - 1)) & ~bytes32(uint256(0xff));
    bytes32 private constant CLAIM_STORAGE_LOCATION =
        0x03241f6efe904650b35253d0145fdf3f2b36f467117cee2845ae2a98bc6ddb00;

    /// @notice The role that can upgrade the contract.
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /**
     * @notice Configuration parameters for the FairLaunchClaim contract.
     * @custom:storage-location erc7201:fairlaunch.claim.config
     */
    struct Config {
        address kvcm;
        bool isKVCMClaimEnabled;
        address k2;
        address fairLaunch;
        uint128 kVCMClaimStartTime;
        uint128 adminWithdrawDelayPeriod;
        uint256[50] _gap;
    }

    /**
     * @notice State variables for the FairLaunchClaim contract.
     * @custom:storage-location erc7201:fairlaunch.claim.state
     * @param kvcmForClaims The total amount of KVCM available for claims.
     * @param userClaimableAmount A mapping from user addresses to the amount of KVCM they have claimed.
     * @param tokenWithdrawTime A mapping from token addresses to the timestamp when they can be withdrawn.
     */
    struct State {
        uint256 kvcmForClaims;
        uint256 k2ForClaims;
        mapping(address => uint256) userClaimableAmount;
        mapping(address => uint128) tokenWithdrawTime;
        uint256[50] _gap;
    }

    /**
     * @notice Gets the storage slot for the state variables.
     * @return $ The storage pointer to the State struct.
     */
    function getState() internal pure returns (State storage $) {
        bytes32 location = STATE_STORAGE_LOCATION;
        assembly {
            $.slot := location
        }
    }

    /**
     * @notice Gets the storage slot for the configuration variables.
     * @return $ The storage pointer to the Config struct.
     */
    function getConfig() internal pure returns (Config storage $) {
        bytes32 location = CLAIM_STORAGE_LOCATION;
        assembly {
            $.slot := location
        }
    }
}
