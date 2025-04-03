import { log, BigInt } from "@graphprotocol/graph-ts";
import {
  StakeBurned as StakeBurnedEvent,
  StakeClaimed as StakeClaimedEvent,
  StakeCreated as StakeCreatedEvent,
} from "../generated/KlimaFairLaunchStaking/KlimaFairLaunchStaking";
import { Stake, Wallet } from "../generated/schema";
import { loadOrCreateWallet, loadWallet } from "./utils/utils";

export function handleStakeCreated(event: StakeCreatedEvent): void {
  let wallet = loadOrCreateWallet(event.params.user);
  wallet.totalStaked = wallet.totalStaked.plus(event.params.amountKlimaV0Staked);
  wallet.save();

  let stake = new Stake(event.transaction.hash);
  stake.wallet = wallet.id;
  stake.amount = event.params.amountKlimaV0Staked;
  stake.multiplier = event.params.multiplier;
  stake.startTimestamp = event.params.startTimestamp;
  stake.stakeCreationHash = event.transaction.hash;

  stake.save();
}

export function handleStakeBurned(event: StakeBurnedEvent): void {
  let burnAmount = event.params.amountKlimaV0Burned;

  if (burnAmount.isZero()) {
    log.error("Burn amount is zero for event: {}", [
      event.transaction.hash.toHexString(),
    ]);
    return;
  }

  let wallet = loadOrCreateWallet(event.params.user);
  wallet.totalStaked = wallet.totalStaked.minus(event.params.amountKlimaV0Burned);
  wallet.save();

  // Load all stakes for this wallet
  let userStakes: Stake[] = [];
  let stakes = wallet.stakes.load();
  
  for (let i = 0; i < stakes.length; i++) {
    let stake = Stake.load(stakes[i].id);
    if (stake) {
      // Debug log the stakes we're loading
      log.debug("Loading stake: {} with timestamp {}", [
        stake.id.toHexString(),
        stake.startTimestamp.toString()
      ]);
      userStakes.push(stake);
    }
  }
  
  // Sort by startTimestamp - NEWEST FIRST
  userStakes.sort((a, b) => {
    if (a.startTimestamp.gt(b.startTimestamp)) return -1;
    if (a.startTimestamp.lt(b.startTimestamp)) return 1;
    return 0;
  });

  // Debug log the sorted order
  for (let i = 0; i < userStakes.length; i++) {
    log.debug("Sorted stake {}: {} with timestamp {}", [
      i.toString(),
      userStakes[i].id.toHexString(),
      userStakes[i].startTimestamp.toString()
    ]);
  }

  // Process burns newest to oldest
  let remainingBurnAmount = burnAmount;
  for (let i = 0; i < userStakes.length; i++) {
    log.info("Processing stake: {}", [userStakes[i].id.toHexString()]);
    
    if (remainingBurnAmount.isZero()) {
      break;
    }

    let stakeBalance = userStakes[i].amount;
    if (stakeBalance.isZero()) {
      continue;
    }

    if (stakeBalance.ge(remainingBurnAmount)) {
      userStakes[i].amount = stakeBalance.minus(remainingBurnAmount);
      remainingBurnAmount = BigInt.zero();
    } else {
      userStakes[i].amount = BigInt.zero();
      remainingBurnAmount = remainingBurnAmount.minus(stakeBalance);
    }

    userStakes[i].save();
  }
}

export function handleStakeClaimed(event: StakeClaimedEvent): void {
  let wallet = loadWallet(event.params.user);
  if (!wallet) {
    log.error("Wallet not found for user: {}", [event.params.user.toHex()]);
    return;
  }

  wallet.klimaAllocation = event.params.klimaAllocation;
  wallet.klimaXAllocation = event.params.klimaXAllocation;
  wallet.totalStaked = event.params.totalUserStaked;

  wallet.save();
}
