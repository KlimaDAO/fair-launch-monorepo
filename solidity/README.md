# KLIMA Fair Launch Smart Contracts

This repository contains the smart contracts for the Klima 2.0 Fair Launch, a mechanism designed to transition from KLIMA V0 (legacy Klima token launched on Polygon in 2021 and bridged to Base using Axelar Interchain Token Service (ITS)) to KLIMA and KLIMAX tokens (on Base) through a staking and burn process.

## KlimaDAO Token System Transition Context

The Fair Launch represents KlimaDAO's transition from the legacy KLIMA V0 token to a new two-token system:

- **KLIMA**: A dynamic carbon index token (17.5M supply) that maintains the protocol's carbon backing
- **KLIMAX**: An economic governance token (40M supply) for the Klima X ecosystem

### Key Dynamics

The staking contract implements a "last man standing" mechanism that:

1. **Rewards Early Participation**: Provides multipliers (2.0x for week 1, 1.5x for week 2) to early stakers
2. **Incentivizes Commitment**: Uses an exponential time multiplier (e^kt) that increases points over time
3. **Creates Exit Friction**: Implements a progressive burn rate (25% base + up to 75% time-based) that increases the longer tokens are staked
4. **Redistributes Value**: When users unstake early, a portion of their potential allocation is redistributed to remaining stakers through the burn mechanism

This design ensures that participants who maintain their position until the freeze date capture maximum value, while those who exit early contribute to the value of committed participants. The staking period allows sufficient time for community participation while maintaining momentum for the transition to the new token system.

## Klima 2.0 Fair Launch Overview

The Klima 2.0 Fair Launch consists of three main components:

1. **KlimaFairLaunchStaking**: Allows users to stake KLIMA V0 tokens and earn points toward the new KLIMA and KLIMAX token allocations. Users can unstake during the staking period, which triggers a burn calculation.
2. **KlimaFairLaunchBurnVault**: Collects KLIMA V0 tokens that will be burned as part of the transition. Handles the cross-chain burn process via Axelar's Interchain Token Service.
3. **KlimaFairLaunchPolygonBurnHelper**: Deployed on Polygon to receive KLIMA V0 tokens via Axelar's Interchain Token Service and burn them on Polygon using the burn function the polygon KLIMA contract.

All contracts use the UUPS (Universal Upgradeable Proxy Standard) pattern for upgradeability.

## Key Features

- **Time-based Staking Multipliers**: Earlier stakers receive higher point multipliers
- **Cross-chain Token Burning**: Tokens are collected on Base and burned on Polygon
- **Proportional Token Distribution**: New tokens are distributed based on KLIMA VO staked and points earned

## Contract Interactions

1. Users stake KLIMA V0 tokens in the KlimaFairLaunchStaking contract
2. If users unstake before the freeze period, a portion of their tokens are sent to the KlimaFairLaunchBurnVault
3. After staking is finalized, the owner initiates the final burn
4. The burn vault uses Axelar's Interchain Token Service to bridge tokens to Polygon
5. The KlimaFairLaunchPolygonBurnHelper on Polygon receives and burns the tokens


## Deployment

The contracts are designed to be deployed in the following order:
1. Deploy KlimaFairLaunchStaking implementation and proxy
2. Deploy KlimaFairLaunchBurnVault implementation and proxy
3. Deploy KlimaFairLaunchPolygonBurnHelper implementation and proxy
4. Configure contracts with token addresses and parameters
5. Connect contracts by setting the appropriate addresses

## Fair Launch Timeline

The fair launch process follows a specific timeline with distinct phases:

### 1. Deployment and Configuration Phase
- Deploy all contract implementations and proxies
- Set the burn vault address in the staking contract via `setBurnVault()`
- Set the staking contract address in the burn vault via `setKlimaFairLaunchStaking()`
- Set token addresses for KLIMA and KLIMA-X via `setTokenAddresses()`
- Configure KLIMA supply via `setKlimaSupply()` (default is 17,500,000 KLIMA)
- Configure KLIMA-X supply via `setKlimaXSupply()` (default is 40,000,000 KLIMA-X)
- Configure the pre-staking window via `setPreStakingWindow()` (between 3-7 days)
- Configure the growth rate for points calculation via `setGrowthRate()` (default is 274, representing 0.00274 daily growth)

