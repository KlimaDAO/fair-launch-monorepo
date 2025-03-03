// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console2} from "forge-std/Test.sol";
import {KlimaFairLaunchBurnVault} from "../src/KlimaFairLaunchBurnVault.sol";
import {KlimaFairLaunchPolygonBurnHelper} from "../src/KlimaFairLaunchPolygonBurnHelper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Vm} from "forge-std/Vm.sol";

interface IInterchainTokenService {
    function callContractWithInterchainToken(
        bytes32 tokenId,
        string calldata destinationChain,
        bytes calldata destinationAddress,
        uint256 amount,
        bytes calldata data,
        uint256 gasValue
    ) external payable;
}

interface IKlimaToken is IERC20 {
    function burn(uint256 amount) external;
    function totalSupply() external view returns (uint256);
}

contract KlimaFairLaunchStakingForTest {
    uint256 public finalizationComplete = 1;
    
    function setFinalizationComplete(uint256 value) external {
        finalizationComplete = value;
    }
}

contract CrossChainBurnTest is Test {
    // Chain forks
    uint256 private baseFork;
    uint256 private polygonFork;
    
    // Base chain contracts
    KlimaFairLaunchBurnVault public burnVault;
    address public baseKlima = 0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2; // KLIMA on Base
    address public baseInterchainService = 0xB5FB4BE02232B1bBA4dC8f81dc24C26980dE9e3C;
    
    // Polygon chain contracts
    KlimaFairLaunchPolygonBurnHelper public polygonHelper;
    address public polygonKlima = 0x4e78011Ce80ee02d2c3e649Fb657E45898257815; // KLIMA on Polygon
    address public polygonInterchainService = 0xB5FB4BE02232B1bBA4dC8f81dc24C26980dE9e3C;
    
    // Axelar Gateway addresses (the address that calls executeWithInterchainToken)
    address public polygonAxelarGateway = 0x6f015F16De9fC8791b234eF68D486d2bF203FBA8;
    
    // Test accounts
    address public owner = address(0x1);
    address public user1 = address(0x2);
    
    // Test parameters
    uint256 public burnAmount = 100 * 1e9; // 100 KLIMA (9 decimals)
    bytes32 public tokenId;
    KlimaFairLaunchStakingForTest public stakingContract;
    
    function setUp() public {
        // Create forks of both chains
        baseFork = vm.createFork("base");
        polygonFork = vm.createFork("polygon");
        
        // Initialize contracts on Base
        vm.selectFork(baseFork);
        
        stakingContract = new KlimaFairLaunchStakingForTest();
        
        // Deploy implementation and proxy separately
        KlimaFairLaunchBurnVault implementation = new KlimaFairLaunchBurnVault();
        
        // Deploy proxy with initialization data
        bytes memory initData = abi.encodeWithSelector(
            KlimaFairLaunchBurnVault.initialize.selector,
            owner
        );
        address proxyAddress = address(new ERC1967Proxy(address(implementation), initData));
        burnVault = KlimaFairLaunchBurnVault(proxyAddress);
        
        vm.startPrank(owner);
        burnVault.setKlimaFairLaunchStaking(address(stakingContract));
        
        // Set the Interchain Token Service address
        burnVault.setInterchainTokenService(baseInterchainService);
        
        tokenId = burnVault.TOKEN_ID();
        vm.stopPrank();
        
        // Initialize contracts on Polygon
        vm.selectFork(polygonFork);
        
        // Deploy implementation and proxy separately
        KlimaFairLaunchPolygonBurnHelper helperImplementation = new KlimaFairLaunchPolygonBurnHelper(
            polygonAxelarGateway,
            polygonKlima
        );
        
        // Deploy proxy with initialization data
        bytes memory helperInitData = abi.encodeWithSelector(
            KlimaFairLaunchPolygonBurnHelper.initialize.selector,
            owner
        );
        address helperProxyAddress = address(new ERC1967Proxy(address(helperImplementation), helperInitData));
        polygonHelper = KlimaFairLaunchPolygonBurnHelper(helperProxyAddress);
        
        // Go back to Base to set helper address
        vm.selectFork(baseFork);
        vm.prank(owner);
        burnVault.setHelperContractOnPolygon(address(polygonHelper));
    }
    
    function testCrossChainBurn() public {
        // Step 1: Prepare Base chain state
        vm.selectFork(baseFork);
        
        // First give tokens to the staking contract
        deal(baseKlima, address(stakingContract), burnAmount);
        
        // Approve the vault to take tokens from staking contract
        vm.prank(address(stakingContract));
        IERC20(baseKlima).approve(address(burnVault), burnAmount);
        
        // Have the staking contract call addKlimaAmountToBurn
        // This will properly update totalKlimaToBurn
        vm.prank(address(stakingContract));
        burnVault.addKlimaAmountToBurn(user1, burnAmount);
        
        // Record total supply before the burn
        uint256 baseTotalSupplyBefore = IKlimaToken(baseKlima).totalSupply();
        uint256 vaultBalanceBefore = IERC20(baseKlima).balanceOf(address(burnVault));
        
        // Step 2: Initiate the cross-chain burn from Base
        vm.selectFork(baseFork);
        
        // Make sure owner has ETH to send
        vm.deal(owner, 1 ether);
        
        // Record logs for debugging
        vm.recordLogs();

        // Make the call to initiate burn
        vm.prank(owner);
        burnVault.initiateFinalBurn{value: 0.1 ether}();
        
        // Get the logs for debugging
        Vm.Log[] memory logs = vm.getRecordedLogs();
        for (uint i = 0; i < logs.length; i++) {
            console2.log("Log topic 0:", vm.toString(logs[i].topics[0]));
            if (logs[i].topics.length > 1) console2.log("Log topic 1:", vm.toString(logs[i].topics[1]));
            console2.log("Log data:", vm.toString(logs[i].data));
            console2.log("---");
        }
        
        // Verify Base side effects
        uint256 vaultBalanceAfter = IERC20(baseKlima).balanceOf(address(burnVault));
        assertEq(vaultBalanceAfter, 0, "Vault should have 0 KLIMA after initiating burn");
        
        // Step 3: Simulate Axelar relaying the message to Polygon
        vm.selectFork(polygonFork);
        
        // Record initial state on Polygon
        uint256 polyTotalSupplyBefore = IKlimaToken(polygonKlima).totalSupply();
        
        // Simulate the token transfer to the helper before execution
        // (This would normally be done by Axelar's ITS)
        deal(polygonKlima, address(polygonHelper), burnAmount);
        
        // Prepare the parameters for the executeWithInterchainToken call
        bytes32 mockCommandId = bytes32(uint256(1)); // Dummy command ID
        string memory sourceChain = "Base";
        bytes memory sourceAddress = abi.encodePacked(address(burnVault));
        bytes memory data = abi.encode(burnAmount, address(burnVault));
        
        // Impersonate the Axelar Gateway to simulate the relay call
        vm.startPrank(polygonAxelarGateway);
        
        // This is the critical call that simulates Axelar's relay
        polygonHelper.executeWithInterchainToken(
            mockCommandId,
            sourceChain,
            sourceAddress,
            data,
            tokenId,
            polygonKlima,
            burnAmount
        );
        
        vm.stopPrank();
        
        // Step 4: Verify effects on Polygon
        // Check that helper has 0 KLIMA (all burned)
        uint256 helperBalanceAfter = IERC20(polygonKlima).balanceOf(address(polygonHelper));
        assertEq(helperBalanceAfter, 0, "Helper should have 0 KLIMA after burn");
        
        // Verify total supply decreased (tokens were truly burned)
        uint256 polyTotalSupplyAfter = IKlimaToken(polygonKlima).totalSupply();
        assertEq(polyTotalSupplyAfter, polyTotalSupplyBefore - burnAmount, 
            "Total supply should decrease by burned amount");
    }
    
    // You can add additional test cases here, e.g., testing with invalid tokens or
    // when finalization is not complete
    
    function testInitiateBurnWhenNotFinalized() public {
        vm.selectFork(baseFork);
        
        // Set finalization to 0 (not finalized)
        stakingContract.setFinalizationComplete(0);
        
        // Fund vault
        deal(baseKlima, address(burnVault), burnAmount);
        
        // Attempt to initiate burn - should revert
        vm.prank(owner);
        vm.expectRevert("Staking contract not finalized");
        burnVault.initiateFinalBurn{value: 0.1 ether}();
    }
    
    function testExecuteWithWrongToken() public {
        vm.selectFork(polygonFork);
        
        // Create a fake token to try to burn
        address fakeToken = address(0xdead);
        
        // Fund helper with real KLIMA
        deal(polygonKlima, address(polygonHelper), burnAmount);
        
        // Try to execute with wrong token - should revert
        vm.prank(polygonAxelarGateway);
        vm.expectRevert("Invalid token");
        polygonHelper.executeWithInterchainToken(
            bytes32(uint256(1)),
            "Base",
            abi.encodePacked(address(burnVault)),
            new bytes(0),
            tokenId,
            fakeToken,
            burnAmount
        );
    }
    
    // Helper function - can be used to simulate different total burn amounts
    function _setTotalKlimaToBurn(uint256 amount) internal {
        vm.selectFork(baseFork);
        burnAmount = amount;
    }
    
    // Fallback to receive any refunded ETH
    receive() external payable {}

    function testAxelarDirectCall() public {
        vm.selectFork(baseFork);
        
        // Prepare parameters
        string memory destinationChain = "Polygon";
        bytes memory destinationAddress = abi.encodePacked(address(polygonHelper));
        uint256 amount = 100 * 1e9;
        bytes memory data = abi.encode(amount, address(burnVault));
        uint256 gasValue = 0.1 ether;
        
        // Fund the caller
        vm.deal(address(this), 1 ether);
        
        // Get some tokens
        deal(baseKlima, address(this), amount);
        
        // Approve tokens
        IERC20(baseKlima).approve(baseInterchainService, amount);
        
        // Call directly and catch the error
        try IInterchainTokenService(baseInterchainService).callContractWithInterchainToken{value: gasValue}(
            tokenId,
            destinationChain,
            destinationAddress,
            amount,
            data,
            gasValue
        ) {
            console2.log("Call succeeded");
        } catch Error(string memory reason) {
            console2.log("Revert reason:", reason);
        } catch Panic(uint code) {
            console2.log("Panic code:", code);
        } catch (bytes memory lowLevelData) {
            console2.log("Low level error:", vm.toString(lowLevelData));
        }
    }

    function testAxelarDirectCallFromImplementation() public {
        vm.selectFork(baseFork);
        
        // Get the implementation address
        address implementation = address(new KlimaFairLaunchBurnVault());
        
        // Prepare parameters
        string memory destinationChain = "Polygon";
        bytes memory destinationAddress = abi.encodePacked(address(polygonHelper));
        uint256 amount = 100 * 1e9;
        bytes memory data = abi.encode(amount, implementation);
        uint256 gasValue = 0.1 ether;
        
        // Fund the implementation
        vm.deal(implementation, 1 ether);
        
        // Get some tokens for the implementation
        deal(baseKlima, implementation, amount);
        
        // Impersonate the implementation
        vm.startPrank(implementation);
        
        // Approve tokens
        IERC20(baseKlima).approve(baseInterchainService, amount);
        
        // Call directly and catch the error
        try IInterchainTokenService(baseInterchainService).callContractWithInterchainToken{value: gasValue}(
            tokenId,
            destinationChain,
            destinationAddress,
            amount,
            data,
            gasValue
        ) {
            console2.log("Call succeeded from implementation");
        } catch Error(string memory reason) {
            console2.log("Revert reason from implementation:", reason);
        } catch Panic(uint code) {
            console2.log("Panic code from implementation:", code);
        } catch (bytes memory lowLevelData) {
            console2.log("Low level error from implementation:", vm.toString(lowLevelData));
        }
        
        vm.stopPrank();
    }

    function testBaseChainOnly() public {
        // Step 1: Prepare Base chain state
        vm.selectFork(baseFork);
        
        // First give tokens to the staking contract
        deal(baseKlima, address(stakingContract), burnAmount);
        
        // Approve the vault to take tokens from staking contract
        vm.prank(address(stakingContract));
        IERC20(baseKlima).approve(address(burnVault), burnAmount);
        
        // Have the staking contract call addKlimaAmountToBurn
        vm.prank(address(stakingContract));
        burnVault.addKlimaAmountToBurn(user1, burnAmount);
        
        // Make sure owner has ETH to send
        vm.deal(owner, 1 ether);
        
        // Record logs
        vm.recordLogs();
        
        // Try to call initiateFinalBurn with a try/catch
        vm.prank(owner);
        try burnVault.initiateFinalBurn{value: 0.1 ether}() {
            console2.log("Burn succeeded");
        } catch Error(string memory reason) {
            console2.log("Revert reason:", reason);
        } catch {
            console2.log("Revert with no reason");
        }
        
        // Print all logs
        Vm.Log[] memory logs = vm.getRecordedLogs();
        console2.log("Number of logs:", logs.length);
        for (uint i = 0; i < logs.length; i++) {
            bytes32 topic0 = logs[i].topics[0];
            console2.log("Log", i, "topic0:", vm.toString(topic0));
            
            // Check for Approval event (keccak256("Approval(address,address,uint256)"))
            if (topic0 == 0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925) {
                console2.log("  Approval event found");
                if (logs[i].topics.length > 1) {
                    console2.log("  Owner:", vm.toString(logs[i].topics[1]));
                }
                if (logs[i].topics.length > 2) {
                    console2.log("  Spender:", vm.toString(logs[i].topics[2]));
                }
                console2.log("  Value:", vm.toString(logs[i].data));
            }
        }
        
        // Check token balances
        uint256 vaultBalance = IERC20(baseKlima).balanceOf(address(burnVault));
        console2.log("Vault balance after:", vaultBalance);
        
        // Check if the token is registered
        bytes32 tokenRegistrySlot = keccak256(abi.encode(
            burnVault.TOKEN_ID(),
            uint256(0) // Slot offset for token registry
        ));
        
        bytes32 value = vm.load(baseInterchainService, tokenRegistrySlot);
        console2.log("Token registry value:", vm.toString(value));
        
        // Try to get more information about the token from Axelar
        // This is a common pattern in Axelar contracts
        bytes32 tokenInfoSlot = keccak256(abi.encode(
            burnVault.TOKEN_ID(),
            uint256(1) // Different slot offset for token info
        ));
        
        bytes32 tokenInfo = vm.load(baseInterchainService, tokenInfoSlot);
        console2.log("Token info value:", vm.toString(tokenInfo));
    }
} 