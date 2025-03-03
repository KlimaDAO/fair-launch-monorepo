import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  BurnVaultSet,
  FinalizationComplete,
  GrowthRateSet,
  Initialized,
  KlimaSupplySet,
  KlimaXSupplySet,
  OwnershipTransferred,
  Paused,
  StakeBurned,
  StakeClaimed,
  StakeCreated,
  StakingEnabled,
  StakingExtended,
  TokenAddressesSet,
  Unpaused,
  Upgraded
} from "../generated/KlimaFairLaunchStaking/KlimaFairLaunchStaking"

export function createBurnVaultSetEvent(burnVault: Address): BurnVaultSet {
  let burnVaultSetEvent = changetype<BurnVaultSet>(newMockEvent())

  burnVaultSetEvent.parameters = new Array()

  burnVaultSetEvent.parameters.push(
    new ethereum.EventParam("burnVault", ethereum.Value.fromAddress(burnVault))
  )

  return burnVaultSetEvent
}

export function createFinalizationCompleteEvent(): FinalizationComplete {
  let finalizationCompleteEvent = changetype<FinalizationComplete>(
    newMockEvent()
  )

  finalizationCompleteEvent.parameters = new Array()

  return finalizationCompleteEvent
}

export function createGrowthRateSetEvent(newValue: BigInt): GrowthRateSet {
  let growthRateSetEvent = changetype<GrowthRateSet>(newMockEvent())

  growthRateSetEvent.parameters = new Array()

  growthRateSetEvent.parameters.push(
    new ethereum.EventParam(
      "newValue",
      ethereum.Value.fromUnsignedBigInt(newValue)
    )
  )

  return growthRateSetEvent
}

export function createInitializedEvent(version: BigInt): Initialized {
  let initializedEvent = changetype<Initialized>(newMockEvent())

  initializedEvent.parameters = new Array()

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(version)
    )
  )

  return initializedEvent
}

export function createKlimaSupplySetEvent(newValue: BigInt): KlimaSupplySet {
  let klimaSupplySetEvent = changetype<KlimaSupplySet>(newMockEvent())

  klimaSupplySetEvent.parameters = new Array()

  klimaSupplySetEvent.parameters.push(
    new ethereum.EventParam(
      "newValue",
      ethereum.Value.fromUnsignedBigInt(newValue)
    )
  )

  return klimaSupplySetEvent
}

export function createKlimaXSupplySetEvent(newValue: BigInt): KlimaXSupplySet {
  let klimaXSupplySetEvent = changetype<KlimaXSupplySet>(newMockEvent())

  klimaXSupplySetEvent.parameters = new Array()

  klimaXSupplySetEvent.parameters.push(
    new ethereum.EventParam(
      "newValue",
      ethereum.Value.fromUnsignedBigInt(newValue)
    )
  )

  return klimaXSupplySetEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  )

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPausedEvent(account: Address): Paused {
  let pausedEvent = changetype<Paused>(newMockEvent())

  pausedEvent.parameters = new Array()

  pausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return pausedEvent
}

export function createStakeBurnedEvent(
  user: Address,
  burnAmount: BigInt,
  timestamp: BigInt
): StakeBurned {
  let stakeBurnedEvent = changetype<StakeBurned>(newMockEvent())

  stakeBurnedEvent.parameters = new Array()

  stakeBurnedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  stakeBurnedEvent.parameters.push(
    new ethereum.EventParam(
      "burnAmount",
      ethereum.Value.fromUnsignedBigInt(burnAmount)
    )
  )
  stakeBurnedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return stakeBurnedEvent
}

export function createStakeClaimedEvent(
  user: Address,
  totalUserStaked: BigInt,
  klimaAllocation: BigInt,
  klimaXAllocation: BigInt,
  timestamp: BigInt
): StakeClaimed {
  let stakeClaimedEvent = changetype<StakeClaimed>(newMockEvent())

  stakeClaimedEvent.parameters = new Array()

  stakeClaimedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  stakeClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "totalUserStaked",
      ethereum.Value.fromUnsignedBigInt(totalUserStaked)
    )
  )
  stakeClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "klimaAllocation",
      ethereum.Value.fromUnsignedBigInt(klimaAllocation)
    )
  )
  stakeClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "klimaXAllocation",
      ethereum.Value.fromUnsignedBigInt(klimaXAllocation)
    )
  )
  stakeClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return stakeClaimedEvent
}

export function createStakeCreatedEvent(
  user: Address,
  amount: BigInt,
  multiplier: BigInt,
  startTimestamp: BigInt
): StakeCreated {
  let stakeCreatedEvent = changetype<StakeCreated>(newMockEvent())

  stakeCreatedEvent.parameters = new Array()

  stakeCreatedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  stakeCreatedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  stakeCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "multiplier",
      ethereum.Value.fromUnsignedBigInt(multiplier)
    )
  )
  stakeCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "startTimestamp",
      ethereum.Value.fromUnsignedBigInt(startTimestamp)
    )
  )

  return stakeCreatedEvent
}

export function createStakingEnabledEvent(
  startTimestamp: BigInt,
  freezeTimestamp: BigInt
): StakingEnabled {
  let stakingEnabledEvent = changetype<StakingEnabled>(newMockEvent())

  stakingEnabledEvent.parameters = new Array()

  stakingEnabledEvent.parameters.push(
    new ethereum.EventParam(
      "startTimestamp",
      ethereum.Value.fromUnsignedBigInt(startTimestamp)
    )
  )
  stakingEnabledEvent.parameters.push(
    new ethereum.EventParam(
      "freezeTimestamp",
      ethereum.Value.fromUnsignedBigInt(freezeTimestamp)
    )
  )

  return stakingEnabledEvent
}

export function createStakingExtendedEvent(
  oldFreezeTimestamp: BigInt,
  newFreezeTimestamp: BigInt
): StakingExtended {
  let stakingExtendedEvent = changetype<StakingExtended>(newMockEvent())

  stakingExtendedEvent.parameters = new Array()

  stakingExtendedEvent.parameters.push(
    new ethereum.EventParam(
      "oldFreezeTimestamp",
      ethereum.Value.fromUnsignedBigInt(oldFreezeTimestamp)
    )
  )
  stakingExtendedEvent.parameters.push(
    new ethereum.EventParam(
      "newFreezeTimestamp",
      ethereum.Value.fromUnsignedBigInt(newFreezeTimestamp)
    )
  )

  return stakingExtendedEvent
}

export function createTokenAddressesSetEvent(
  klima: Address,
  klimax: Address
): TokenAddressesSet {
  let tokenAddressesSetEvent = changetype<TokenAddressesSet>(newMockEvent())

  tokenAddressesSetEvent.parameters = new Array()

  tokenAddressesSetEvent.parameters.push(
    new ethereum.EventParam("klima", ethereum.Value.fromAddress(klima))
  )
  tokenAddressesSetEvent.parameters.push(
    new ethereum.EventParam("klimax", ethereum.Value.fromAddress(klimax))
  )

  return tokenAddressesSetEvent
}

export function createUnpausedEvent(account: Address): Unpaused {
  let unpausedEvent = changetype<Unpaused>(newMockEvent())

  unpausedEvent.parameters = new Array()

  unpausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return unpausedEvent
}

export function createUpgradedEvent(implementation: Address): Upgraded {
  let upgradedEvent = changetype<Upgraded>(newMockEvent())

  upgradedEvent.parameters = new Array()

  upgradedEvent.parameters.push(
    new ethereum.EventParam(
      "implementation",
      ethereum.Value.fromAddress(implementation)
    )
  )

  return upgradedEvent
}
