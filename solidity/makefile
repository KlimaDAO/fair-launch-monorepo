include .env
export $(shell sed 's/=.*//' .env)

ANVIL_PUBLIC_WALLET = 0xfF961eD9c48FBEbDEf48542432D21efA546ddb89

KLIMA_VO=0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2
KLIMA_WHALE=0xfF961eD9c48FBEbDEf48542432D21efA546ddb89
# local
FAIR_LAUNCH_STAKING=0x4Dd5336F3C0D70893A7a86c6aEBe9B953E87c891
BURN_VAULT=0xBe6Eb4ACB499f992ba2DaC7CAD59d56DA9e0D823
KLIMA=0x3C2BafebbB0c8c58f39A976e725cD20D611d01e9
KLIMA_X=0x3C2BafebbB0c8c58f39A976e725cD20D611d01e9

USER_2=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
USER_3=0x3C499c542cEF5E3811e1192ce70d8cC03d5c3359
USER_4=0x90F79bf6EB2c4f870365E785982E1f101E93b906
USER_5=0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65

RPC_URL = http://localhost:8545

local-fork:
	anvil --fork-url $(BASE_URL) --host 0.0.0.0 --no-storage-caching

deploy:
	rm -rf ../cache && source .env && forge script script/deploy.s.sol --rpc-url http://localhost:8545 --private-key $(ANVIL_PRIVATE_KEY) --broadcast --ffi

distribute-old-klima:	
	cast rpc anvil_impersonateAccount $(KLIMA_WHALE) --rpc-url $(RPC_URL)

	cast call $(KLIMA_VO) "balanceOf(address)(uint256)" $(KLIMA_WHALE)

	cast send $(KLIMA_VO) --rpc-url $(RPC_URL) --unlocked --from $(KLIMA_WHALE)  "approve(address,uint256)(bool)" $(KLIMA_VO) 1000000000000000000000

	cast send $(KLIMA_VO) --rpc-url $(RPC_URL) --unlocked --from $(KLIMA_WHALE) "transfer(address,uint256)(bool)" $(USER_2) 100000

	cast send $(KLIMA_VO) --rpc-url $(RPC_URL) --unlocked --from $(KLIMA_WHALE) "transfer(address,uint256)(bool)" $(USER_3) 100000

	cast send $(KLIMA_VO) --rpc-url $(RPC_URL) --unlocked --from $(KLIMA_WHALE) "transfer(address,uint256)(bool)" $(USER_4) 100000

	cast send $(KLIMA_VO) --rpc-url $(RPC_URL) --unlocked --from $(KLIMA_WHALE) "transfer(address,uint256)(bool)" $(USER_5) 100000


stake:
	cast call $(FAIR_LAUNCH_STAKING) "owner()(address)"

	cast send $(FAIR_LAUNCH_STAKING) --rpc-url $(RPC_URL) --unlocked --from $(ANVIL_PUBLIC_WALLET) "setBurnVault(address)" $(BURN_VAULT)

	# cast send $(FAIR_LAUNCH_STAKING) --rpc-url $(RPC_URL) --unlocked --from $(ANVIL_PUBLIC_WALLET) "enableStaking(uint256)(bool)" $$(date +%s)


	
	# cast send $(FAIR_LAUNCH_STAKING) --rpc-url $(RPC_URL) --unlocked --from $(KLIMA_WHALE) "stake(uint256)(bool)" 1000

	# cast send $(FAIR_LAUNCH_STAKING) --rpc-url $(RPC_URL) --unlocked --from $(USER_2) "stake(uint256)(bool)" 200

	# cast send $(FAIR_LAUNCH_STAKING) --rpc-url $(RPC_URL) --unlocked --from $(USER_3) "stake(uint256)(bool)" 300

	# cast send $(FAIR_LAUNCH_STAKING) --rpc-url $(RPC_URL) --unlocked --from $(USER_4) "stake(uint256)(bool)" 400

	# cast send $(FAIR_LAUNCH_STAKING) --rpc-url $(RPC_URL) --unlocked --from $(USER_5) "stake(uint256)(bool)" 500





	
	


