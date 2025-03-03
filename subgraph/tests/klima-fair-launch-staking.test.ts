import {
  test,
  clearStore,
  assert,
  newMockEvent,
  afterAll,
} from "matchstick-as/assembly/index";
import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  StakeCreated as StakeCreatedEvent,
  StakeBurned as StakeBurnedEvent,
  StakeClaimed as StakeClaimedEvent,
} from "../generated/KlimaFairLaunchStaking/KlimaFairLaunchStaking";
import {
  handleStakeCreated,
  handleStakeBurned,
  handleStakeClaimed,
} from "../src/klima-fair-launch-staking";
import { Stake, Wallet } from "../generated/schema";

const user = Address.fromString("0xca4793c93a94e7a70a4631b1cece6546e76eb19e");

// --- Helper functions to create mock events ---

function createStakeCreatedEvent(
  user: Address,
  amount: BigInt,
  multiplier: BigInt,
  startTimestamp: BigInt,
  txHash: Bytes
): StakeCreatedEvent {
  let event = changetype<StakeCreatedEvent>(newMockEvent());
  event.parameters = new Array();
  event.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  );
  event.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  );
  event.parameters.push(
    new ethereum.EventParam(
      "multiplier",
      ethereum.Value.fromUnsignedBigInt(multiplier)
    )
  );
  event.parameters.push(
    new ethereum.EventParam(
      "startTimestamp",
      ethereum.Value.fromUnsignedBigInt(startTimestamp)
    )
  );
  event.transaction.hash = txHash;
  return event;
}

function createStakeBurnedEvent(
  user: Address,
  burnAmount: BigInt,
  txHash: Bytes
): StakeBurnedEvent {
  let event = changetype<StakeBurnedEvent>(newMockEvent());
  event.parameters = new Array();
  event.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  );
  event.parameters.push(
    new ethereum.EventParam(
      "burnAmount",
      ethereum.Value.fromUnsignedBigInt(burnAmount)
    )
  );
  event.transaction.hash = txHash;
  return event;
}

function createStakeClaimedEvent(
  user: Address,
  klimaAllocation: BigInt,
  klimaXAllocation: BigInt,
  txHash: Bytes
): StakeClaimedEvent {
  let event = changetype<StakeClaimedEvent>(newMockEvent());
  event.parameters = new Array();
  event.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  );

  event.parameters.push(
    new ethereum.EventParam(
      "totalUserStaked",
      ethereum.Value.fromUnsignedBigInt(BigInt.zero())
    )
  );
  event.parameters.push(
    new ethereum.EventParam(
      "klimaAllocation",
      ethereum.Value.fromUnsignedBigInt(klimaAllocation)
    )
  );
  event.parameters.push(
    new ethereum.EventParam(
      "klimaXAllocation",
      ethereum.Value.fromUnsignedBigInt(klimaXAllocation)
    )
  );

  event.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(BigInt.zero())
    )
  );
  event.transaction.hash = txHash;
  return event;
}

function createStake(
  wallet: Wallet,
  amount: BigInt,
  multiplier: BigInt,
  startTimestamp: BigInt,
  txHash: Bytes
): Stake {
  let stake = new Stake(txHash);
  stake.wallet = wallet.id;
  stake.amount = amount;
  stake.multiplier = multiplier;
  stake.startTimestamp = startTimestamp;
  stake.stakeCreationHash = txHash;
  stake.save();
  return stake;
}

// --- Test: handleStakeCreated ---

// test("handleStakeCreated creates a wallet and stake", () => {
//   let amount = BigInt.fromI32(100);
//   let multiplier = BigInt.fromI32(2);
//   let startTimestamp = BigInt.fromI32(123456789);
//   let txHash = Bytes.fromHexString("0x01");

//   let event = createStakeCreatedEvent(
//     user,
//     amount,
//     multiplier,
//     startTimestamp,
//     txHash
//   );
//   handleStakeCreated(event);

//   assert.fieldEquals("Wallet", user.toHexString(), "totalStaked", "100");

//   assert.fieldEquals("Stake", txHash.toHexString(), "amount", "100");
//   assert.fieldEquals("Stake", txHash.toHexString(), "multiplier", "2");
//   assert.fieldEquals(
//     "Stake",
//     txHash.toHexString(),
//     "startTimestamp",
//     startTimestamp.toString()
//   );
//   assert.fieldEquals(
//     "Stake",
//     txHash.toHexString(),
//     "stakeCreationHash",
//     txHash.toHexString()
//   );
// });

// --- Test: handleStakeBurned (burn tokens from multiple stakes) ---

