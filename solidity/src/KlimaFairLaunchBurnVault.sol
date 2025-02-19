// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IERC20Burnable Interface
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20Burnable {
    /**
     * @notice Function to burn tokens.
     * @dev Can only be called by the minter address.
     * @param from The address that will have its tokens burnt.
     * @param amount The amount of tokens to burn.
     */
    function burn(address from, uint256 amount) external;
}

interface IKlimaFairLaunchStaking {
    function finalizationComplete() external view returns (uint256);
}

// this contract is used to burn the KLIMA_V0 tokens after finalization. Before finalization, the KLIMA_V0 tokens are stored pending burn.

contract KlimaFairLaunchBurnVault is Initializable, UUPSUpgradeable, OwnableUpgradeable {

    address public klimaFairLaunchStaking;

    mapping(address => uint256) public klimaAmountToBurn;

    // constants
    address constant KLIMA_V0 = 0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2; // current klima address on Base

    // events
    event KlimaFairLaunchStakingSet(address indexed klimaFairLaunchStaking);
    event FinalBurnPerformed();
    event AddedKlimaAmountToBurn(address indexed user, uint256 amount);
    // TODO
    // receive function (if exists)
    // fallback function (if exists)

    /// @dev Reserved storage space per auditor recommendation.
    uint256[50] private __gap;

    /// @notice Disables initialization of the implementation contract
    constructor() {
        _disableInitializers();
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

    function performFinalBurn() external onlyOwner {
        require(klimaFairLaunchStaking != address(0), "Staking contract not set");
        require(IKlimaFairLaunchStaking(klimaFairLaunchStaking).finalizationComplete() == 1, "Staking contract not finalized");
        IERC20Burnable(KLIMA_V0).burn(address(this), IERC20(KLIMA_V0).balanceOf(address(this)));
        emit FinalBurnPerformed();
    }

    function setKlimaFairLaunchStaking(address _klimaFairLaunchStaking) external onlyOwner {
        require(_klimaFairLaunchStaking != address(0), "Staking contract cannot be zero address");
        klimaFairLaunchStaking = _klimaFairLaunchStaking;
        emit KlimaFairLaunchStakingSet(_klimaFairLaunchStaking);
    }

    function addKlimaAmountToBurn(address _user, uint256 _amount) external {
        require(IERC20(KLIMA_V0).transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        klimaAmountToBurn[_user] += _amount;
        emit AddedKlimaAmountToBurn(_user, _amount);
    }
}