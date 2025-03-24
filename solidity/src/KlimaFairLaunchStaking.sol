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
    uint256 public preStakingWindow; // Time before startTimestamp when staking is allowed but points are not accruing

    // global totals
    uint256 public totalOrganicPoints;
    uint256 public totalBurned;
    uint256 public totalStaked;
    address[] public stakerAddresses;
    uint256 public burnRatio;

    // finalization
    uint256 public finalTotalPoints;
    uint256 public finalizeIndex;
    uint256 public finalizationComplete;

    // constants
    uint256 constant GROWTH_DENOMINATOR = 100000;
    address constant KLIMA_V0 = 0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2; // current klima address on Base
    
    uint256 public GROWTH_RATE;

    // token state
    address public KLIMA;
    address public KLIMA_X;
    uint256 public KLIMA_SUPPLY;
    uint256 public KLIMAX_SUPPLY;
    address public burnVault;

    // stake limits
    uint256 public minStakeAmount;
    uint256 public maxTotalStakesPerUser;

    // events
    event StakeCreated(address indexed user, uint256 amount, uint256 multiplier, uint256 startTimestamp);
    event StakeBurned(address indexed user, uint256 burnAmount, uint256 timestamp);
    event StakeClaimed(address indexed user, uint256 totalUserStaked, uint256 klimaAllocation, uint256 klimaXAllocation, uint256 timestamp);
    event FinalizationComplete();
    event TokenAddressesSet(address indexed klima, address indexed klimax);
    event StakingEnabled(uint256 startTimestamp, uint256 freezeTimestamp);
    event StakingExtended(uint256 oldFreezeTimestamp, uint256 newFreezeTimestamp);
    event BurnVaultSet(address indexed burnVault);
    event GrowthRateSet(uint256 newValue);
    event KlimaSupplySet(uint256 newValue);
    event KlimaXSupplySet(uint256 newValue);
    event PreStakingWindowSet(uint256 preStakingWindow);
    event StakeLimitsSet(uint256 minStakeAmount, uint256 maxTotalStakesPerUser);

    /// @notice Prevents actions after pre-staking has begun
    /// @dev Used to lock configuration changes once pre-staking begins
    modifier beforePreStaking() {
        require(startTimestamp == 0 || block.timestamp < startTimestamp - preStakingWindow, "Pre-staking has already started");
        _;
    }

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
        
        // Initialize default values
        GROWTH_RATE = 274;
        KLIMA_SUPPLY = 17_500_000 * 1e18;
        KLIMAX_SUPPLY = 40_000_000 * 1e18;
        preStakingWindow = 3 days;

        // Set default limits for DOS mitigation
        minStakeAmount = 1e9;
        maxTotalStakesPerUser = 200;
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
    /// @dev Reverts if amount is less than minStakeAmount or maxTotalStakesPerUser is reached to mitigate DOS
    function stake(uint256 amount) public whenNotPaused {
        // Require valid amount
        require(amount >= minStakeAmount, "Amount must be greater than or equal to minStakeAmount");
        require(userStakes[msg.sender].length < maxTotalStakesPerUser, "Max total stakes per user reached");

        // Require staking is active (either pre-staking or regular staking period)
        require(startTimestamp > 0, "Staking not initialized");
        require(block.timestamp >= startTimestamp - preStakingWindow, "Staking not started");
        require(block.timestamp < freezeTimestamp, "Staking period ended");

        // Transfer KLIMA_V0 tokens to this contract
        require(IERC20(KLIMA_V0).transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Calculate multiplier based on current week (after official start)
        uint256 multiplier = 100;
        
        // If we're in pre-staking or week 1, use 2x multiplier
        if (block.timestamp < startTimestamp || (block.timestamp - startTimestamp) < 1 weeks) {
            multiplier = 200; // 2x for pre-staking and week 1
        } else if ((block.timestamp - startTimestamp) < 2 weeks) {
            multiplier = 150; // 1.5x for week 2
        }

        // Add user to stakerAddresses if first stake
        if (userStakes[msg.sender].length == 0) {
            stakerAddresses.push(msg.sender);
        }

        // Set stake start time to either current time or startTimestamp (whichever is later)
        uint256 stakeStartTime = block.timestamp;
        if (block.timestamp < startTimestamp) {
            stakeStartTime = startTimestamp; // For pre-staking, set to official start time
        }

        // Create new stake
        Stake memory newStake = Stake({
            amount: amount,
            stakeStartTime: stakeStartTime,
            lastUpdateTime: stakeStartTime, // Points start accruing from stakeStartTime
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
        emit StakeCreated(msg.sender, amount, multiplier, stakeStartTime);
    }

    /// @notice Allows users to unstake their KLIMA_V0 tokens
    /// @param amount Amount of tokens to unstake
    /// @dev Before freezeTimestamp: tokens are partially burned based on stake duration
    /// @dev After freezeTimestamp: converts stake to KLIMA and KLIMA_X tokens
    function unstake(uint256 amount) public whenNotPaused {
        // Skip point updates during pre-staking or after freeze
        if (block.timestamp >= startTimestamp && block.timestamp < freezeTimestamp) {
            // Only update points if we're between startTimestamp and freezeTimestamp
            _updateUser(msg.sender);
        }

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

        // Track totals
        uint256 totalUnstake;
        uint256 totalBurnAmount;
        uint256 freedOrganicPointsTotal;

        // Get reference to storage array (no copy made yet)
        Stake[] storage userStakesList = userStakes[msg.sender];
        require(userStakesList.length > 0, "No stakes found");

        // Track which indices were modified
        uint256[] memory modifiedIndices = new uint256[](userStakesList.length);
        uint256 modifiedCount = 0;
        
        // Process stakes from newest to oldest
        for (uint256 i = userStakesList.length; i > 0 && totalUnstake < amount; i--) {
            uint256 index = i - 1;
            // Load stake into memory
            Stake memory currentStake = userStakesList[index];
            
            // Skip stakes with zero amount
            if (currentStake.amount == 0) continue;

            uint256 stakeUnstakeAmount = amount - totalUnstake;
            if (stakeUnstakeAmount > currentStake.amount) {
                stakeUnstakeAmount = currentStake.amount;
            }

            uint256 burnForStake = calculateBurn(stakeUnstakeAmount, currentStake.stakeStartTime);
            uint256 originalAmount = currentStake.amount;
            
            // Update stake values
            currentStake.amount = originalAmount - stakeUnstakeAmount;
            uint256 originalOrganicPoints = currentStake.organicPoints;
            uint256 newOrganicPoints = (originalOrganicPoints * currentStake.amount) / originalAmount;
            freedOrganicPointsTotal += originalOrganicPoints - newOrganicPoints;
            currentStake.organicPoints = newOrganicPoints;
            currentStake.burnAccrued = (currentStake.burnAccrued * currentStake.amount) / originalAmount;

            totalUnstake += stakeUnstakeAmount;
            totalBurnAmount += burnForStake;

            // Only write back to storage if modified
            if (stakeUnstakeAmount > 0) {
                userStakesList[index] = currentStake;
                modifiedIndices[modifiedCount++] = index;
            }
        }

        require(totalUnstake == amount, "Insufficient stake balance");

        // Update global totals
        totalStaked -= amount;
        totalBurned += totalBurnAmount;
        totalOrganicPoints -= freedOrganicPointsTotal;

        // Update burn ratio if applicable
        if (totalOrganicPoints > 0) {
            burnRatio = burnRatio + ((freedOrganicPointsTotal * GROWTH_DENOMINATOR) / totalOrganicPoints);
        }

        // Send tokens to burn vault for the burn portion
        if (totalBurnAmount > 0) {
            require(IERC20(KLIMA_V0).approve(burnVault, totalBurnAmount), "Approve failed");
            IKlimaFairLaunchBurnVault(burnVault).addKlimaAmountToBurn(msg.sender, totalBurnAmount);
        }

        // Transfer remaining tokens back to user
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

        uint256 totalUserStaked;
        uint256 totalUserPoints;
        bool hasUnclaimedStakes;

        // Get direct reference to storage
        Stake[] storage userStakesList = userStakes[msg.sender];
        
        // Process stakes directly
        for (uint256 i = 0; i < userStakesList.length; i++) {
            // Load stake into memory
            Stake memory currentStake = userStakesList[i];
            
            // Skip already claimed stakes for calculations
            if (currentStake.hasBeenClaimed == 1) {
                continue;
            }
            
            // Skip stakes with zero amount
            if (currentStake.amount == 0) {
                continue;
            }
            
            // Add to totals
            totalUserStaked += currentStake.amount;
            totalUserPoints += currentStake.organicPoints + currentStake.burnAccrued;
            hasUnclaimedStakes = true;
            
            // Mark as claimed
            currentStake.hasBeenClaimed = 1;
            
            // Write back to storage
            userStakesList[i] = currentStake;
        }
        
        // Require at least one unclaimed stake
        require(hasUnclaimedStakes, "No unclaimed stakes found");
        
        // Calculate allocations using the view functions
        uint256 klimaAllocation = calculateKlimaAllocation(totalUserStaked);
        uint256 klimaXAllocation = calculateKlimaXAllocation(totalUserPoints);
        
        // Transfer tokens to user
        if (klimaAllocation > 0) {
            require(IERC20(KLIMA).transfer(msg.sender, klimaAllocation), "KLIMA transfer failed");
        }
        
        if (klimaXAllocation > 0) {
            require(IERC20(KLIMA_X).transfer(msg.sender, klimaXAllocation), "KLIMA_X transfer failed");
        }
        
        emit StakeClaimed(msg.sender, totalUserStaked, klimaAllocation, klimaXAllocation, block.timestamp);
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

        // Determine the cutoff time for point accrual
        uint256 cutoffTime = block.timestamp;
        if (block.timestamp > freezeTimestamp) {
            cutoffTime = freezeTimestamp;
        }

        // Process all stakes in memory
        for (uint256 i = 0; i < stakes.length; i++) {
            Stake memory currentStake = stakes[i];
            
            // Skip if amount is zero
            if (currentStake.amount == 0) {
                updatedStakes[i] = currentStake;
                continue;
            }
            
            // Skip if lastUpdateTime is already at or after freeze timestamp
            if (currentStake.lastUpdateTime >= freezeTimestamp) {
                updatedStakes[i] = currentStake;
                continue;
            }

            // Only accrue points up to the cutoff time (always capped at freezeTimestamp)
            uint256 timeElapsed = 0;
            if (cutoffTime > currentStake.lastUpdateTime) {
                timeElapsed = cutoffTime - currentStake.lastUpdateTime;
            }
            
            uint256 newPoints = 
                (currentStake.amount * currentStake.bonusMultiplier * timeElapsed * GROWTH_RATE) / GROWTH_DENOMINATOR;

            newTotalOrganicPoints += newPoints;
            currentStake.organicPoints += newPoints;
            currentStake.lastUpdateTime = cutoffTime; // Always use cutoffTime (max freezeTimestamp)
            
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
        // Skip if burnRatio is zero (no burns have occurred)
        if (burnRatio == 0) {
            return;
        }
        
        // Get reference to storage array (no copy made yet)
        Stake[] storage userStakesList = userStakes[_user];
        
        // Process stakes directly from storage to memory and back
        for (uint256 i = 0; i < userStakesList.length; i++) {
            // Load stake into memory
            Stake memory currentStake = userStakesList[i];
            
            // Skip if amount is zero
            if (currentStake.amount == 0) {
                continue;
            }
            
            // Skip if burnRatio hasn't changed for this stake
            uint256 burnRatioDiff = burnRatio - currentStake.burnRatioSnapshot;
            if (burnRatioDiff == 0) {
                continue;
            }
            
            // Only update if there's a difference in burn ratio
            uint256 newBurnAccrual = (currentStake.organicPoints * burnRatioDiff) / GROWTH_DENOMINATOR;
            currentStake.burnAccrued += newBurnAccrual;
            currentStake.burnRatioSnapshot = burnRatio;
            
            // Only write back to storage if modified
            userStakesList[i] = currentStake;
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
    /// @dev Reverts if start timestamp is in the past
    /// @dev Reverts if burn vault is not set
    /// @dev Reverts if minStakeAmount is not set
    /// @dev Reverts if maxTotalStakesPerUser is not set
    /// @dev Reverts if growth rate is not set
    function enableStaking(uint256 _startTimestamp) external onlyOwner beforeStartTimestamp beforePreStaking {
        require(_startTimestamp > block.timestamp, "Start timestamp cannot be in the past");
        require(burnVault != address(0), "Burn vault not set");
        require(minStakeAmount > 0, "Min stake amount not set");
        require(maxTotalStakesPerUser > 0, "Max total stakes per user not set");
        require(GROWTH_RATE > 0, "Growth rate not set");
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
            
            // Update points for this staker's stakes
            _updateUser(staker);

            // Load stakes into memory
            Stake[] memory stakes = userStakes[staker];
            
            // Track per-user burn amount - reset for each user
            uint256 userBurnTotal = 0;

            // Sum all stakes' points for this user
            for (uint256 j = 0; j < stakes.length; j++) {
                // Skip zero stakes
                if (stakes[j].amount == 0 || stakes[j].organicPoints == 0) continue;

                // Include both organic points and burn accrued points
                newFinalTotalPoints += stakes[j].organicPoints + stakes[j].burnAccrued;
                userBurnTotal += stakes[j].amount;
            }

            // Burn this user's KLIMA_V0 tokens
            if (userBurnTotal > 0) {
                require(IERC20(KLIMA_V0).approve(burnVault, userBurnTotal), "Approve failed");
                IKlimaFairLaunchBurnVault(burnVault).addKlimaAmountToBurn(staker, userBurnTotal);
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
    /// @param _newValue New KLIMA supply value (raw value with 18 decimals)
    /// @dev Can only be called before finalization
    function setKlimaSupply(uint256 _newValue) external onlyOwner beforeFinalization {
        require(_newValue > 0, "KLIMA supply must be greater than 0");
        KLIMA_SUPPLY = _newValue;
        emit KlimaSupplySet(_newValue);
    }

    /// @notice Sets the total KLIMA_X token supply for distribution
    /// @param _newValue New KLIMA_X supply value (raw value with 18 decimals)
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
        
        uint256 oldFreezeTimestamp = freezeTimestamp;
        freezeTimestamp = _newFreezeTimestamp;
        emit StakingExtended(oldFreezeTimestamp, _newFreezeTimestamp);
    }

    /// @notice Sets the pre-staking window
    /// @param _preStakingWindow Time in seconds before start when pre-staking is allowed
    /// @dev Can only be called by the owner before pre-staking begins
    function setPreStakingWindow(uint256 _preStakingWindow) external onlyOwner beforePreStaking {
        require(_preStakingWindow >= 3 days && _preStakingWindow <= 7 days, "Pre-staking window must be between 3 days and 7 days");
        preStakingWindow = _preStakingWindow;
        emit PreStakingWindowSet(_preStakingWindow);
    }

    /// @notice Sets the minimum stake amount and maximum total stakes per user to mitigate DOS
    /// @param _minStakeAmount Minimum stake amount
    /// @param _maxTotalStakesPerUser Maximum total stakes per user address
    /// @dev Can only be called by the owner
    function setStakeLimits(uint256 _minStakeAmount, uint256 _maxTotalStakesPerUser) public onlyOwner {
        minStakeAmount = _minStakeAmount;
        maxTotalStakesPerUser = _maxTotalStakesPerUser;
        emit StakeLimitsSet(minStakeAmount, maxTotalStakesPerUser);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // pure functions

    /// @notice Calculates the amount of tokens to burn when unstaking
    /// @param amount Amount of tokens being unstaked
    /// @param stakeStartTime Timestamp when the stake was created
    /// @return Amount of tokens to burn
    /// @dev Base burn is 25% of amount, additional burn up to 75% based on stake duration, total 100% max burn at 365 days
    /// @dev the time-based burn is meant to make a last man standing scenario where the longer you stake, the more you burn thus creating an incentive to stake for as long as it takes to launch klima 2.0 and not unstake early
    /// @dev If the stake is still in the pre-staking period, only the base burn is applied
    /// @dev If the stake is after the pre-staking period, the time-based burn is applied
    function calculateBurn(uint256 amount, uint256 stakeStartTime) public view returns (uint256) {
        // Base burn is 25% of amount
        uint256 baseBurn = (amount * 25) / 100;

        // If we're still in pre-staking period, only apply base burn
        if (block.timestamp < startTimestamp || stakeStartTime > block.timestamp) {
            return baseBurn;
        }

        // Calculate time-based burn percentage with higher precision
        // Scale by 1e9 (KLIMA V0 decimals) to avoid truncation in the integer division
        uint256 scaledTimeBasedPercent = ((block.timestamp - stakeStartTime) * 75 * 1e9) / (365 days);
        
        // Cap the scaled percentage at 75 * 1e9
        if (scaledTimeBasedPercent > 75 * 1e9) scaledTimeBasedPercent = 75 * 1e9;
        
        // Calculate and return total burn amount (base burn + time-based burn)
        return baseBurn + ((amount * scaledTimeBasedPercent) / (100 * 1e9));
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
        uint256 totalPoints;
        
        // Load stakes into memory once
        Stake[] memory stakes = userStakes[user];

        // If finalization is complete, simply use the stored points
        if (finalizationComplete == 1) {
            for (uint256 i = 0; i < stakes.length; i++) {
                Stake memory currentStake = stakes[i];
                if (currentStake.amount == 0) continue;
                totalPoints += currentStake.organicPoints + currentStake.burnAccrued;
            }
            return totalPoints;
        }

        // Determine the timestamp to calculate points up to
        uint256 calculationTimestamp = block.timestamp;
        if (freezeTimestamp < block.timestamp) {
            calculationTimestamp = freezeTimestamp;
        }

        // First simulate organic points update for all stakes
        Stake[] memory updatedStakes = new Stake[](stakes.length);
        for (uint256 i = 0; i < stakes.length; i++) {
            Stake memory currentStake = stakes[i];
            if (currentStake.amount == 0) continue;
            
            // Skip if lastUpdateTime is already at or after freeze timestamp
            if (currentStake.lastUpdateTime >= freezeTimestamp) {
                updatedStakes[i] = currentStake;
                continue;
            }

            // Calculate time elapsed up to calculation timestamp
            uint256 timeElapsed = 0;
            if (calculationTimestamp > currentStake.lastUpdateTime) {
                timeElapsed = calculationTimestamp - currentStake.lastUpdateTime;
            }
            
            // Update organic points
            uint256 newPoints = (currentStake.amount * currentStake.bonusMultiplier * timeElapsed * GROWTH_RATE) / GROWTH_DENOMINATOR;
            currentStake.organicPoints += newPoints;
            currentStake.lastUpdateTime = calculationTimestamp;
            
            updatedStakes[i] = currentStake;
        }
        
        // Then simulate burn distribution for all stakes
        for (uint256 i = 0; i < updatedStakes.length; i++) {
            Stake memory currentStake = updatedStakes[i];
            if (currentStake.amount == 0) continue;
            
            // Calculate burn points
            uint256 burnRatioDiff = burnRatio - currentStake.burnRatioSnapshot;
            if (burnRatioDiff > 0) {
                uint256 newBurnAccrual = (currentStake.organicPoints * burnRatioDiff) / GROWTH_DENOMINATOR;
                currentStake.burnAccrued += newBurnAccrual;
            }
            
            // Add to total points
            totalPoints += currentStake.organicPoints + currentStake.burnAccrued;
        }
        
        return totalPoints;
    }

    /// @notice Calculates total points across all users
    /// @return Total points including organic and burn points
    /// @dev Should only be called off-chain due to gas costs
    /// @dev Simulates point updates for all users up to current timestamp
    function getTotalPoints() public view returns (uint256) {
        uint256 totalPoints;

        // Iterate through all staker addresses
        for (uint256 i = 0; i < stakerAddresses.length; i++) {
            // Get points for each user using previewUserPoints
            totalPoints += previewUserPoints(stakerAddresses[i]);
        }

        return totalPoints;
    }

    /// @dev Reserved storage space per auditor recommendation.
    uint256[50] private __gap;
}