// test("handleStakeBurned burns stakes from newest to oldest", () => {
//   let wallet = new Wallet(user);
//   wallet.totalStaked = BigInt.fromI32(275);
//   wallet.klimaAllocation = BigInt.zero();
//   wallet.klimaXAllocation = BigInt.zero();
//   wallet.save();

//   let stake0 = createStake(
//     wallet,
//     BigInt.fromI32(50),
//     BigInt.fromI32(1),
//     BigInt.fromI32(1),
//     Bytes.fromHexString("0x10")
//   );

//   let stake1 = createStake(
//     wallet,
//     BigInt.fromI32(100),
//     BigInt.fromI32(1),
//     BigInt.fromI32(2),
//     Bytes.fromHexString("0x11")
//   );

//   let stake2 = createStake(
//     wallet,
//     BigInt.fromI32(25),
//     BigInt.fromI32(1),
//     BigInt.fromI32(3),
//     Bytes.fromHexString("0x12")
//   );

//   let stake3 = createStake(
//     wallet,
//     BigInt.fromI32(100),
//     BigInt.fromI32(1),
//     BigInt.fromI32(4),
//     Bytes.fromHexString("0x13")
//   );

//   // simulate a burn event of 200
//   let burnTxHash = Bytes.fromHexString("0x02");
//   let burnEvent = createStakeBurnedEvent(user, BigInt.fromI32(200), burnTxHash);
//   handleStakeBurned(burnEvent);

//   assert.fieldEquals("Stake", stake0.id.toHexString(), "amount", "50");
//   assert.fieldEquals("Stake", stake1.id.toHexString(), "amount", "25");
//   assert.fieldEquals("Stake", stake2.id.toHexString(), "amount", "0");
//   assert.fieldEquals("Stake", stake3.id.toHexString(), "amount", "0");

//   // The wallet's totalStaked should be reduced by 200, from 275 to 75.
//   assert.fieldEquals("Wallet", wallet.id.toHexString(), "totalStaked", "75");
// });



// test("handleStakeBurned logs error and does nothing when burn amount is zero", () => {
//   let burnTxHash = Bytes.fromHexString("0x03");
//   let burnEvent = createStakeBurnedEvent(user, BigInt.zero(), burnTxHash);


//   handleStakeBurned(burnEvent);


//   assert.notInStore("Wallet", user.toHexString());
// });



test("handleStakeClaimed updates allocations and stake amount", () => {

  let wallet = new Wallet(user);
  wallet.totalStaked = BigInt.fromI32(100);
  wallet.klimaAllocation = BigInt.fromI32(10);
  wallet.klimaXAllocation = BigInt.fromI32(20);
  wallet.save();

  let stake = new Stake(Bytes.fromHexString("0x14"));
  stake.wallet = wallet.id;
  stake.amount = BigInt.fromI32(100);
  stake.multiplier = BigInt.fromI32(1);
  stake.startTimestamp = BigInt.fromI32(1);
  stake.stakeCreationHash = Bytes.fromHexString("0x04");
  stake.save();

  // Create a StakeClaimed event with klimaAllocation = 30 and klimaXAllocation = 40.
  let claimedTxHash = Bytes.fromHexString("0x05");
  let claimedEvent = createStakeClaimedEvent(
    user,
    BigInt.fromI32(30),
    BigInt.fromI32(40),
    claimedTxHash
  );
  handleStakeClaimed(claimedEvent);

  // Expect the wallet's allocations to update:
  // klimaAllocation: 10 + 30 = 40, klimaXAllocation: 20 + 40 = 60.
  assert.fieldEquals(
    "Wallet",
    wallet.id.toHexString(),
    "klimaAllocation",
    "40"
  );
  assert.fieldEquals(
    "Wallet",
    wallet.id.toHexString(),
    "klimaXAllocation",
    "60"
  );

  // The mapping sets stake.amount first to klimaAllocation then to klimaXAllocation.
  // Final stake.amount is 40 (klimaXAllocation).
  assert.fieldEquals("Stake", stake.id.toHexString(), "amount", "40");
});

// // --- Test: handleStakeClaimed logs error when no stake or wallet exists ---

test("handleStakeClaimed logs error when stake or wallet not found", () => {
  let claimedTxHash = Bytes.fromHexString("0x06");
  let claimedEvent = createStakeClaimedEvent(
    user,
    BigInt.fromI32(30),
    BigInt.fromI32(40),
    claimedTxHash
  );

  // There is no wallet or stake stored for this user.
  handleStakeClaimed(claimedEvent);

  // Assert that neither Wallet nor Stake exists for user 5.
  assert.notInStore("Wallet", user.toHexString());
  assert.notInStore("Stake", user.toHexString());
});

// --- Clean up the store after tests ---
afterAll(() => {
  clearStore();
});
