import { newMockEvent } from "matchstick-as/assembly/index";
import { Stake, Wallet } from "../../generated/schema";
import {
  StakeCreated as StakeCreatedEvent,
  StakeBurned as StakeBurnedEvent,
  StakeClaimed as StakeClaimedEvent,
} from "../../generated/KlimaFairLaunchStaking/KlimaFairLaunchStaking";
import { Address, Bytes, ethereum, BigInt } from "@graphprotocol/graph-ts";

export function createStakeCreatedEvent(
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

export function createStakeBurnedEvent(
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

export function createStakeClaimedEvent(
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

export function createStake(
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
