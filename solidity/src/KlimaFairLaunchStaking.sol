// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { UD60x18, ud, mul, div, exp, sub } from "@prb/math/UD60x18.sol";

interface IKlimaFairLaunchBurnVault {
    function addKlimaAmountToBurn(address _user, uint256 _amount) external;
}

contract KlimaFairLaunchStaking is Initializable, UUPSUpgradeable, OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {
    struct Stake {
        uint256 amount; // raw amount of KLIMA V0 staked
        uint256 stakeStartTime; // timestamp when the stake was created
        uint256 lastUpdateTime; // timestamp when the stake was last updated
        uint256 bonusMultiplier; // Percentage (200 = 2x)
        uint256 organicPoints; // e18
        uint256 burnRatioSnapshot; // e18
        uint256 burnAccrued; // e18
        uint256 hasBeenClaimed;  // 0 = not claimed, 1 = claimed
    }

    mapping(address => Stake[]) public userStakes;

    uint256 public startTimestamp; // timestamp when staking begins and organic points are accruing
    uint256 public freezeTimestamp; // timestamp when staking is frozen and organic points are not accruing
    uint256 public preStakingWindow; // Time before startTimestamp when staking is allowed but organic points are not accruing


    uint256 public totalOrganicPoints; // e18 // total amount of organic points in the contract
    uint256 public totalBurned; // e9 // total amount of KLIMA V0 sent to the burn vault
    uint256 public totalStaked; // e9 // total amount of KLIMA V0 staked in this contract
    address[] public stakerAddresses; // array of staker addresses
    uint256 public burnRatio; // e18 used to calculate the burn distribution

    uint256 public finalTotalPoints; // e18
    uint256 public finalizeIndex; // index of the last staker addressthat has been processed
    uint256 public finalizationComplete; // 0 = not finalized, 1 = finalized

    uint256 public constant BURN_DISTRIBUTION_PRECISION = 1e18; // e18 for burn calc
    address public constant KLIMA_V0 = 0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2;

    UD60x18 public SECONDS_PER_DAY; // constant set in initialize
    UD60x18 public PERCENTAGE_SCALE; // constant set in initialize
    UD60x18 public POINTS_SCALE_DENOMINATOR; // constant set in initialize
    UD60x18 public EXP_GROWTH_RATE; // adjustable with setGrowthRate

    address public KLIMA; // address of the KLIMA token 
    address public KLIMA_X; // address of the KLIMA_X token
    uint256 public KLIMA_SUPPLY; // e18 // total supply of KLIMA to be claimed
    uint256 public KLIMAX_SUPPLY; // e18 // total supply of KLIMA_X to be claimed
    address public burnVault; // address of the burn vault contract

    uint256 public minStakeAmount; // e9 // minimum amount of KLIMA V0 that can be staked
    uint256 public maxTotalStakesPerUser; // maximum number of stakes per user

    uint256 public claimDeadline; // timestamp after which KLIMA and KLIMA_X allocation claims can expire

    event StakeCreated(address indexed user, uint256 indexed amountKlimaV0Staked, uint256 multiplier, uint256 indexed startTimestamp);
    event StakeBurned(address indexed user, uint256 indexed amountKlimaV0Burned, uint256 indexed timestamp);
    event StakeClaimed(address indexed user, uint256 totalUserStaked, uint256 indexed klimaAllocation, uint256 indexed klimaXAllocation, uint256 timestamp);
    event FinalizationComplete(uint256 indexed finalizationTimestamp);
    event TokenAddressesSet(address indexed klima, address indexed klimax);
    event StakingEnabled(uint256 indexed startTimestamp, uint256 indexed freezeTimestamp);
    event StakingExtended(uint256 indexed oldFreezeTimestamp, uint256 indexed newFreezeTimestamp);
    event BurnVaultSet(address indexed burnVault);
    event GrowthRateSet(uint256 indexed newValue);
    event KlimaSupplySet(uint256 indexed newValue);
    event KlimaXSupplySet(uint256 indexed newValue);
    event PreStakingWindowSet(uint256 indexed preStakingWindow);
    event StakeLimitsSet(uint256 indexed minStakeAmount, uint256 indexed maxTotalStakesPerUser);


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

    function initialize(address initialOwner) external initializer {
        __Ownable_init(initialOwner);
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        // Initialize default values
        KLIMA_SUPPLY = 17_500_000 * 1e18;
        KLIMAX_SUPPLY = 40_000_000 * 1e18;
        preStakingWindow = 5 days;
        minStakeAmount = 1e9;
        maxTotalStakesPerUser = 100;

        SECONDS_PER_DAY = ud(86400);
        EXP_GROWTH_RATE = ud(2740000000000000); // 0.00274 * 1e18
        PERCENTAGE_SCALE = ud(100);
        POINTS_SCALE_DENOMINATOR = ud(1e27); // 10^27
    }

    /// @notice Authorizes an upgrade to a new implementation
    /// @param newImplementation Address of the new implementation contract
    /// @dev Can only be called by the owner
    /// @dev Validates that the new implementation address is not zero
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        require(newImplementation != address(0), "New implementation cannot be zero address");
    }

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
            organicPoints: amount * 1e9 * multiplier / 100, // scaled to 18 decimals
            burnRatioSnapshot: burnRatio,
            burnAccrued: 0,
            hasBeenClaimed: 0
        });

        totalOrganicPoints += amount * 1e9 * multiplier / 100; // scaled to 18 decimals

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



    /// @notice Processes unstaking before the freeze period, applying burn penalties
    /// @param amount Amount of tokens to unstake and partially burn
    /// @dev Burns tokens based on stake duration and updates points/ratios accordingly
    function _unstakeAndBurn(uint256 amount) internal nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        // Get reference to storage array (no copy made yet)
        Stake[] storage userStakesList = userStakes[msg.sender];
        require(userStakesList.length > 0, "No stakes found");

        // Track totals
        uint256 totalUnstake;
        uint256 totalBurnAmount;
        uint256 freedOrganicPointsTotal;

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
            }
        }

        require(totalUnstake == amount, "Insufficient stake balance");

        // Update global totals
        totalStaked -= amount;
        totalBurned += totalBurnAmount;
        totalOrganicPoints -= freedOrganicPointsTotal;

        // Update burn ratio if applicable
        if (totalOrganicPoints > 0) {
            burnRatio = burnRatio + ((freedOrganicPointsTotal * BURN_DISTRIBUTION_PRECISION) / totalOrganicPoints);
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
            
            if (timeElapsed > 0) {
                // Optimization: Combined multiple UD60x18 operations to reduce conversions and operations
                // Convert time elapsed to days (division by SECONDS_PER_DAY)
                UD60x18 timeElapsed_days = div(ud(timeElapsed), SECONDS_PER_DAY);
                
                // Calculate e^(growthRate * timeElapsedDays) - 1
                UD60x18 growthFactor = sub(exp(mul(EXP_GROWTH_RATE, timeElapsed_days)), ud(1e18));
                
                // Optimize: Combine bonus multiplier and amount calculations
                // bonusMultiplier / 100 * amount / 1e27 = (bonusMultiplier * amount) / (100 * 1e27)
                UD60x18 basePoints = div(
                    mul(ud(currentStake.amount), ud(currentStake.bonusMultiplier * 1e18)), 
                    mul(PERCENTAGE_SCALE, POINTS_SCALE_DENOMINATOR)
                );
                
                // Calculate new points (basePoints * growthFactor)
                uint256 newPoints = mul(basePoints, growthFactor).intoUint256();
                
                // Update total organic points
                newTotalOrganicPoints += newPoints;
                // Update stake organic points
                currentStake.organicPoints += newPoints;
                // Update last update time
                currentStake.lastUpdateTime = cutoffTime;
            }
            // Update stake in memory
            updatedStakes[i] = currentStake;
        }
        // Update stakes in storage
        Stake[] storage userStakesList = userStakes[_user];
        for (uint256 i = 0; i < stakes.length; i++) {
            userStakesList[i] = updatedStakes[i];
        }
        // Update total organic points
        totalOrganicPoints = newTotalOrganicPoints;
    }

    function _updateBurnDistribution(address _user) internal {
        // Skip if burnRatio is zero (no burns have occurred)
        if (burnRatio == 0) return;
        // Load stakes into memory
        Stake[] storage userStakesList = userStakes[_user];
        // Process each stake
        for (uint256 i = 0; i < userStakesList.length; i++) {
            Stake memory currentStake = userStakesList[i];
            // Skip if stake amount is zero
            if (currentStake.amount == 0) continue;
            // Calculate burn ratio difference
            uint256 burnRatioDiff = burnRatio - currentStake.burnRatioSnapshot;
            // Only update if there's a difference
            if (burnRatioDiff > 0) {
                // Calculate new burn accrual
                uint256 newBurnAccrual = (currentStake.organicPoints * burnRatioDiff) / BURN_DISTRIBUTION_PRECISION;
                // Update burn accrued amount
                currentStake.burnAccrued += newBurnAccrual;
                // Update snapshot for next comparison
                currentStake.burnRatioSnapshot = burnRatio;
                // Write back to storage
                userStakesList[i] = currentStake;
            }
        }
    }

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
            finalizationComplete = 1;
            emit FinalizationComplete(block.timestamp);
        }
    }

    /// @notice deprecated function
    function transferExpiredClaims() external onlyOwner {
        revert("Function deprecated and no longer available");
    }

    /// @notice Sets the growth rate for point accrual
    /// @param _newValue New growth rate value e.g., 274 -> 0.00274 * 1e18
    /// @dev Can only be called before staking starts
    /// @dev Ensures growth rate is safe for up to 395 days of staking
    /// @dev PRBMath exp function has a maximum input of ~130.7, so we need to ensure
    /// @dev growthRate * 395 days < 130.7
    /// @dev The spec recommends a value of 0.00274 (274 as input)
    function setGrowthRate(uint256 _newValue) external onlyOwner beforeStartTimestamp {
        // Lower bound check - ensure growth rate is positive and meaningful
        // 10 would equal 0.0001 which is very small but still valid
        require(_newValue >= 10, "Growth rate too low, min 0.0001");
        
        // Convert to the actual value that will be used (e.g., 274 -> 0.00274 * 1e18)
        uint256 actualRate = _newValue * 1e13;
        
        // The PRBMath exp function has a maximum safe input value of approximately 130.7 * 1e18
        // For safety, we'll use a more conservative limit of 130 * 1e18
        // Calculate the maximum rate that would be safe for 395 days:
        // maxRate * 395 days < 130 * 1e18
        // maxRate < (130 * 1e18) / 395
        // ~0.329 * 1e18 = 329000000000000000 (safe value)
        uint256 MAX_SAFE_RATE = 329000000000000000; // Hard-coded safe value for 395 days
        
        // Ensure the rate is safe
        require(actualRate < MAX_SAFE_RATE, "Growth rate too high for long-term staking");
        
        // For reference, spec recommends 0.00274, which gives e^(0.00274 × 90) ≈ 1.284 after 90 days
        // This is a 28.4% increase, reasonable for the intended staking period
        
        // Set the growth rate
        EXP_GROWTH_RATE = ud(actualRate);
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
        require(_preStakingWindow >= 2 days, "Pre-staking window must be at least 2 days");
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
    /// @dev Simulates point updates up to current timestamp using exponential growth
    function previewUserPoints(address user) public view returns (uint256) {
        uint256 totalPoints;
        Stake[] memory stakes = userStakes[user];

        if (finalizationComplete == 1) {
            for (uint256 i = 0; i < stakes.length; i++) {
                Stake memory currentStake = stakes[i];
                if (currentStake.amount == 0) continue;
                totalPoints += currentStake.organicPoints + currentStake.burnAccrued;
            }
            return totalPoints;
        }

        uint256 calculationTimestamp = block.timestamp < freezeTimestamp ? block.timestamp : freezeTimestamp;

        Stake[] memory updatedStakes = new Stake[](stakes.length);
        for (uint256 i = 0; i < stakes.length; i++) {
            Stake memory currentStake = stakes[i];
            if (currentStake.amount == 0 || currentStake.lastUpdateTime >= freezeTimestamp) {
                updatedStakes[i] = currentStake;
                continue;
            }

            // Start with existing stored organic points
            uint256 existingOrganicPoints = currentStake.organicPoints;
            
            uint256 timeElapsed = calculationTimestamp > currentStake.lastUpdateTime ? 
                calculationTimestamp - currentStake.lastUpdateTime : 0;
            
            if (timeElapsed > 0) {
                // Convert time elapsed to days (division by SECONDS_PER_DAY)
                UD60x18 timeElapsed_days = div(ud(timeElapsed), SECONDS_PER_DAY);
                
                // Calculate e^(growthRate * timeElapsedDays) - 1
                UD60x18 growthFactor = sub(exp(mul(EXP_GROWTH_RATE, timeElapsed_days)), ud(1e18));
                
                // Calculate additional points based on current stake amount
                UD60x18 basePoints = div(
                    mul(ud(currentStake.amount), ud(currentStake.bonusMultiplier * 1e18)), 
                    mul(PERCENTAGE_SCALE, POINTS_SCALE_DENOMINATOR)
                );
                
                // Add only the new points accrued since lastUpdateTime
                uint256 newPoints = mul(basePoints, growthFactor).intoUint256();
                
                currentStake.organicPoints = existingOrganicPoints + newPoints;
                currentStake.lastUpdateTime = calculationTimestamp;
            }
            
            updatedStakes[i] = currentStake;
        }

        for (uint256 i = 0; i < updatedStakes.length; i++) {
            Stake memory currentStake = updatedStakes[i];
            if (currentStake.amount == 0) continue;
            
            uint256 burnRatioDiff = burnRatio - currentStake.burnRatioSnapshot;
            if (burnRatioDiff > 0) {
                uint256 newBurnAccrual = (currentStake.organicPoints * burnRatioDiff) / BURN_DISTRIBUTION_PRECISION;
                currentStake.burnAccrued += newBurnAccrual;
            }
            
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

    /// @notice Returns the number of stakes for a given user address
    /// @param user Address of the user
    /// @return Number of stakes
    function getUserStakeCount(address user) public view returns (uint256) {
        return userStakes[user].length;
    }

    /// @notice Returns the total number of stakerAddresses
    /// @return Total number of stakerAddresses
    function getTotalStakerAddresses() public view returns (uint256) {
        return stakerAddresses.length;
    }

    /// @dev Reserved storage space per auditor recommendation.
    uint256[50] private __gap;
}