// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IKlimaFairLaunchStaking {
    function finalizationComplete() external view returns (uint256);
}

interface IInterchainTokenService {
    function callContractWithInterchainToken(
        bytes32 tokenId,
        string calldata destinationChain,
        bytes calldata destinationAddress,
        uint256 amount,
        bytes calldata data,
        uint256 gasValue
    ) external payable;
}

// this contract is used to burn the KLIMA_V0 tokens after finalization. Before finalization, the KLIMA_V0 tokens are stored pending burn.

contract KlimaFairLaunchBurnVault is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    
    address public klimaFairLaunchStaking;

    mapping(address => uint256) public klimaAmountToBurn;
    uint256 public totalKlimaToBurn;

    address public HelperContractOnPolygon;
    address public InterchainTokenService = 0xB5FB4BE02232B1bBA4dC8f81dc24C26980dE9e3C;

    // constants
    address constant KLIMA_V0 = 0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2; // current klima address on Base
    bytes32 public constant TOKEN_ID = 0xdc30a9bd9048b5a833e3f90ea281f70ae77e82018fa5b96831d3a1f563e38aaf;
    string public constant DESTINATION_CHAIN = "Polygon";

    // events
    event KlimaFairLaunchStakingSet(address indexed klimaFairLaunchStaking);
    event FinalBurnInitiated(uint256 finalAmountBurned);
    event AddedKlimaAmountToBurn(address indexed user, uint256 amount);
    event EmergencyWithdrawalEnabled();
    event EmergencyWithdrawal(address indexed user, uint256 amount);

    bool public emergencyWithdrawalEnabled;

    /// @notice Disables initialization of the implementation contract
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the contract with the initial owner
    /// @param initialOwner Address that will be granted owner role
    function initialize(address initialOwner) external initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        emergencyWithdrawalEnabled = false;
    }

    /// @notice Authorizes an upgrade to a new implementation
    /// @param newImplementation Address of the new implementation contract
    /// @dev Can only be called by the owner
    /// @dev Validates that the new implementation address is not zero
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        require(newImplementation != address(0), "New implementation cannot be zero address");
    }

    function _AxelarBurn(uint256 amount) internal {
        require(HelperContractOnPolygon != address(0), "Helper contract not set");
        require(InterchainTokenService != address(0), "Interchain token service not set");
        require(amount > 0, "Amount must be greater than 0");
        
        // Approve the Interchain Token Service to spend our tokens
        IERC20(KLIMA_V0).approve(InterchainTokenService, amount);
        
        // Format the data according to Axelar's expected format
        // Use simple abi.encode without version prefix
        bytes memory data = abi.encode(amount, address(this));
        
        // Call the Axelar Interchain Token Service
        try IInterchainTokenService(InterchainTokenService).callContractWithInterchainToken{value: msg.value}(
            TOKEN_ID,
            DESTINATION_CHAIN,
            abi.encodePacked(HelperContractOnPolygon),
            amount,
            data,
            msg.value
        ) {
            // Success case
        } catch Error(string memory reason) {
            // If the call reverts with a reason, revert with that reason
            revert(reason);
        } catch {
            // If the call reverts without a reason, revert with a generic message
            revert("Axelar ITS call failed");
        }
    }

    function setHelperContractOnPolygon(address _HelperContractOnPolygon) external onlyOwner {
        HelperContractOnPolygon = _HelperContractOnPolygon;
    }

    function setInterchainTokenService(address _InterchainTokenService) external onlyOwner {
        InterchainTokenService = _InterchainTokenService;
    }

    function setKlimaFairLaunchStaking(address _klimaFairLaunchStaking) external onlyOwner {
        require(_klimaFairLaunchStaking != address(0), "Staking contract cannot be zero address");
        klimaFairLaunchStaking = _klimaFairLaunchStaking;
        emit KlimaFairLaunchStakingSet(_klimaFairLaunchStaking);
    }

    function enableEmergencyWithdrawal() external onlyOwner {
        require(!emergencyWithdrawalEnabled, "Emergency withdrawal already enabled");
        require(klimaFairLaunchStaking != address(0), "Staking contract not set");
        require(IKlimaFairLaunchStaking(klimaFairLaunchStaking).finalizationComplete() == 0, "Staking contract already finalized");
        emergencyWithdrawalEnabled = true;
        emit EmergencyWithdrawalEnabled();
    }

    function emergencyWithdraw() external {
        require(emergencyWithdrawalEnabled, "Emergency withdrawal not enabled");
        require(klimaAmountToBurn[msg.sender] > 0, "No tokens to withdraw");
        uint256 amount = klimaAmountToBurn[msg.sender];
        klimaAmountToBurn[msg.sender] = 0;
        require(IERC20(KLIMA_V0).transfer(msg.sender, amount), "Transfer failed");
        emit EmergencyWithdrawal(msg.sender, amount);
    }

    function initiateFinalBurn() external payable onlyOwner {
        require(!emergencyWithdrawalEnabled, "Emergency withdrawal is enabled");
        require(klimaFairLaunchStaking != address(0), "Staking contract not set");
        require(IKlimaFairLaunchStaking(klimaFairLaunchStaking).finalizationComplete() == 1, "Staking contract not finalized");
        _AxelarBurn(totalKlimaToBurn);
        emit FinalBurnInitiated(totalKlimaToBurn);
    }

    function addKlimaAmountToBurn(address _user, uint256 _amount) external {
        require(msg.sender == klimaFairLaunchStaking, "Caller is not staking contract");
        require(IERC20(KLIMA_V0).transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        klimaAmountToBurn[_user] += _amount;
        totalKlimaToBurn += _amount;
        emit AddedKlimaAmountToBurn(_user, _amount);
    }

    /// @dev Reserved storage space per auditor recommendation.
    uint256[50] private __gap;
}