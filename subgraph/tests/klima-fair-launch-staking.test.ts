import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { BurnVaultSet } from "../generated/schema"
import { BurnVaultSet as BurnVaultSetEvent } from "../generated/KlimaFairLaunchStaking/KlimaFairLaunchStaking"
import { handleBurnVaultSet } from "../src/klima-fair-launch-staking"
import { createBurnVaultSetEvent } from "./klima-fair-launch-staking-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let burnVault = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newBurnVaultSetEvent = createBurnVaultSetEvent(burnVault)
    handleBurnVaultSet(newBurnVaultSetEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("BurnVaultSet created and stored", () => {
    assert.entityCount("BurnVaultSet", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "BurnVaultSet",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "burnVault",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
