import { log, BigInt } from "@graphprotocol/graph-ts";
import {
  StakeBurned as StakeBurnedEvent,
  StakeClaimed as StakeClaimedEvent,
  StakeCreated as StakeCreatedEvent,
} from "../generated/KlimaFairLaunchStaking/KlimaFairLaunchStaking";
import { Stake } from "../generated/schema";
import { loadOrCreateWallet } from "./utils/utils";

export function handleStakeCreated(event: StakeCreatedEvent): void {
  let wallet = loadOrCreateWallet(event.params.user);
  wallet.totalStaked = wallet.totalStaked.plus(event.params.amount);
  wallet.save();

  let stake = new Stake(wallet.id);
  stake.wallet = wallet.id;
  stake.amount = event.params.amount;
  stake.multiplier = event.params.multiplier;
  stake.startTimestamp = event.params.startTimestamp;
  stake.stakeCreationHash = event.transaction.hash;

  stake.save();
}

export function handleStakeBurned(event: StakeBurnedEvent): void {
  let burnAmount = event.params.burnAmount;

  let wallet = loadOrCreateWallet(event.params.user);

  wallet.totalStaked = wallet.totalStaked.minus(event.params.burnAmount);
  wallet.save();

  let stakeIds = wallet.stakes.load();

  let allStakes: Stake[] = [];

  for (let i = 0; i < stakeIds.length; i++) {
    let stake = Stake.load(stakeIds[i].id);
    if (stake) {
      allStakes.push(stake);
    }
  }

  let remainingBurnAmount = burnAmount;
  for (let i = allStakes.length - 1; i >= 0; i--) {
    let stake = allStakes[i];
    if (stake.amount.equals(BigInt.fromI32(0))) {
      return;
    } else {
      if (stake.amount.gt(remainingBurnAmount)) {
        stake.amount = stake.amount.minus(remainingBurnAmount);
        remainingBurnAmount = BigInt.fromI32(0);
      } else {
        remainingBurnAmount = remainingBurnAmount.minus(stake.amount);
        stake.amount = BigInt.fromI32(0);
      }
      stake.save();
    }
  }
}

export function handleStakeClaimed(event: StakeClaimedEvent): void {
  let stake = Stake.load(event.params.user);
  if (!stake) {
    log.error("Stake not found for user: {}", [event.params.user.toHex()]);
    return;
  }
  stake.amount = event.params.klimaAllocation;
  stake.amount = event.params.klimaXAllocation;
  stake.save();
}
