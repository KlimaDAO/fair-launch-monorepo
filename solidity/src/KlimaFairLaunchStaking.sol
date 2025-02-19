// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IKlimaFairLaunchBurnVault {
    function addKlimaAmountToBurn(address _user, uint256 _amount) external;
}

contract KlimaFairLaunchStaking is Initializable, UUPSUpgradeable, OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {
    // user stakes
    struct Stake {
        uint256 amount;
        uint256 stakeStartTime;
        // points
        uint256 lastUpdateTime;
        uint256 bonusMultiplier;
        uint256 organicPoints;
        uint256 burnRatioSnapshot;
        uint256 burnAccrued;
        uint256 hasBeenClaimed;  // 0 = not claimed, 1 = claimed
    }

    mapping(address => Stake[]) public userStakes;

    // staking timeline
    uint256 public startTimestamp;
    uint256 public freezeTimestamp;

    // global totals
    uint256 totalOrganicPoints;
    uint256 totalBurned;
    uint256 public totalStaked;
    address[] stakerAddresses;
    uint256 public burnRatio;

    // finalization
    uint256 finalTotalPoints;
    uint256 finalizeIndex;
    uint256 public finalizationComplete;

    // constants
    uint256 constant GROWTH_DENOMINATOR = 100000;
    address constant KLIMA_V0 = 0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2; // current klima address on Base
    
    uint256 public GROWTH_RATE = 274;

    // token state
    address public KLIMA;
    address public KLIMA_X;
    uint256 public KLIMA_SUPPLY = 17_500_000;
    uint256 public KLIMAX_SUPPLY = 40_000_000;
    address public burnVault;
    // events
    event StakeCreated(address indexed user, uint256 amount, uint256 multiplier, uint256 startTimestamp);
    event StakeBurned(address indexed user, uint256 burnAmount, uint256 timestamp);
    event Claimed(address indexed user, uint256 klimaAmount, uint256 klimaXAmount);
    event FinalizationComplete();
    event TokenAddressesSet(address indexed klima, address indexed klimax);
    event StakingEnabled(uint256 startTimestamp, uint256 freezeTimestamp);
    event StakingExtended(uint256 oldFreezeTimestamp, uint256 newFreezeTimestamp);
    event BurnVaultSet(address indexed burnVault);
    event GrowthRateSet(uint256 newValue);
    event KlimaSupplySet(uint256 newValue);
    event KlimaXSupplySet(uint256 newValue);
    
    /// @dev Reserved storage space per auditor recommendation.
    uint256[50] private __gap;

    /// @notice Prevents actions after staking has started
    /// @dev Used to lock configuration changes once staking begins
    modifier beforeStartTimestamp() {
        require(startTimestamp == 0 || block.timestamp < startTimestamp, "Staking has already started");
        _;
    }

    /// @notice Prevents actions after finalization is complete
    /// @dev Used to lock changes that would affect final distribution
    modifier beforeFinalization() {
        require(finalizationComplete == 0, "Finalization already complete");
        _;
    }

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
        __ReentrancyGuard_init();
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
            stakeStartTime: block.timestamp,
            lastUpdateTime: block.timestamp,
            bonusMultiplier: multiplier,
            organicPoints: 0,
            burnRatioSnapshot: burnRatio,
            burnAccrued: 0,
            hasBeenClaimed: 0
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
    function _unstakeAndBurn(uint256 amount) internal nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(block.timestamp < freezeTimestamp, "Staking period ended");

        // Track totals
        uint256 totalUnstake = 0;
        uint256 totalBurnAmount = 0;

        // track total freed organic points to update burnRatio incrementally
        uint256 freedOrganicPointsTotal = 0;

        // Load stakes into memory
        Stake[] memory stakes = userStakes[msg.sender];
        require(stakes.length > 0, "No stakes found");

        // Create temporary array to track updated stakes
        Stake[] memory updatedStakes = new Stake[](stakes.length);

        // Process stakes from newest to oldest
        for (uint256 i = stakes.length; i > 0 && totalUnstake < amount; i--) {
            Stake memory currentStake = stakes[i - 1];

            uint256 stakeUnstakeAmount = amount - totalUnstake;
            if (stakeUnstakeAmount > currentStake.amount) {
                stakeUnstakeAmount = currentStake.amount;
            }

            uint256 burnForStake = calculateBurn(stakeUnstakeAmount, currentStake.stakeStartTime);
            uint256 originalAmount = currentStake.amount;
            
            // Update stake
            currentStake.amount = originalAmount - stakeUnstakeAmount;

            uint256 originalOrganicPoints = currentStake.organicPoints;
            uint256 newOrganicPoints = (originalOrganicPoints * currentStake.amount) / originalAmount;
            freedOrganicPointsTotal += originalOrganicPoints - newOrganicPoints;
            currentStake.organicPoints = newOrganicPoints;
            currentStake.burnAccrued = (currentStake.burnAccrued * currentStake.amount) / originalAmount;

            totalUnstake += stakeUnstakeAmount;
            totalBurnAmount += burnForStake;

            // Keep all stakes for final distribution
            updatedStakes[i - 1] = currentStake;
        }

        require(totalUnstake == amount, "Insufficient stake balance");

        // Update storage once with final state
        Stake[] storage userStakesList = userStakes[msg.sender];
        for (uint256 i = 0; i < stakes.length; i++) {
            userStakesList[i] = updatedStakes[i];
        }

        // Update global state
        totalStaked -= amount;
        totalBurned += totalBurnAmount;
        totalOrganicPoints -= freedOrganicPointsTotal;

        // Update burn ratio
        if (totalOrganicPoints > 0) {
            uint256 scaledFreedPoints = freedOrganicPointsTotal * GROWTH_DENOMINATOR;
            uint256 deltaRatio = scaledFreedPoints / totalOrganicPoints;
            burnRatio = burnRatio + deltaRatio;
        }

        // Send tokens to burn vault for the burn portion before transferring remaining tokens
        if (totalBurnAmount > 0) {
            require(IERC20(KLIMA_V0).approve(burnVault, totalBurnAmount), "Approve failed");
            IKlimaFairLaunchBurnVault(burnVault).addKlimaAmountToBurn(msg.sender, totalBurnAmount);
        }

        // Transfer remaining tokens back to user (amount unstaked minus the burned tokens)
        uint256 remainingAmount = amount - totalBurnAmount;
        if (remainingAmount > 0) {
            require(IERC20(KLIMA_V0).transfer(msg.sender, remainingAmount), "Transfer failed");
        }

        emit StakeBurned(msg.sender, totalBurnAmount, block.timestamp);
    }

    /// @notice Claims KLIMA and KLIMA_X tokens after the freeze period
    /// @dev Requires finalization to be complete
    /// @dev Converts staked amount to KLIMA and points to KLIMA_X
    /// @dev Burns the original KLIMA_V0 tokens when claiming
    function _claim() internal nonReentrant {
        require(block.timestamp >= freezeTimestamp, "Staking period not ended");
        require(finalizationComplete == 1, "Finalization not complete");

        uint256 totalUserStaked = 0;
        uint256 totalUserPoints = 0;
        bool hasUnclaimedStakes = false;

        // Load stakes into memory
        Stake[] memory stakes = userStakes[msg.sender];
        Stake[] memory updatedStakes = new Stake[](stakes.length);

        // Process all stakes in memory
        for (uint256 i = 0; i < stakes.length; i++) {
            Stake memory currentStake = stakes[i];
            
            // Only add unclaimed stakes to totals
            if (currentStake.hasBeenClaimed == 0) {
                totalUserStaked += currentStake.amount;
                totalUserPoints += currentStake.organicPoints + currentStake.burnAccrued;
                hasUnclaimedStakes = true;
            }
            
            // Mark as claimed regardless
            currentStake.hasBeenClaimed = 1;
            updatedStakes[i] = currentStake;
        }

        // Require at least one unclaimed stake
        require(hasUnclaimedStakes, "No unclaimed stakes found");

        // Update storage once
        Stake[] storage userStakesList = userStakes[msg.sender];
        for (uint256 i = 0; i < stakes.length; i++) {
            userStakesList[i] = updatedStakes[i];
        }

        // Calculate allocations
        uint256 klimaAllocation = (totalUserStaked * KLIMA_SUPPLY) / totalStaked;
        uint256 klimaXAllocation = (totalUserPoints * KLIMAX_SUPPLY) / finalTotalPoints;

        // Only process KLIMA_V0 burn if there are tokens to burn
        if (totalUserStaked > 0) {
            require(IERC20(KLIMA_V0).approve(burnVault, totalUserStaked), "Approve failed");
            IKlimaFairLaunchBurnVault(burnVault).addKlimaAmountToBurn(msg.sender, totalUserStaked);
        }

        // Transfer new tokens to user (if any)
        if (klimaAllocation > 0) {
            require(IERC20(KLIMA).transfer(msg.sender, klimaAllocation), "KLIMA transfer failed");
        }
        if (klimaXAllocation > 0) {
            require(IERC20(KLIMA_X).transfer(msg.sender, klimaXAllocation), "KLIMA_X transfer failed");
        }

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
        // Load stakes into memory
        Stake[] memory stakes = userStakes[_user];
        Stake[] memory updatedStakes = new Stake[](stakes.length);
        uint256 newTotalOrganicPoints = totalOrganicPoints;

        // Process all stakes in memory
        for (uint256 i = 0; i < stakes.length; i++) {
            Stake memory currentStake = stakes[i];

            uint256 timeElapsed = block.timestamp - currentStake.lastUpdateTime;
            uint256 newPoints = 
                (currentStake.amount * currentStake.bonusMultiplier * timeElapsed * GROWTH_RATE) / GROWTH_DENOMINATOR;

            newTotalOrganicPoints += newPoints;
            currentStake.organicPoints += newPoints;
            currentStake.lastUpdateTime = block.timestamp;
            
            updatedStakes[i] = currentStake;
        }

        // Update storage once
        Stake[] storage userStakesList = userStakes[_user];
        for (uint256 i = 0; i < stakes.length; i++) {
            userStakesList[i] = updatedStakes[i];
        }
        totalOrganicPoints = newTotalOrganicPoints;
    }

    /// @notice Updates burn distribution for a user's stakes
    /// @param _user Address of the user to update
    /// @dev Distributes burned tokens proportionally based on organic points
    function _updateBurnDistribution(address _user) internal {
        // Load stakes into memory
        Stake[] memory stakes = userStakes[_user];
        Stake[] memory updatedStakes = new Stake[](stakes.length);

        // Process all stakes in memory
        for (uint256 i = 0; i < stakes.length; i++) {
            Stake memory currentStake = stakes[i];

            uint256 burnRatioDiff = burnRatio - currentStake.burnRatioSnapshot;
            if (burnRatioDiff > 0) {
                uint256 newBurnAccrual = (currentStake.organicPoints * burnRatioDiff) / GROWTH_DENOMINATOR;
                currentStake.burnAccrued += newBurnAccrual;
            }
            currentStake.burnRatioSnapshot = burnRatio;
            
            updatedStakes[i] = currentStake;
        }

        // Update storage once
        Stake[] storage userStakesList = userStakes[_user];
        for (uint256 i = 0; i < stakes.length; i++) {
            userStakesList[i] = updatedStakes[i];
        }
    }

    // admin functions

    /// @notice Sets the addresses for KLIMA and KLIMA_X tokens
    /// @param _klima Address of the KLIMA token contract
    /// @param _klimax Address of the KLIMA_X token contract
    /// @dev Can only be called by the owner
    function setTokenAddresses(address _klima, address _klimax) external onlyOwner {
        require(_klima != address(0) && _klimax != address(0), "Invalid token addresses");
        KLIMA = _klima;
        KLIMA_X = _klimax;
        emit TokenAddressesSet(_klima, _klimax);
    }

    /// @notice Enables staking by setting the start timestamp
    /// @param _startTimestamp Timestamp when staking begins
    /// @dev Freeze timestamp is 90 days after start
    /// @dev Can only be called by the owner
    function enableStaking(uint256 _startTimestamp) external onlyOwner beforeStartTimestamp {
        require(_startTimestamp > block.timestamp, "Start timestamp cannot be in the past");
        require(burnVault != address(0), "Burn vault not set");
        startTimestamp = _startTimestamp;
        freezeTimestamp = _startTimestamp + 90 days;
        emit StakingEnabled(_startTimestamp, freezeTimestamp);
    }

    /// @notice Stores the final total points for distribution
    /// @param batchSize Number of staker addresses to process in this batch
    /// @dev Can only be called by the owner after freeze timestamp
    /// @dev Processes stakers in batches to avoid gas limits
    function storeTotalPoints(uint256 batchSize) public onlyOwner beforeFinalization {
        require(block.timestamp >= freezeTimestamp, "Staking period not locked");


        // Calculate end index for this batch
        uint256 endIndex = finalizeIndex + batchSize;
        if (endIndex > stakerAddresses.length) {
            endIndex = stakerAddresses.length;
        }

        // Track new points in memory
        uint256 newFinalTotalPoints = finalTotalPoints;

        // Process each address in the batch
        for (uint256 i = finalizeIndex; i < endIndex; i++) {
            address staker = stakerAddresses[i];
            
            // Load stakes into memory
            Stake[] memory stakes = userStakes[staker];
            
            // Update points for this staker's stakes
            _updateOrganicPoints(staker);
            _updateBurnDistribution(staker);

            // Reload stakes after updates
            stakes = userStakes[staker];

            // Sum all stakes' points for this user
            for (uint256 j = 0; j < stakes.length; j++) {
                newFinalTotalPoints += stakes[j].organicPoints;
            }
        }

        // Update storage once
        finalTotalPoints = newFinalTotalPoints;
        finalizeIndex = endIndex;

        // If we've processed all addresses, mark finalization as complete
        if (finalizeIndex == stakerAddresses.length) {
            require(IERC20(KLIMA).balanceOf(address(this)) >= KLIMA_SUPPLY, "Insufficient KLIMA balance");
            require(IERC20(KLIMA_X).balanceOf(address(this)) >= KLIMAX_SUPPLY, "Insufficient KLIMA_X balance");
            finalizationComplete = 1;
            emit FinalizationComplete();
        }
    }

    /// @notice Sets the growth rate for point accrual
    /// @param _newValue New growth rate value
    /// @dev Can only be called before staking starts
    /// @dev Must be less than GROWTH_DENOMINATOR to prevent excessive point accrual
    function setGrowthRate(uint256 _newValue) external onlyOwner beforeStartTimestamp {
        require(_newValue > 0, "Growth Rate must be greater than 0");
        require(_newValue < GROWTH_DENOMINATOR, "Growth Rate must be less than denominator");
        GROWTH_RATE = _newValue;
        emit GrowthRateSet(_newValue);
    }

    /// @notice Sets the total KLIMA token supply for distribution
    /// @param _newValue New KLIMA supply value
    /// @dev Can only be called before finalization
    function setKlimaSupply(uint256 _newValue) external onlyOwner beforeFinalization {
        require(_newValue > 0, "KLIMA supply must be greater than 0");
        KLIMA_SUPPLY = _newValue;
        emit KlimaSupplySet(_newValue);
    }

    /// @notice Sets the total KLIMA_X token supply for distribution
    /// @param _newValue New KLIMA_X supply value
    /// @dev Can only be called before finalization
    function setKlimaXSupply(uint256 _newValue) external onlyOwner beforeFinalization {
        require(_newValue > 0, "KLIMA_X supply must be greater than 0");
        KLIMAX_SUPPLY = _newValue;
        emit KlimaXSupplySet(_newValue);
    }

    /// @notice Sets the burn vault address
    /// @param _burnVault Address of the burn vault contract
    /// @dev Can only be called by the owner before staking starts
    function setBurnVault(address _burnVault) external onlyOwner beforeStartTimestamp {
        require(_burnVault != address(0), "Invalid burn vault address");
        burnVault = _burnVault;
        emit BurnVaultSet(_burnVault);
    }

    /// @notice Updates the freeze timestamp to a later time
    /// @param _newFreezeTimestamp New timestamp when staking ends
    /// @dev Can only extend the freeze period, not shorten it
    /// @dev Can only be called before finalization and before current freeze time
    function setFreezeTimestamp(uint256 _newFreezeTimestamp) external onlyOwner beforeFinalization {
        require(startTimestamp > 0, "Staking not initialized");
        require(block.timestamp < freezeTimestamp, "Staking period already ended");
        require(_newFreezeTimestamp > freezeTimestamp, "Can only extend freeze period");
        require(_newFreezeTimestamp > block.timestamp, "Freeze timestamp must be future");
        
        uint256 oldFreezeTimestamp = freezeTimestamp;
        freezeTimestamp = _newFreezeTimestamp;
        emit StakingExtended(oldFreezeTimestamp, _newFreezeTimestamp);
    }

    // pure functions

    /// @notice Calculates the amount of tokens to burn when unstaking
    /// @param amount Amount of tokens being unstaked
    /// @param stakeStartTime Timestamp when the stake was created
    /// @return Amount of tokens to burn
    /// @dev Base burn is 25%, additional burn up to 75% based on stake duration
    function calculateBurn(uint256 amount, uint256 stakeStartTime) public view returns (uint256) {
        // Base burn is 25% of amount
        uint256 baseBurn = (amount * 25) / 100;

        // Calculate time-based burn percentage (capped at 75%)
        uint256 daysStaked = (block.timestamp - stakeStartTime) / 1 days;
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
        
        // Load stakes into memory once
        Stake[] memory stakes = userStakes[user];

        // For each stake, simulate organic and burn point updates
        for (uint256 i = 0; i < stakes.length; i++) {
            Stake memory currentStake = stakes[i];

            // Simulate organic points update
            uint256 timeElapsed = block.timestamp - currentStake.lastUpdateTime;
            uint256 newOrganicPoints = currentStake.organicPoints
                + (currentStake.amount * currentStake.bonusMultiplier * timeElapsed * GROWTH_RATE) / GROWTH_DENOMINATOR;

            // Simulate burn points update
            uint256 burnRatioDiff = burnRatio - currentStake.burnRatioSnapshot;
            uint256 newBurnPoints = (newOrganicPoints * burnRatioDiff) / GROWTH_DENOMINATOR;

            // Add both types of points to total
            totalPoints += newOrganicPoints + (currentStake.burnAccrued + newBurnPoints);
        }

        return totalPoints;
    }

    /// @notice Calculates total points across all users
    /// @return Total points including organic and burn points
    /// @dev Should only be called off-chain due to gas costs
    /// @dev Simulates point updates for all users up to current timestamp
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
