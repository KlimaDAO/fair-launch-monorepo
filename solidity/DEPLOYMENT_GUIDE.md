# Klima Fair Launch Deployment Guide

This guide explains how to deploy the Klima Fair Launch contracts across Base and Polygon networks.

## Prerequisites

Before starting the deployment process, make sure you have:

1. [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
2. A wallet with sufficient ETH on both Base and Polygon networks
3. RPC URLs for both Base and Polygon networks
4. The private key for the deploying wallet

## Deployment Steps

The deployment is split into two separate scripts, one for each network:

1. `DeployBase.s.sol`: Deploys the staking contract and burn vault on Base
2. `DeployPolygon.s.sol`: Deploys the polygon burn helper on Polygon

### Step 1: Set Up Environment Variables

The repository includes an example environment file. Copy it and fill in your values:

```bash
cp .env.example .env
```

Then edit the `.env` file to include your specific values:

```
# Deployment keys
FAIRLAUNCH_DEPLOYER_KEY=your_private_key_here

# RPC endpoints
BASE_RPC_URL=https://mainnet.base.org
POLYGON_RPC_URL=https://polygon-rpc.com

# Block explorer API keys for verification
BASESCAN_API_KEY=your_basescan_api_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here

# Verification details
FAIRLAUNCH_CONTRACT_VERIFICATION_OWNER=your_deployer_address_here
```

### Step 2: Deploy Contracts on Base

Run the following command to deploy the staking contract and burn vault on Base:

```bash
source .env
forge script script/DeployBase.s.sol --rpc-url $BASE_RPC_URL --broadcast --verify
```

This script will:
1. Deploy the KlimaFairLaunchStaking implementation and proxy
2. Deploy the KlimaFairLaunchBurnVault implementation and proxy
3. Link the contracts together

Take note of the contract addresses printed at the end of deployment.

### Step 3: Deploy Contracts on Polygon

Run the following command to deploy the polygon burn helper on Polygon:

```bash
source .env
forge script script/DeployPolygon.s.sol --rpc-url $POLYGON_RPC_URL --broadcast --verify
```

This script will:
1. Deploy the KlimaFairLaunchPolygonBurnHelper implementation and proxy
2. Print the address to use in the next step

### Step 4: Link Cross-Chain Contracts

After deploying on both networks, you need to set the Polygon helper address in the Base burn vault:

1. Connect to the Base network
2. Call `setHelperContractOnPolygon` on the burn vault with the polygon helper address:

```bash
cast send --rpc-url $BASE_RPC_URL --private-key $FAIRLAUNCH_DEPLOYER_KEY <BURN_VAULT_ADDRESS> "setHelperContractOnPolygon(address)" <POLYGON_HELPER_ADDRESS>
```

### Step 5: Final Configuration

After all contracts are deployed, you need to perform these additional configuration steps on Base:

1. Set the token addresses in the staking contract:

```bash
# Set KLIMA and KLIMA-X token addresses
cast send --rpc-url $BASE_RPC_URL --private-key $FAIRLAUNCH_DEPLOYER_KEY <STAKING_CONTRACT_ADDRESS> "setTokenAddresses(address,address)" <KLIMA_ADDRESS> <KLIMA_X_ADDRESS>
```

2. Set staking start time to enable staking:

```bash
# Set start timestamp TO ENABLE STAKING
cast send --rpc-url $BASE_RPC_URL --private-key $FAIRLAUNCH_DEPLOYER_KEY <STAKING_CONTRACT_ADDRESS> "enableStaking(uint256)" <START_TIMESTAMP>
```

## Contract Verification

The deployment scripts include verification when using the `--verify` flag, but you can also verify manually if needed:

### Base Contracts

#### KlimaFairLaunchStaking:

```bash
forge verify-contract <STAKING_IMPLEMENTATION_ADDRESS> src/KlimaFairLaunchStaking.sol:KlimaFairLaunchStaking --chain base --etherscan-api-key $BASESCAN_API_KEY
```

#### KlimaFairLaunchBurnVault:

```bash
forge verify-contract <BURN_VAULT_IMPLEMENTATION_ADDRESS> src/KlimaFairLaunchBurnVault.sol:KlimaFairLaunchBurnVault --chain base --etherscan-api-key $BASESCAN_API_KEY
```

### Polygon Contracts

#### KlimaFairLaunchPolygonBurnHelper:

```bash
forge verify-contract <POLYGON_HELPER_IMPLEMENTATION_ADDRESS> --constructor-args $(cast abi-encode "constructor(address,address,bytes32)" <POLYGON_INTERCHAIN_SERVICE> <POLYGON_KLIMA> <TOKEN_ID>) src/KlimaFairLaunchPolygonBurnHelper.sol:KlimaFairLaunchPolygonBurnHelper --chain polygon --etherscan-api-key $POLYGONSCAN_API_KEY
```