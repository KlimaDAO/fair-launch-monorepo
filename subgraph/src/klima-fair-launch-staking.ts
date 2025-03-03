import { log, BigInt } from "@graphprotocol/graph-ts";
import {
  StakeBurned as StakeBurnedEvent,
  StakeClaimed as StakeClaimedEvent,
  StakeCreated as StakeCreatedEvent,
} from "../generated/KlimaFairLaunchStaking/KlimaFairLaunchStaking";
import { Stake, Wallet } from "../generated/schema";
import { loadOrCreateWallet } from "./utils/utils";

export function handleStakeCreated(event: StakeCreatedEvent): void {
  log.info("user: {}", [event.params.user.toHexString()]);
  let wallet = loadOrCreateWallet(event.params.user);
  wallet.totalStaked = wallet.totalStaked.plus(event.params.amount);
  wallet.save();

  let stake = new Stake(event.transaction.hash);
  stake.wallet = wallet.id;
  stake.amount = event.params.amount;
  stake.multiplier = event.params.multiplier;
  stake.startTimestamp = event.params.startTimestamp;
  stake.stakeCreationHash = event.transaction.hash;

  stake.save();
}

export function handleStakeBurned(event: StakeBurnedEvent): void {
  let burnAmount = event.params.burnAmount;

  if (burnAmount.isZero()) {
    log.error("Burn amount is zero for event: {}", [
      event.transaction.hash.toHexString(),
    ]);
    return;
  }

  let wallet = Wallet.load(event.params.user);
  if (!wallet) {
    log.error("Wallet not found for use in burned event: {}", [
      event.transaction.hash.toHexString(),
    ]);
    return;
  }

  wallet.totalStaked = wallet.totalStaked.minus(event.params.burnAmount);
  wallet.save();

  let stakeRefs = wallet.stakes.load();

  let userStakes: Stake[] = [];
  for (let i = 0; i < stakeRefs.length; i++) {
    let stake = Stake.load(stakeRefs[i].id);
    if (stake) {
      userStakes.push(stake);
    }
  }

  // ensure correct order
  userStakes.sort((a, b) => {
    if (a.startTimestamp.gt(b.startTimestamp)) return -1;
    if (a.startTimestamp.lt(b.startTimestamp)) return 1;
    return 0;
  });

  for (let i = 0; i < userStakes.length; i++) {
    if (burnAmount.isZero()) {
      break;
    }

    let stakeEntity = userStakes[i];

    let stakeBalance = stakeEntity.amount;
    if (stakeBalance.isZero()) {
      continue;
    }

    if (stakeBalance.ge(burnAmount)) {
      stakeEntity.amount = stakeBalance.minus(burnAmount);
      burnAmount = BigInt.zero();
    } else {
      stakeEntity.amount = BigInt.zero();
      burnAmount = burnAmount.minus(stakeBalance);
    }

    stakeEntity.save();
  }
}

export function handleStakeClaimed(event: StakeClaimedEvent): void {
  let stake = Stake.load(event.transaction.hash);
  if (!stake) {
    log.error("Stake not found for user: {}", [event.params.user.toHex()]);
    return;
  }

  stake.amount = event.params.klimaAllocation;
  stake.amount = event.params.klimaXAllocation;
  stake.save();

  let wallet = Wallet.load(event.params.user);
  if (!wallet) {
    log.error("Wallet not found for user: {}", [event.params.user.toHex()]);
    return;
  }

  wallet.klimaAllocation = wallet.klimaAllocation.plus(
    event.params.klimaAllocation
  );
  wallet.klimaXAllocation = wallet.klimaXAllocation.plus(
    event.params.klimaXAllocation
  );
  wallet.save();
}