### 2. Pre-Staking Period
- Begins when the owner calls `enableStaking(startTime)` with a future timestamp
- Users can stake KLIMA V0 tokens before the official start time
- No points accrue during this period
- All stakes made during pre-staking have their `stakeStartTime` set to the official `startTimestamp`
- If users unstake during pre-staking, only the base burn rate (25%) applies

### 3. Active Staking Period
- Begins at the `startTimestamp` set during enableStaking
- Points begin accruing for all stakers based on:
  - Stake amount
  - Multiplier for early stakers (2.0x in week 1, 1.5x in week 2, 1.0x thereafter)
  - Growth rate (default 0.00274 daily)
- Formula: `points = stakeAmount * multiplier * timeStaked * growthRate`
- Users can continue to stake and unstake during this period
- Unstaking applies a burn that increases over time:
  - 25% base burn + (time-based burn that increases linearly up to 75% over 1 year) for a total of 100% burned
  - Calculated via `calculateBurn()` function
- Burned tokens are sent to the `KlimaFairLaunchBurnVault`

### 4. Freeze Period
- Begins at `freezeTimestamp` (set during deployment)
- No new stakes or unstakes are allowed
- Points continue to accrue until finalization

#### Prior to Finalization
- Before finalization can complete, transfer the required KLIMA and KLIMA-X tokens to the staking contract
- The contract must have at least KLIMA_SUPPLY (default 17,500,000) of KLIMA tokens
- The contract must have at least KLIMAX_SUPPLY (default 40,000,000) of KLIMA-X tokens

### 5. Finalization Phase
- After `freezeTimestamp`, the owner calls `storeTotalPoints()` to process all stakers
- This can be done in batches to handle gas limits
- The contract verifies it has sufficient KLIMA and KLIMA-X tokens before completing finalization
- Once complete, `finalizationComplete` is set to 1
- Final points for each user and `finalTotalPoints` are stored

### 6. Claim Phase
- Users call `unstake()` to claim their KLIMA and KLIMA-X allocations
- KLIMA allocation is proportional to stake amount: `(stakeAmount * KLIMA_SUPPLY) / totalStaked`
- KLIMA-X allocation is proportional to points earned: `(userPoints * KLIMAX_SUPPLY) / finalTotalPoints`
- Each stake is marked as claimed to prevent double-claiming

### 7. Final Burn Phase
- The owner initiates the cross-chain burn process
- Tokens collected in the burn vault are bridged to Polygon via Axelar
- The `KlimaFairLaunchPolygonBurnHelper` on Polygon receives and burns the tokens


## Security Considerations

- **Proxy Pattern**: All contracts use the UUPS pattern with proper access controls
- **Owner Controls**: Critical functions are protected by onlyOwner modifiers
- **Cross-chain Security**: Uses Axelar's secure messaging for cross-chain operations
- **Emergency Functions**: Includes emergency pause and withdrawal capabilities if needed

## For Auditors

Key areas to focus on:
- **Staking Calculations**: Verify that point calculations and token allocations are correct
- **Cross-chain Messaging**: Ensure the Axelar integration is secure and handles edge cases
- **Burn Mechanism**: Verify that tokens are properly accounted for and burned
- **Upgradeability**: Check for proper implementation of the UUPS pattern
- **Access Controls**: Ensure owner functions are properly protected

## Testing

The contracts include test suites that cover:
- Unit tests for individual contract functions
- Integration tests for contract interactions
- Cross-chain tests simulating the full burn process

### Test Files

1. **KlimaFairLaunchStaking.t.sol**: Tests the staking contract functionality including stake creation, unstaking with burn calculations, and token distribution during claims.

2. **KlimaFairLaunchBurnVault.t.sol**: Tests the burn vault mechanics, token collection from the staking contract, and preparing tokens for cross-chain burning.

3. **CrossChainBurn.t.sol**: Tests the cross-chain burn process, simulating the Axelar message passing and token burning on Polygon.

4. **PointsCalculations.t.sol**: Verifies the points accrual system, testing time-based multipliers, organic points growth, burn distributions, and token allocation calculations.

#### Key State Variables for Auditors

