// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {KlimaFairLaunchStaking} from "../src/KlimaFairLaunchStaking.sol";
import {KlimaFairLaunchBurnVault} from "../src/KlimaFairLaunchBurnVault.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title DeployBase
 * @notice Script to deploy Klima Fair Launch contracts on Base chain
 * @dev This script deploys the KlimaFairLaunchStaking and KlimaFairLaunchBurnVault contracts
 */
contract DeployBase is Script {
    // Chain-specific constants
    address public constant BASE_KLIMA_V0 = 0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2; // KLIMA on Base
    address public constant BASE_INTERCHAIN_SERVICE = 0xB5FB4BE02232B1bBA4dC8f81dc24C26980dE9e3C;
    
    // Token ID for cross-chain transfers
    bytes32 public constant TOKEN_ID = 0xdc30a9bd9048b5a833e3f90ea281f70ae77e82018fa5b96831d3a1f563e38aaf;
    
    // Deployed contract addresses
    KlimaFairLaunchStaking public stakingContract;
    KlimaFairLaunchBurnVault public burnVault;
    
    // Contract implementation addresses
    address public stakingImplementation;
    address public burnVaultImplementation;

    function run() public {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("FAIRLAUNCH_DEPLOYER_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Log deployment parameters
        console.log("=== Deployment Configuration ===");
        console.log("Deployer:", deployer);
        
        // Start the deployment process
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy contracts
        deployContracts(deployer);
        
        // Link contracts together
        console.log("\n=== Linking contracts ===");
        linkContracts();
        
        vm.stopBroadcast();
        
        // Log deployment results
        logDeploymentSummary();
    }
    
    /**
     * @notice Deploys the Staking and Burn Vault contracts
     * @param owner The address that will own the deployed contracts
     */
    function deployContracts(address owner) internal {
        console.log("\n=== Deploying contracts on Base ===");
        
        // 1. Deploy Staking Contract
        console.log("Deploying KlimaFairLaunchStaking implementation...");
        KlimaFairLaunchStaking stakingImplementationContract = new KlimaFairLaunchStaking();
        stakingImplementation = address(stakingImplementationContract);
        
        // Prepare initialization data
        bytes memory stakingInitData = abi.encodeWithSelector(
            KlimaFairLaunchStaking.initialize.selector,
            owner
        );
        
        // Deploy proxy
        console.log("Deploying KlimaFairLaunchStaking proxy...");
        address stakingProxyAddress = address(
            new ERC1967Proxy(stakingImplementation, stakingInitData)
        );
        stakingContract = KlimaFairLaunchStaking(stakingProxyAddress);
        console.log("KlimaFairLaunchStaking deployed at:", address(stakingContract));
        
        // 2. Deploy Burn Vault Contract
        console.log("\nDeploying KlimaFairLaunchBurnVault implementation...");
        KlimaFairLaunchBurnVault burnVaultImplementationContract = new KlimaFairLaunchBurnVault();
        burnVaultImplementation = address(burnVaultImplementationContract);
        
        // Prepare initialization data
        bytes memory burnVaultInitData = abi.encodeWithSelector(
            KlimaFairLaunchBurnVault.initialize.selector,
            owner,
            BASE_INTERCHAIN_SERVICE
        );
        
        // Deploy proxy
        console.log("Deploying KlimaFairLaunchBurnVault proxy...");
        address burnVaultProxyAddress = address(
            new ERC1967Proxy(burnVaultImplementation, burnVaultInitData)
        );
        burnVault = KlimaFairLaunchBurnVault(burnVaultProxyAddress);
        console.log("KlimaFairLaunchBurnVault deployed at:", address(burnVault));
    }
    
    /**
     * @notice Links the staking contract with the burn vault
     */
    function linkContracts() internal {
        // Link contracts together
        console.log("Linking staking contract and burn vault...");
        burnVault.setKlimaFairLaunchStaking(address(stakingContract));
        stakingContract.setBurnVault(address(burnVault));
        
        console.log("Contracts linked successfully");
    }
    
    /**
     * @notice Logs a summary of the deployment
     */
    function logDeploymentSummary() internal view {
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Contracts:");
        console.log("- KlimaFairLaunchStaking Proxy:", address(stakingContract));
        console.log("- KlimaFairLaunchStaking Implementation:", stakingImplementation);
        console.log("- KlimaFairLaunchBurnVault Proxy:", address(burnVault));
        console.log("- KlimaFairLaunchBurnVault Implementation:", burnVaultImplementation);
        
        console.log("\nNext Steps:");
        console.log("1. Set KLIMA and KLIMA_X token addresses in staking contract");
        console.log("2. Set helper contract address in burn vault (after deploying on Polygon)");
        console.log("3. Set staking start time to enable staking");
        console.log("4. Verify contracts on block explorer");
    }
} 