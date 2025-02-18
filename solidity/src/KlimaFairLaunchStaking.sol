// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
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

contract KlimaFairLaunchStaking is Initializable, UUPSUpgradeable, OwnableUpgradeable, PausableUpgradeable {
    // user stakes
    struct Stake {
        uint256 amount;
        uint256 stakeStart;
        // points
        uint256 lastUpdateTime;
        uint256 bonusMultiplier;
        uint256 organicPoints;
        uint256 burnRatioSnapshot;
        uint256 burnAccrued;
    }

    mapping(address => Stake[]) public userStakes;

    // staking timeline
    uint256 startTimestamp; // (either via initialize or enableStaking())
    uint256 freezeTimestamp; // (set via same function as above)

    // global totals
    uint256 totalOrganicPoints;
    uint256 totalBurned;
    uint256 totalStaked;
    address[] stakerAddresses;
    uint256 public burnRatio;

    // finalization
    uint256 finalTotalPoints;
    uint256 finalizeIndex;
    uint256 finalizationComplete;

    // constants
    uint256 constant GROWTH_CONSTANT = 274;
    uint256 constant GROWTH_DENOMINATOR = 100000;
    address constant KLIMA_V0 = 0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2; // current klima address on Base
    // token state
    address public KLIMA;
    address public KLIMA_X;
    uint256 public constant KLIMA_SUPPLY = 17_500_000;
    uint256 public constant KLIMAX_SUPPLY = 40_000_000;

    // events
    event StakeCreated(address indexed user, uint256 amount, uint256 multiplier, uint256 startTimestamp);
    event StakeBurned(address indexed user, uint256 burnAmount, uint256 timestamp);
    event Claimed(address indexed user, uint256 klimaAmount, uint256 klimaXAmount);

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
        __Pausable_init();
        __UUPSUpgradeable_init();
    }

    /// @notice Authorizes an upgrade to a new implementation
    /// @param newImplementation Address of the new implementation contract
    /// @dev Can only be called by the owner
    /// @dev Validates that the new implementation address is not zero
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        require(newImplementation != address(0), "New implementation cannot be zero address");
    }

    // user functions

    /// @notice Allows users to stake KLIMA_V0 tokens to earn points
    /// @param amount Amount of KLIMA_V0 tokens to stake
    /// @dev Multiplier is 2x for week 1, 1.5x for week 2, 1x afterwards
    /// @dev Points accrue based on stake amount, time, and multiplier
    function stake(uint256 amount) public whenNotPaused {
        // Require valid amount
        require(amount > 0, "Amount must be greater than 0");

        // Require staking is active
        require(block.timestamp >= startTimestamp, "Staking not started");
        require(block.timestamp < freezeTimestamp, "Staking period ended");

        // Transfer KLIMA_V0 tokens to this contract
        require(IERC20(KLIMA_V0).transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Calculate multiplier based on current week
        uint256 multiplier;
        uint256 weeksPassed = (block.timestamp - startTimestamp) / 1 weeks;
        if (weeksPassed == 0) {
            multiplier = 200; // 2x for week 1
        } else if (weeksPassed == 1) {
            multiplier = 150; // 1.5x for week 2
        } else {
            multiplier = 100; // 1x for week 3+
        }

        // Add user to stakerAddresses if first stake
        if (userStakes[msg.sender].length == 0) {
            stakerAddresses.push(msg.sender);
        }

        // Create new stake
        Stake memory newStake = Stake({
            amount: amount,
            stakeStart: block.timestamp,
            lastUpdateTime: block.timestamp,
            bonusMultiplier: multiplier,
            organicPoints: 0,
            burnRatioSnapshot: burnRatio,
            burnAccrued: 0
        });

        // Add stake to user's stakes
        userStakes[msg.sender].push(newStake);

        // Update total staked amount
        totalStaked += amount;

        // Emit stake created event
        emit StakeCreated(msg.sender, amount, multiplier, block.timestamp);
    }

    /// @notice Allows users to unstake their KLIMA_V0 tokens
    /// @param amount Amount of tokens to unstake
    /// @dev Before freezeTimestamp: tokens are partially burned based on stake duration
    /// @dev After freezeTimestamp: converts stake to KLIMA and KLIMA_X tokens
    function unstake(uint256 amount) public whenNotPaused {
        // Update user's points before unstaking
        _updateUser(msg.sender);

        // Route to appropriate unstake function based on timestamp
        if (block.timestamp < freezeTimestamp) {
            _unstakeAndBurn(amount);
        } else {
            _claim();
        }
    }

    // internal functions

    /// @notice Processes unstaking before the freeze period, applying burn penalties
    /// @param amount Amount of tokens to unstake and partially burn
    /// @dev Burns tokens based on stake duration and updates points/ratios accordingly
    function _unstakeAndBurn(uint256 amount) internal {
        require(amount > 0, "Amount must be greater than 0");
        require(block.timestamp < freezeTimestamp, "Staking period ended");

        // Track total unstaked and burned for this operation
        uint256 totalUnstake = 0;
        uint256 totalBurnAmount = 0;

        // NEW: track total freed organic points to update burnRatio incrementally
        uint256 freedOrganicPointsTotal = 0;

        // Get user's stakes
        Stake[] storage stakes = userStakes[msg.sender];
        require(stakes.length > 0, "No stakes found");

        // Process stakes from newest to oldest
        for (uint256 i = stakes.length; i > 0 && totalUnstake < amount; i--) {
            Stake storage currentStake = stakes[i - 1];

            // Calculate how much to unstake from this stake
            uint256 stakeUnstakeAmount = amount - totalUnstake;
            if (stakeUnstakeAmount > currentStake.amount) {
                stakeUnstakeAmount = currentStake.amount;
            }

            // Calculate burn for this unstaked portion
            uint256 burnForStake = calculateBurn(stakeUnstakeAmount, currentStake.stakeStart);

            // NEW: capture original organic points (and optionally burn accrued)
            uint256 originalOrganicPoints = currentStake.organicPoints;
            uint256 originalAmount = currentStake.amount; // before reduction

            // Update stake amount
            currentStake.amount = originalAmount - stakeUnstakeAmount;

            // Update organic points proportionally
            if (originalAmount > 0) {
                uint256 newOrganicPoints = (originalOrganicPoints * currentStake.amount) / originalAmount;
                // Accumulate freed organic points from this stake
                uint256 freedOrganicPoints = originalOrganicPoints - newOrganicPoints;
                freedOrganicPointsTotal += freedOrganicPoints;
                // Update global total organic points
                totalOrganicPoints -= freedOrganicPoints;
                currentStake.organicPoints = newOrganicPoints;
            } else {
                currentStake.organicPoints = 0;
                // Update global total organic points
                totalOrganicPoints -= originalOrganicPoints;
            }

            // Update burn accrual proportionally
            uint256 originalBurnAccrued = currentStake.burnAccrued;
            if (originalAmount > 0) {
                currentStake.burnAccrued = (originalBurnAccrued * currentStake.amount) / originalAmount;
            } else {
                currentStake.burnAccrued = 0;
            }

            totalUnstake += stakeUnstakeAmount;
            totalBurnAmount += burnForStake;

            // Remove stake if fully unstaked
            if (currentStake.amount == 0) {
                // Remove stake by swapping with last element and popping
                stakes[i - 1] = stakes[stakes.length - 1];
                stakes.pop();
            }
        }

        require(totalUnstake == amount, "Insufficient stake balance");

        // Update global state
        totalStaked -= amount;
        totalBurned += totalBurnAmount;

        // Calculate burn ratio update AFTER updating totalOrganicPoints
        // This ensures correct distribution of freed points to remaining stakers
        if (totalOrganicPoints > 0) {
            // First multiply by scaling factor to maintain precision
            uint256 scaledFreedPoints = freedOrganicPointsTotal * GROWTH_DENOMINATOR;
            // Safe division using remaining organic points
            uint256 deltaRatio = scaledFreedPoints / totalOrganicPoints;
            // Update burn ratio
            burnRatio = burnRatio + deltaRatio;
        }

        // Burn the tokens for the burn portion before transferring remaining tokens
        if (totalBurnAmount > 0) {
            IERC20Burnable(KLIMA_V0).burn(address(this), totalBurnAmount);
        }

        // Transfer remaining tokens back to user (amount unstaked minus the burned tokens)
        uint256 remainingAmount = amount - totalBurnAmount;
        if (remainingAmount > 0) {
            require(IERC20(KLIMA_V0).transfer(msg.sender, remainingAmount), "Transfer failed");
        }

        // Emit event
        emit StakeBurned(msg.sender, totalBurnAmount, block.timestamp);
    }

    /// @notice Claims KLIMA and KLIMA_X tokens after the freeze period
    /// @dev Requires finalization to be complete
    /// @dev Converts staked amount to KLIMA and points to KLIMA_X
    /// @dev Burns the original KLIMA_V0 tokens when claiming
    function _claim() internal {
        require(block.timestamp >= freezeTimestamp, "Staking period not ended");
        require(finalizationComplete == 1, "Finalization not complete");

        // Get user's total staked amount and points
        uint256 totalUserStaked = 0;
        uint256 totalUserPoints = 0;

        Stake[] storage userStakesList = userStakes[msg.sender];
        for (uint256 i = 0; i < userStakesList.length; i++) {
            Stake storage userStake = userStakesList[i];
            totalUserStaked += userStake.amount;
            totalUserPoints += userStake.organicPoints + userStake.burnAccrued;
        }

        // Calculate allocations
        uint256 klimaAllocation = (totalUserStaked * KLIMA_SUPPLY) / totalStaked;
        uint256 klimaXAllocation = (totalUserPoints * KLIMAX_SUPPLY) / finalTotalPoints;

        // Burn the original KLIMA_V0 tokens
        IERC20Burnable(KLIMA_V0).burn(address(this), totalUserStaked);

        // Clear user's stakes
        delete userStakes[msg.sender];

        // Transfer new tokens to user
        require(IERC20(KLIMA).transfer(msg.sender, klimaAllocation), "KLIMA transfer failed");
        require(IERC20(KLIMA_X).transfer(msg.sender, klimaXAllocation), "KLIMA_X transfer failed");

        emit Claimed(msg.sender, klimaAllocation, klimaXAllocation);
    }

    /// @notice Updates a user's points and burn distribution
    /// @param _user Address of the user to update
    function _updateUser(address _user) internal {
        _updateOrganicPoints(_user);
        _updateBurnDistribution(_user);
    }

    /// @notice Updates organic points for a user's stakes
    /// @param _user Address of the user to update
    /// @dev Points accrue based on stake amount, time, and multiplier
    function _updateOrganicPoints(address _user) internal {
        Stake[] storage userStakesList = userStakes[_user];

        for (uint256 i = 0; i < userStakesList.length; i++) {
            Stake storage userStake = userStakesList[i];

            uint256 timeElapsed = block.timestamp - userStake.lastUpdateTime;
            uint256 newPoints =
                (userStake.amount * userStake.bonusMultiplier * timeElapsed * GROWTH_CONSTANT) / GROWTH_DENOMINATOR;

            totalOrganicPoints += newPoints;
            userStake.organicPoints += newPoints;
            userStake.lastUpdateTime = block.timestamp;
        }
    }

    /// @notice Updates burn distribution for a user's stakes
    /// @param _user Address of the user to update
    /// @dev Distributes burned tokens proportionally based on organic points
    function _updateBurnDistribution(address _user) internal {
        Stake[] storage userStakesList = userStakes[_user];

        for (uint256 i = 0; i < userStakesList.length; i++) {
            Stake storage userStake = userStakesList[i];

            uint256 burnRatioDiff = burnRatio - userStake.burnRatioSnapshot;
            if (burnRatioDiff > 0) {
                uint256 newBurnAccrual = (userStake.organicPoints * burnRatioDiff) / GROWTH_DENOMINATOR;
                userStake.burnAccrued += newBurnAccrual;
            }
            userStake.burnRatioSnapshot = burnRatio;
        }
    }

    // admin functions

    /// @notice Sets the addresses for KLIMA and KLIMA_X tokens
    /// @param _klima Address of the KLIMA token contract
    /// @param _klimax Address of the KLIMA_X token contract
    /// @dev Can only be called by the owner
    function setTokenAddresses(address _klima, address _klimax) external onlyOwner {
        KLIMA = _klima;
        KLIMA_X = _klimax;
    }

    // TODO
    // verify with team how this functions
    // do we need a flag to only allow one call to this function?

    /// @notice Enables staking by setting the start timestamp
    /// @param _startTimestamp Timestamp when staking begins
    /// @dev Freeze timestamp is 90 days after start
    /// @dev Can only be called by the owner
    function enableStaking(uint256 _startTimestamp) external onlyOwner {
        require(_startTimestamp > block.timestamp, "Start timestamp cannot be in the past");
        startTimestamp = _startTimestamp;
        freezeTimestamp = _startTimestamp + 90 days;
    }

    /// @notice Stores the final total points for distribution
    /// @param batchSize Number of staker addresses to process in this batch
    /// @dev Can only be called by the owner after freeze timestamp
    /// @dev Processes stakers in batches to avoid gas limits
    function storeTotalPoints(uint256 batchSize) public onlyOwner {
        // Require staking to be locked (current time >= freezeTimestamp)
        require(block.timestamp >= freezeTimestamp, "Staking period not locked");

        // Require finalization not complete
        require(finalizationComplete == 0, "Finalization already complete");

        // Calculate end index for this batch
        uint256 endIndex = finalizeIndex + batchSize;
        if (endIndex > stakerAddresses.length) {
            endIndex = stakerAddresses.length;
        }

        // Process each address in the batch
        for (uint256 i = finalizeIndex; i < endIndex; i++) {
            address staker = stakerAddresses[i];
            Stake[] storage stakes = userStakes[staker];

            // Update points for this staker's stakes
            _updateOrganicPoints(staker);
            _updateBurnDistribution(staker);

            // Sum all stakes' organic points for this user
            for (uint256 j = 0; j < stakes.length; j++) {
                finalTotalPoints += stakes[j].organicPoints;
            }
        }

        // Update the finalize index
        finalizeIndex = endIndex;

        // If we've processed all addresses, mark finalization as complete
        if (finalizeIndex == stakerAddresses.length) {
            finalizationComplete = 1;
        }
    }

    // pure functions

    /// @notice Calculates the amount of tokens to burn when unstaking
    /// @param amount Amount of tokens being unstaked
    /// @param stakeStart Timestamp when the stake was created
    /// @return Amount of tokens to burn
    /// @dev Base burn is 25%, additional burn up to 75% based on stake duration
    function calculateBurn(uint256 amount, uint256 stakeStart) public view returns (uint256) {
        // Base burn is 25% of amount
        uint256 baseBurn = (amount * 25) / 100;

        // Calculate time-based burn percentage (capped at 75%)
        uint256 daysStaked = (block.timestamp - stakeStart) / 1 days;
        uint256 timeBasedBurnPercent = (daysStaked * 75) / 365;
        if (timeBasedBurnPercent > 75) timeBasedBurnPercent = 75;

        // Calculate time-based burn amount
        uint256 timeBasedBurn = (amount * timeBasedBurnPercent) / 100;

        // Return total burn
        return baseBurn + timeBasedBurn;
    }

    // view functions

    /// @notice Calculates the KLIMA token allocation for a given stake amount
    /// @param amount Amount of staked tokens
    /// @return Amount of KLIMA tokens to be received
    /// @dev Allocation = (stake amount / total staked) * KLIMA supply
    function calculateKlimaAllocation(uint256 amount) public view returns (uint256) {
        require(totalStaked > 0, "No KLIMA staked");

        // Calculate allocation: (amount / totalStaked) * KLIMA_SUPPLY
        return (amount * KLIMA_SUPPLY) / totalStaked;
    }

    /// @notice Calculates the KLIMA_X token allocation for a given point total
    /// @param points Number of points
    /// @return Amount of KLIMA_X tokens to be received
    /// @dev Allocation = (points / total points) * KLIMA_X supply
    /// @dev Can only be called after finalization is complete
    function calculateKlimaXAllocation(uint256 points) public view returns (uint256) {
        require(finalizationComplete == 1, "Finalization not complete");
        require(finalTotalPoints > 0, "No points recorded");

        // Calculate allocation: (points / finalTotalPoints) * KLIMAX_SUPPLY
        return (points * KLIMAX_SUPPLY) / finalTotalPoints;
    }

    /// @notice Previews a user's total points without updating state
    /// @param user Address of the user
    /// @return Total points including organic and burn points
    /// @dev Simulates point updates up to current timestamp
    function previewUserPoints(address user) public view returns (uint256) {
        uint256 totalPoints = 0;
        Stake[] storage userStakesList = userStakes[user];

        // For each stake, simulate organic and burn point updates
        for (uint256 i = 0; i < userStakesList.length; i++) {
            Stake storage userStake = userStakesList[i];

            // Simulate organic points update
            uint256 timeElapsed = block.timestamp - userStake.lastUpdateTime;
            uint256 newOrganicPoints = userStake.organicPoints
                + (userStake.amount * userStake.bonusMultiplier * timeElapsed * GROWTH_CONSTANT) / GROWTH_DENOMINATOR;

            // Simulate burn points update
            uint256 burnRatioDiff = burnRatio - userStake.burnRatioSnapshot;
            uint256 newBurnPoints = (newOrganicPoints * burnRatioDiff) / GROWTH_DENOMINATOR;

            // Add both types of points to total
            totalPoints += newOrganicPoints + (userStake.burnAccrued + newBurnPoints);
        }

        return totalPoints;
    }

    /// @notice Calculates total points across all users
    /// @return Sum of all user points
    /// @dev Should only be called off-chain due to gas costs
    /// @dev Simulates point updates for all users
    function getTotalPoints() public view returns (uint256) {
        uint256 totalPoints = 0;

        // Iterate through all staker addresses
        for (uint256 i = 0; i < stakerAddresses.length; i++) {
            // Get points for each user using previewUserPoints
            totalPoints += previewUserPoints(stakerAddresses[i]);
        }

        return totalPoints;
    }
}
