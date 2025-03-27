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
        uint256 amount; // e9
        uint256 stakeStartTime;
        uint256 lastUpdateTime;
        uint256 bonusMultiplier; // Percentage (200 = 2x)
        uint256 organicPoints; // e18
        uint256 burnRatioSnapshot; // e18
        uint256 burnAccrued; // e18
        uint256 hasBeenClaimed;
    }

    mapping(address => Stake[]) public userStakes;

    uint256 public startTimestamp;
    uint256 public freezeTimestamp;
    uint256 public preStakingWindow;

    uint256 public totalOrganicPoints; // e18
    uint256 public totalBurned; // e9
    uint256 public totalStaked; // e9
    address[] public stakerAddresses;
    uint256 public burnRatio; // e18

    uint256 public finalTotalPoints; // e18
    uint256 public finalizeIndex;
    uint256 public finalizationComplete;

    uint256 public constant GROWTH_DENOMINATOR = 1e18; // e18 for burn calc
    address public constant KLIMA_V0 = 0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2;

    UD60x18 public  SECONDS_PER_DAY;
    UD60x18 public EXP_GROWTH_RATE;
    UD60x18 public  PERCENTAGE_SCALE;
    UD60x18 public INPUT_SCALE_DENOMINATOR;

    address public KLIMA;
    address public KLIMA_X;
    uint256 public KLIMA_SUPPLY; // e18
    uint256 public KLIMAX_SUPPLY; // e18
    address public burnVault;

    uint256 public minStakeAmount; // e9
    uint256 public maxTotalStakesPerUser;

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

    modifier beforePreStaking() {
        require(startTimestamp == 0 || block.timestamp < startTimestamp - preStakingWindow, "Pre-staking has already started");
        _;
    }

    modifier beforeStartTimestamp() {
        require(startTimestamp == 0 || block.timestamp < startTimestamp, "Staking has already started");
        _;
    }

    modifier beforeFinalization() {
        require(finalizationComplete == 0, "Finalization already complete");
        _;
    }

    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) external initializer {
        __Ownable_init(initialOwner);
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        
        KLIMA_SUPPLY = 17_500_000 * 1e18;
        KLIMAX_SUPPLY = 40_000_000 * 1e18;
        preStakingWindow = 3 days;
        minStakeAmount = 1e9;
        maxTotalStakesPerUser = 200;

        SECONDS_PER_DAY = ud(86400);
        EXP_GROWTH_RATE = ud(2740000000000000); // 0.00274 * 1e18
        PERCENTAGE_SCALE = ud(100);
        INPUT_SCALE_DENOMINATOR = ud(1e27); // 10^27
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        require(newImplementation != address(0), "New implementation cannot be zero address");
    }

    function stake(uint256 amount) public whenNotPaused {
        require(amount >= minStakeAmount, "Amount must be >= minStakeAmount");
        require(userStakes[msg.sender].length < maxTotalStakesPerUser, "Max stakes reached");
        require(startTimestamp > 0, "Staking not initialized");
        require(block.timestamp >= startTimestamp - preStakingWindow, "Staking not started");
        require(block.timestamp < freezeTimestamp, "Staking period ended");

        require(IERC20(KLIMA_V0).transferFrom(msg.sender, address(this), amount), "Transfer failed");

        uint256 multiplier = 100;
        if (block.timestamp < startTimestamp || (block.timestamp - startTimestamp) < 1 weeks) {
            multiplier = 200;
        } else if ((block.timestamp - startTimestamp) < 2 weeks) {
            multiplier = 150;
        }

        if (userStakes[msg.sender].length == 0) {
            stakerAddresses.push(msg.sender);
        }

        uint256 stakeStartTime = block.timestamp < startTimestamp ? startTimestamp : block.timestamp;

        Stake memory newStake = Stake({
            amount: amount,
            stakeStartTime: stakeStartTime,
            lastUpdateTime: stakeStartTime,
            bonusMultiplier: multiplier,
            organicPoints: 0,
            burnRatioSnapshot: burnRatio,
            burnAccrued: 0,
            hasBeenClaimed: 0
        });

        userStakes[msg.sender].push(newStake);
        totalStaked += amount;

        emit StakeCreated(msg.sender, amount, multiplier, stakeStartTime);
    }

    function unstake(uint256 amount) public whenNotPaused {
        if (block.timestamp >= startTimestamp && block.timestamp < freezeTimestamp) {
            _updateUser(msg.sender);
        }
        if (block.timestamp < freezeTimestamp) {
            _unstakeAndBurn(amount);
        } else {
            _claim();
        }
    }

    function _unstakeAndBurn(uint256 amount) internal nonReentrant {
        require(amount > 0, "Amount must be > 0");
        Stake[] storage userStakesList = userStakes[msg.sender];
        require(userStakesList.length > 0, "No stakes found");

        uint256 totalUnstake;
        uint256 totalBurnAmount;
        uint256 freedOrganicPointsTotal;

        for (uint256 i = userStakesList.length; i > 0 && totalUnstake < amount; i--) {
            uint256 index = i - 1;
            Stake memory currentStake = userStakesList[index];
            if (currentStake.amount == 0) continue;

            uint256 stakeUnstakeAmount = amount - totalUnstake;
            if (stakeUnstakeAmount > currentStake.amount) {
                stakeUnstakeAmount = currentStake.amount;
            }

            uint256 burnForStake = calculateBurn(stakeUnstakeAmount, currentStake.stakeStartTime);
            uint256 originalAmount = currentStake.amount;
            
            currentStake.amount = originalAmount - stakeUnstakeAmount;
            uint256 originalOrganicPoints = currentStake.organicPoints;
            uint256 newOrganicPoints = (originalOrganicPoints * currentStake.amount) / originalAmount;
            freedOrganicPointsTotal += originalOrganicPoints - newOrganicPoints;
            currentStake.organicPoints = newOrganicPoints;
            currentStake.burnAccrued = (currentStake.burnAccrued * currentStake.amount) / originalAmount;

            totalUnstake += stakeUnstakeAmount;
            totalBurnAmount += burnForStake;

            if (stakeUnstakeAmount > 0) {
                userStakesList[index] = currentStake;
            }
        }

        require(totalUnstake == amount, "Insufficient stake balance");

        totalStaked -= amount;
        totalBurned += totalBurnAmount;
        totalOrganicPoints -= freedOrganicPointsTotal;

        if (totalOrganicPoints > 0) {
            burnRatio = burnRatio + ((freedOrganicPointsTotal * GROWTH_DENOMINATOR) / totalOrganicPoints);
        }

        if (totalBurnAmount > 0) {
            require(IERC20(KLIMA_V0).approve(burnVault, totalBurnAmount), "Approve failed");
            IKlimaFairLaunchBurnVault(burnVault).addKlimaAmountToBurn(msg.sender, totalBurnAmount);
        }

        uint256 remainingAmount = amount - totalBurnAmount;
        if (remainingAmount > 0) {
            require(IERC20(KLIMA_V0).transfer(msg.sender, remainingAmount), "Transfer failed");
        }

        emit StakeBurned(msg.sender, totalBurnAmount, block.timestamp);
    }

    function _claim() internal nonReentrant {
        require(block.timestamp >= freezeTimestamp, "Staking period not ended");
        require(finalizationComplete == 1, "Finalization not complete");

        uint256 totalUserStaked;
        uint256 totalUserPoints;
        bool hasUnclaimedStakes;

        Stake[] storage userStakesList = userStakes[msg.sender];
        
        for (uint256 i = 0; i < userStakesList.length; i++) {
            Stake memory currentStake = userStakesList[i];
            if (currentStake.hasBeenClaimed == 1 || currentStake.amount == 0) continue;
            
            totalUserStaked += currentStake.amount;
            totalUserPoints += currentStake.organicPoints + currentStake.burnAccrued;
            hasUnclaimedStakes = true;
            
            currentStake.hasBeenClaimed = 1;
            userStakesList[i] = currentStake;
        }
        
        require(hasUnclaimedStakes, "No unclaimed stakes found");
        
        uint256 klimaAllocation = calculateKlimaAllocation(totalUserStaked);
        uint256 klimaXAllocation = calculateKlimaXAllocation(totalUserPoints);
        
        if (klimaAllocation > 0) {
            require(IERC20(KLIMA).transfer(msg.sender, klimaAllocation), "KLIMA transfer failed");
        }
        if (klimaXAllocation > 0) {
            require(IERC20(KLIMA_X).transfer(msg.sender, klimaXAllocation), "KLIMA_X transfer failed");
        }
        
        emit StakeClaimed(msg.sender, totalUserStaked, klimaAllocation, klimaXAllocation, block.timestamp);
    }

    function _updateUser(address _user) internal {
        _updateOrganicPoints(_user);
        _updateBurnDistribution(_user);
    }

    function _updateOrganicPoints(address _user) internal {
        Stake[] memory stakes = userStakes[_user];
        Stake[] memory updatedStakes = new Stake[](stakes.length);
        uint256 newTotalOrganicPoints = totalOrganicPoints;

        uint256 cutoffTime = block.timestamp > freezeTimestamp ? freezeTimestamp : block.timestamp;

        for (uint256 i = 0; i < stakes.length; i++) {
            Stake memory currentStake = stakes[i];
            if (currentStake.amount == 0 || currentStake.lastUpdateTime >= freezeTimestamp) {
                updatedStakes[i] = currentStake;
                continue;
            }

            uint256 timeElapsed = cutoffTime > currentStake.lastUpdateTime ? cutoffTime - currentStake.lastUpdateTime : 0;
            
            if (timeElapsed > 0) {
                UD60x18 timeElapsed_ud = ud(timeElapsed);
                UD60x18 timeElapsed_days = div(timeElapsed_ud, SECONDS_PER_DAY);
                
                UD60x18 exponent = mul(EXP_GROWTH_RATE, timeElapsed_days);
                UD60x18 e_exponent = exp(exponent);
                UD60x18 e_exponent_minus_one = sub(e_exponent, ud(1e18));
                
                UD60x18 bonusMultiplier_ud = div(ud(currentStake.bonusMultiplier * 1e18), PERCENTAGE_SCALE);
                UD60x18 amount_ud = ud(currentStake.amount);
                
                UD60x18 basePoints_ud = div(mul(amount_ud, bonusMultiplier_ud), INPUT_SCALE_DENOMINATOR);
                UD60x18 newPoints_ud = mul(basePoints_ud, e_exponent_minus_one);
                uint256 newPoints = newPoints_ud.intoUint256();
                
                newTotalOrganicPoints += newPoints;
                currentStake.organicPoints += newPoints;
                currentStake.lastUpdateTime = cutoffTime;
            }
            
            updatedStakes[i] = currentStake;
        }

        Stake[] storage userStakesList = userStakes[_user];
        for (uint256 i = 0; i < stakes.length; i++) {
            userStakesList[i] = updatedStakes[i];
        }
        totalOrganicPoints = newTotalOrganicPoints;
    }

    function _updateBurnDistribution(address _user) internal {
        if (burnRatio == 0) return;
        
        Stake[] storage userStakesList = userStakes[_user];
        
        for (uint256 i = 0; i < userStakesList.length; i++) {
            Stake memory currentStake = userStakesList[i];
            if (currentStake.amount == 0) continue;
            
            uint256 burnRatioDiff = burnRatio - currentStake.burnRatioSnapshot;
            if (burnRatioDiff > 0) {
                uint256 newBurnAccrual = (currentStake.organicPoints * burnRatioDiff) / GROWTH_DENOMINATOR;
                currentStake.burnAccrued += newBurnAccrual;
                currentStake.burnRatioSnapshot = burnRatio;
                userStakesList[i] = currentStake;
            }
        }
    }

    function setTokenAddresses(address _klima, address _klimax) external onlyOwner {
        require(_klima != address(0) && _klimax != address(0), "Invalid token addresses");
        KLIMA = _klima;
        KLIMA_X = _klimax;
        emit TokenAddressesSet(_klima, _klimax);
    }

    function enableStaking(uint256 _startTimestamp) external onlyOwner beforeStartTimestamp beforePreStaking {
        require(_startTimestamp > block.timestamp, "Start timestamp cannot be in the past");
        require(burnVault != address(0), "Burn vault not set");
        require(minStakeAmount > 0, "Min stake amount not set");
        require(maxTotalStakesPerUser > 0, "Max total stakes per user not set");
        startTimestamp = _startTimestamp;
        freezeTimestamp = _startTimestamp + 90 days;
        emit StakingEnabled(_startTimestamp, freezeTimestamp);
    }

    function storeTotalPoints(uint256 batchSize) public onlyOwner beforeFinalization {
        require(block.timestamp >= freezeTimestamp, "Staking period not locked");

        uint256 endIndex = finalizeIndex + batchSize;
        if (endIndex > stakerAddresses.length) endIndex = stakerAddresses.length;

        uint256 newFinalTotalPoints = finalTotalPoints;

        for (uint256 i = finalizeIndex; i < endIndex; i++) {
            address staker = stakerAddresses[i];
            _updateUser(staker);
            Stake[] memory stakes = userStakes[staker];
            uint256 userBurnTotal = 0;

            for (uint256 j = 0; j < stakes.length; j++) {
                if (stakes[j].amount == 0 || stakes[j].organicPoints == 0) continue;
                newFinalTotalPoints += stakes[j].organicPoints + stakes[j].burnAccrued;
                userBurnTotal += stakes[j].amount;
            }

            if (userBurnTotal > 0) {
                require(IERC20(KLIMA_V0).approve(burnVault, userBurnTotal), "Approve failed");
                IKlimaFairLaunchBurnVault(burnVault).addKlimaAmountToBurn(staker, userBurnTotal);
            }
        }

        finalTotalPoints = newFinalTotalPoints;
        finalizeIndex = endIndex;

        if (finalizeIndex == stakerAddresses.length) {
            require(IERC20(KLIMA).balanceOf(address(this)) >= KLIMA_SUPPLY, "Insufficient KLIMA balance");
            require(IERC20(KLIMA_X).balanceOf(address(this)) >= KLIMAX_SUPPLY, "Insufficient KLIMA_X balance");
            finalizationComplete = 1;
            emit FinalizationComplete();
        }
    }

    function setGrowthRate(uint256 _newValue) external onlyOwner beforeStartTimestamp {
        require(_newValue > 0, "Growth rate must be > 0");
        EXP_GROWTH_RATE = ud(_newValue * 1e13); // e.g., 274 -> 0.00274 * 1e18
        emit GrowthRateSet(_newValue);
    }

    function setKlimaSupply(uint256 _newValue) external onlyOwner beforeFinalization {
        require(_newValue > 0, "KLIMA supply must be > 0");
        KLIMA_SUPPLY = _newValue;
        emit KlimaSupplySet(_newValue);
    }

    function setKlimaXSupply(uint256 _newValue) external onlyOwner beforeFinalization {
        require(_newValue > 0, "KLIMA_X supply must be > 0");
        KLIMAX_SUPPLY = _newValue;
        emit KlimaXSupplySet(_newValue);
    }

    function setBurnVault(address _burnVault) external onlyOwner beforeStartTimestamp {
        require(_burnVault != address(0), "Invalid burn vault address");
        burnVault = _burnVault;
        emit BurnVaultSet(_burnVault);
    }

    function setFreezeTimestamp(uint256 _newFreezeTimestamp) external onlyOwner beforeFinalization {
        require(startTimestamp > 0, "Staking not initialized");
        require(block.timestamp < freezeTimestamp, "Staking period already ended");
        require(_newFreezeTimestamp > freezeTimestamp, "Can only extend freeze period");
        uint256 oldFreezeTimestamp = freezeTimestamp;
        freezeTimestamp = _newFreezeTimestamp;
        emit StakingExtended(oldFreezeTimestamp, _newFreezeTimestamp);
    }

    function setPreStakingWindow(uint256 _preStakingWindow) external onlyOwner beforePreStaking {
        require(_preStakingWindow >= 3 days && _preStakingWindow <= 7 days, "Pre-staking window must be 3-7 days");
        preStakingWindow = _preStakingWindow;
        emit PreStakingWindowSet(_preStakingWindow);
    }

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

    function calculateBurn(uint256 amount, uint256 stakeStartTime) public view returns (uint256) {
        uint256 baseBurn = (amount * 25) / 100;
        if (block.timestamp < startTimestamp || stakeStartTime > block.timestamp) return baseBurn;

        uint256 scaledTimeBasedPercent = ((block.timestamp - stakeStartTime) * 75 * 1e9) / (365 days);
        if (scaledTimeBasedPercent > 75 * 1e9) scaledTimeBasedPercent = 75 * 1e9;
        return baseBurn + ((amount * scaledTimeBasedPercent) / (100 * 1e9));
    }

    function calculateKlimaAllocation(uint256 amount) public view returns (uint256) {
        require(totalStaked > 0, "No KLIMA staked");
        return (amount * KLIMA_SUPPLY) / totalStaked;
    }

    function calculateKlimaXAllocation(uint256 points) public view returns (uint256) {
        require(finalizationComplete == 1, "Finalization not complete");
        require(finalTotalPoints > 0, "No points recorded");
        return (points * KLIMAX_SUPPLY) / finalTotalPoints;
    }

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

            uint256 timeElapsed = calculationTimestamp > currentStake.lastUpdateTime ? calculationTimestamp - currentStake.lastUpdateTime : 0;
            
            if (timeElapsed > 0) {
                UD60x18 timeElapsed_ud = ud(timeElapsed);
                UD60x18 timeElapsed_days = div(timeElapsed_ud, SECONDS_PER_DAY);
                
                UD60x18 exponent = mul(EXP_GROWTH_RATE, timeElapsed_days);
                UD60x18 e_exponent = exp(exponent);
                UD60x18 e_exponent_minus_one = sub(e_exponent, ud(1e18));
                
                UD60x18 bonusMultiplier_ud = div(ud(currentStake.bonusMultiplier * 1e18), PERCENTAGE_SCALE);
                UD60x18 amount_ud = ud(currentStake.amount);
                
                UD60x18 basePoints_ud = div(mul(amount_ud, bonusMultiplier_ud), INPUT_SCALE_DENOMINATOR);
                UD60x18 newPoints_ud = mul(basePoints_ud, e_exponent_minus_one);
                uint256 newPoints = newPoints_ud.intoUint256();
                
                currentStake.organicPoints += newPoints;
                currentStake.lastUpdateTime = calculationTimestamp;
            }
            
            updatedStakes[i] = currentStake;
        }

        for (uint256 i = 0; i < updatedStakes.length; i++) {
            Stake memory currentStake = updatedStakes[i];
            if (currentStake.amount == 0) continue;
            
            uint256 burnRatioDiff = burnRatio - currentStake.burnRatioSnapshot;
            if (burnRatioDiff > 0) {
                uint256 newBurnAccrual = (currentStake.organicPoints * burnRatioDiff) / GROWTH_DENOMINATOR;
                currentStake.burnAccrued += newBurnAccrual;
            }
            
            totalPoints += currentStake.organicPoints + currentStake.burnAccrued;
        }
        
        return totalPoints;
    }

    function getTotalPoints() public view returns (uint256) {
        uint256 totalPoints;
        for (uint256 i = 0; i < stakerAddresses.length; i++) {
            totalPoints += previewUserPoints(stakerAddresses[i]);
        }
        return totalPoints;
    }

    uint256[50] private __gap;
}