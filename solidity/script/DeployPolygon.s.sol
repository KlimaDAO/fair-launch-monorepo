// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {KlimaFairLaunchPolygonBurnHelper} from "../src/KlimaFairLaunchPolygonBurnHelper.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title DeployPolygon
 * @notice Script to deploy Klima Fair Launch helper contract on Polygon chain
 * @dev This script deploys the KlimaFairLaunchPolygonBurnHelper contract
 */
contract DeployPolygon is Script {
    // Chain-specific constants
    address public constant POLYGON_KLIMA = 0x4e78011Ce80ee02d2c3e649Fb657E45898257815; // KLIMA on Polygon
    address public constant POLYGON_INTERCHAIN_SERVICE = 0xB5FB4BE02232B1bBA4dC8f81dc24C26980dE9e3C;
    
    // Token ID for cross-chain transfers
    bytes32 public constant TOKEN_ID = 0xdc30a9bd9048b5a833e3f90ea281f70ae77e82018fa5b96831d3a1f563e38aaf;
    
    // Deployed contract addresses
    KlimaFairLaunchPolygonBurnHelper public polygonHelper;
    
    // Contract implementation addresses
    address public polygonHelperImplementation;

    function run() public {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("FAIRLAUNCH_DEPLOYER_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Log deployment parameters
        console.log("=== Deployment Configuration ===");
        console.log("Deployer:", deployer);
        console.log("KLIMA token address:", POLYGON_KLIMA);
        console.log("Interchain Token Service:", POLYGON_INTERCHAIN_SERVICE);
        
        // Start the deployment process
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy contracts
        deployContracts(deployer);
        
        vm.stopBroadcast();
        
        // Log deployment results
        logDeploymentSummary();
    }
    
    /**
     * @notice Deploys the Polygon Burn Helper contract
     * @param owner The address that will own the deployed contract
     */
    function deployContracts(address owner) internal {
        console.log("\n=== Deploying contracts on Polygon ===");
        
        // Deploy Polygon Helper implementation
        console.log("Deploying KlimaFairLaunchPolygonBurnHelper implementation...");
        KlimaFairLaunchPolygonBurnHelper polygonHelperImplementationContract = new KlimaFairLaunchPolygonBurnHelper(
            POLYGON_INTERCHAIN_SERVICE,
            POLYGON_KLIMA,
            TOKEN_ID
        );
        polygonHelperImplementation = address(polygonHelperImplementationContract);
        
        // Prepare initialization data
        bytes memory helperInitData = abi.encodeWithSelector(
            KlimaFairLaunchPolygonBurnHelper.initialize.selector,
            owner
        );
        
        // Deploy proxy
        console.log("Deploying KlimaFairLaunchPolygonBurnHelper proxy...");
        address helperProxyAddress = address(
            new ERC1967Proxy(polygonHelperImplementation, helperInitData)
        );
        polygonHelper = KlimaFairLaunchPolygonBurnHelper(helperProxyAddress);
        console.log("KlimaFairLaunchPolygonBurnHelper deployed at:", address(polygonHelper));
    }
    
    /**
     * @notice Logs a summary of the deployment
     */
    function logDeploymentSummary() internal view {
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Contracts:");
        console.log("- KlimaFairLaunchPolygonBurnHelper Proxy:", address(polygonHelper));
        console.log("- KlimaFairLaunchPolygonBurnHelper Implementation:", polygonHelperImplementation);
        
        console.log("\nNext Steps:");
        console.log("1. Set this helper address in the Base chain burn vault using:");
        console.log("   cast send --rpc-url $BASE_RPC_URL --private-key $FAIRLAUNCH_DEPLOYER_KEY <BURN_VAULT_ADDRESS> \"setHelperContractOnPolygon(address)\" ", address(polygonHelper));
        console.log("2. Verify contract on Polygonscan");
    }
} 