// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { InterchainTokenExecutable } from '@axelar-network/interchain-token-service/contracts/executable/InterchainTokenExecutable.sol';

interface IKLIMA_V0_TOKEN {
    function burn(uint256 amount) external;
}

contract KlimaFairLaunchPolygonBurnHelper is InterchainTokenExecutable, OwnableUpgradeable, UUPSUpgradeable {
    address public KLIMA;

    constructor(address interchainTokenService_, address KLIMA_) InterchainTokenExecutable(interchainTokenService_) {
        _disableInitializers();
        KLIMA = KLIMA_;
    }

    /// @notice Initializes the contract with the initial owner
    /// @param initialOwner Address that will be granted owner role
    function initialize(address initialOwner) external initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }


    /// @notice Authorizes an upgrade to a new implementation
    /// @param newImplementation Address of the new implementation contract
    /// @dev Can only be called by the owner
    /// @dev Validates that the new implementation address is not zero
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        require(newImplementation != address(0), "New implementation cannot be zero address");
    }

    function setKLIMA(address _KLIMA) external onlyOwner {
        require(_KLIMA != address(0), "KLIMA cannot be zero address");
        KLIMA = _KLIMA;
    }

    /**
     * @notice Internal function containing the logic to be executed with interchain token transfer.
     * derived contracts must implement @dev Logic.
     * @param commandId The unique message id.
     * @param sourceChain The source chain of the token transfer.
     * @param sourceAddress The source address of the token transfer.
     * @param data The data associated with the token transfer.
     * @param tokenId The token ID.
     * @param token The token address.
     * @param amount The amount of tokens being transferred.
     */
    function _executeWithInterchainToken(
        bytes32 commandId,
        string calldata sourceChain,
        bytes calldata sourceAddress,
        bytes calldata data,
        bytes32 tokenId,
        address token,
        uint256 amount
    ) internal override {
        require(token == KLIMA, "Invalid token");
        IKLIMA_V0_TOKEN(KLIMA).burn(amount);
    }

    /// @dev Reserved storage space per auditor recommendation.
    uint256[50] private __gap;
}