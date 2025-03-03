import {
  BurnVaultSet as BurnVaultSetEvent,
  FinalizationComplete as FinalizationCompleteEvent,
  GrowthRateSet as GrowthRateSetEvent,
  Initialized as InitializedEvent,
  KlimaSupplySet as KlimaSupplySetEvent,
  KlimaXSupplySet as KlimaXSupplySetEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Paused as PausedEvent,
  StakeBurned as StakeBurnedEvent,
  StakeClaimed as StakeClaimedEvent,
  StakeCreated as StakeCreatedEvent,
  StakingEnabled as StakingEnabledEvent,
  StakingExtended as StakingExtendedEvent,
  TokenAddressesSet as TokenAddressesSetEvent,
  Unpaused as UnpausedEvent,
  Upgraded as UpgradedEvent
} from "../generated/KlimaFairLaunchStaking/KlimaFairLaunchStaking"
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
} from "../generated/schema"

export function handleBurnVaultSet(event: BurnVaultSetEvent): void {
  let entity = new BurnVaultSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.burnVault = event.params.burnVault

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFinalizationComplete(
  event: FinalizationCompleteEvent
): void {
  let entity = new FinalizationComplete(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleGrowthRateSet(event: GrowthRateSetEvent): void {
  let entity = new GrowthRateSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.newValue = event.params.newValue

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleKlimaSupplySet(event: KlimaSupplySetEvent): void {
  let entity = new KlimaSupplySet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.newValue = event.params.newValue

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleKlimaXSupplySet(event: KlimaXSupplySetEvent): void {
  let entity = new KlimaXSupplySet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.newValue = event.params.newValue

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePaused(event: PausedEvent): void {
  let entity = new Paused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleStakeBurned(event: StakeBurnedEvent): void {
  let entity = new StakeBurned(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.burnAmount = event.params.burnAmount
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleStakeClaimed(event: StakeClaimedEvent): void {
  let entity = new StakeClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.totalUserStaked = event.params.totalUserStaked
  entity.klimaAllocation = event.params.klimaAllocation
  entity.klimaXAllocation = event.params.klimaXAllocation
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleStakeCreated(event: StakeCreatedEvent): void {
  let entity = new StakeCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.amount = event.params.amount
  entity.multiplier = event.params.multiplier
  entity.startTimestamp = event.params.startTimestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleStakingEnabled(event: StakingEnabledEvent): void {
  let entity = new StakingEnabled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.startTimestamp = event.params.startTimestamp
  entity.freezeTimestamp = event.params.freezeTimestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleStakingExtended(event: StakingExtendedEvent): void {
  let entity = new StakingExtended(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldFreezeTimestamp = event.params.oldFreezeTimestamp
  entity.newFreezeTimestamp = event.params.newFreezeTimestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTokenAddressesSet(event: TokenAddressesSetEvent): void {
  let entity = new TokenAddressesSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.klima = event.params.klima
  entity.klimax = event.params.klimax

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUnpaused(event: UnpausedEvent): void {
  let entity = new Unpaused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUpgraded(event: UpgradedEvent): void {
  let entity = new Upgraded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.implementation = event.params.implementation

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