### Staking Contract Variables
- `startTimestamp`: When points begin accruing for all stakes (set during enableStaking)
- `freezeTimestamp`: When the staking/unstaking functionality is disabled (default: 90 days after startTimestamp)
- `preStakingWindow`: Period before startTimestamp when staking is allowed but points don't accrue (3-7 days)
- `GROWTH_RATE`: Configurable rate at which points accrue daily (default 274, represents 0.00274)
- `BURN_DISTRIBUTION_PRECISION`: Constant (1e18) used in maintaining precision during the redistribution of points
- `burnRatio`: Global ratio used to distribute burn points proportionately to organic points
- `totalOrganicPoints`: Sum of all organically earned points across all stakes
- `totalBurned`: Total amount of KLIMA V0 burned through the unstaking process
- `totalStaked`: Total amount of KLIMA V0 currently staked
- `stakerAddresses`: Array of all addresses that have ever staked
- `finalizationComplete`: Flag (0 or 1) indicating whether finalization is complete

### User Stake Structure
Each stake contains:
- `amount`: Amount of KLIMA V0 tokens staked
- `stakeStartTime`: When the stake begins accruing points (often equals startTimestamp for pre-staking)
- `lastUpdateTime`: When points were last calculated for this stake
- `bonusMultiplier`: Multiplier applied to points (200 for week 1, 150 for week 2, 100 thereafter)
- `organicPoints`: Points earned through staking time
- `burnRatioSnapshot`: The burnRatio value when points were last updated
- `burnAccrued`: Additional points received from other users' unstakes
- `hasBeenClaimed`: Flag (0 or 1) indicating whether this stake has been claimed

### Burn Distribution Mechanism
When a user unstakes, their organic points are freed and distributed proportionally to remaining stakers:
1. The freed organic points increase the global `burnRatio`
2. When other users' points are updated, the difference between current `burnRatio` and their stake's `burnRatioSnapshot` is used to calculate additional "burn points"
3. These burn points are added to the stake's `burnAccrued` total
4. Both organic and burn points count toward the final KLIMA-X allocation

### Burn Vault Variables
- `klimaFairLaunchStaking`: Address of the staking contract that can call addKlimaAmountToBurn
- `klimaAmountToBurn`: Mapping of user addresses to their burn amounts (user => amount)
- `totalKlimaToBurn`: Total amount of KLIMA V0 tokens collected for burning
- `helperContractOnPolygon`: Address of the helper contract deployed on Polygon
- `interchainTokenService`: Address of Axelar's Interchain Token Service
- `TOKEN_ID`: Constant bytes32 identifier for the KLIMA V0 token in Axelar's system
- `DESTINATION_CHAIN`: Constant string "Polygon" specifying the destination chain
- `emergencyWithdrawalEnabled`: Flag (true/false) that enables/disables emergency withdrawals

### Polygon Helper Variables
- `KLIMA`: Immutable address of the KLIMA token on Polygon
- `EXPECTED_TOKEN_ID`: Immutable bytes32 token ID that must match for security validation
- `interchainTokenService`: Inherited from InterchainTokenExecutable, the ITS address on Polygon

## Mathematical Formulas and Invariants

### Points Calculation Formula
For each wallet i, final points (Pi) are determined by:

Pi = Si × Bi × e^(kt) + Ri

Where:
- Si = Original staked amount for wallet i
- Bi = Early entry bonus multiplier (2.0 for Week 1, 1.5 for Week 2, 1.0 otherwise)
- k = 0.00274 (growth constant, represented as GROWTH_RATE in the contract)
- t = Days staked until freeze
- Ri = Accumulated redistribution from burns

### Token Distribution Formulas

KLIMA Allocation:
For each wallet i, the KLIMA allocation (Ni) is calculated as:
Ni = (Si / ST) × 17,500,000
Where:
- Si = Final staked amount for wallet i
- ST = Total KLIMA remaining staked at freeze (totalStaked)

KLIMAX Allocation:
For each wallet i, the KLIMAX allocation (Ki) is determined by:
Ki = (Pi / PT) × 40,000,000
Where:
- Pi = Final points for wallet i
- PT = Total points across all wallets (finalTotalPoints)

### System Invariants
The system must maintain these mathematical invariants throughout the distribution:
1. ∑(Ni) = 17,500,000 (Total KLIMA allocated)
2. ∑(Ki) = 40,000,000 (Total KLIMAX allocated)
3. For any wallet i: if Si > 0, then Ni > 0 and Ki > 0
4. For any wallet i: if Si = 0, then Ni = 0 and Ki = 0

## License

MIT