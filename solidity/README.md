# KLIMA Fair Launch Smart Contracts

This repository contains the smart contracts for the KLIMA Fair Launch, a mechanism designed to transition from KLIMA V0 to KLIMA and KLIMA-X tokens through a staking and burn process.

## Overview

The KLIMA Fair Launch consists of three main components:

1. **KlimaFairLaunchStaking**: Allows users to stake KLIMA V0 tokens and earn points toward the new KLIMA and KLIMA-X token allocations. Users can unstake during the staking period, which triggers a burn calculation.
2. **KlimaFairLaunchBurnVault**: Collects KLIMA V0 tokens that will be burned as part of the transition. Handles the cross-chain burn process via Axelar's Interchain Token Service.
3. **KlimaFairLaunchPolygonBurnHelper**: Deployed on Polygon to receive and burn KLIMA tokens after they are bridged from Base.

## Architecture

The system operates across two chains:
- **Base**: Where users stake KLIMA V0 tokens and the burn vault collects tokens for burning
- **Polygon**: Where the actual token burning occurs via the helper contract

All contracts use the UUPS (Universal Upgradeable Proxy Standard) pattern for upgradeability.

## Key Features

- **Time-based Staking Multipliers**: Earlier stakers receive higher point multipliers
- **Cross-chain Token Burning**: Tokens are collected on Base and burned on Polygon
- **Proportional Token Distribution**: New tokens are distributed based on staking points
- **Finalization Process**: After the staking period ends, the contract calculates final allocations

## Contract Interactions

1. Users stake KLIMA V0 tokens in the KlimaFairLaunchStaking contract
2. If users unstake before the freeze period, a portion of their tokens are sent to the KlimaFairLaunchBurnVault
3. After staking is finalized, the owner initiates the final burn
4. The burn vault uses Axelar's Interchain Token Service to bridge tokens to Polygon
5. The KlimaFairLaunchPolygonBurnHelper on Polygon receives and burns the tokens

## Security Considerations

- **Proxy Pattern**: All contracts use the UUPS pattern with proper access controls
- **Owner Controls**: Critical functions are protected by onlyOwner modifiers
- **Cross-chain Security**: Uses Axelar's secure messaging for cross-chain operations
- **Emergency Functions**: Includes emergency withdrawal capabilities if needed

## For Auditors

Key areas to focus on:
- **Staking Calculations**: Verify that point calculations and token allocations are correct
- **Cross-chain Messaging**: Ensure the Axelar integration is secure and handles edge cases
- **Burn Mechanism**: Verify that tokens are properly accounted for and burned
- **Upgradeability**: Check for proper implementation of the UUPS pattern
- **Access Controls**: Ensure owner functions are properly protected

## Testing

The contracts include comprehensive test suites that cover:
- Unit tests for individual contract functions
- Integration tests for contract interactions
- Cross-chain tests simulating the full burn process

## Deployment

The contracts are designed to be deployed in the following order:
1. Deploy KlimaFairLaunchStaking implementation and proxy
2. Deploy KlimaFairLaunchBurnVault implementation and proxy
3. Deploy KlimaFairLaunchPolygonBurnHelper implementation and proxy
4. Configure contracts with token addresses and parameters
5. Connect contracts by setting the appropriate addresses

## License

MIT

