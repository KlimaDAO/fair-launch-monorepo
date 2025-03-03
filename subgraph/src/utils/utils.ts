import { Bytes, BigInt } from "@graphprotocol/graph-ts";
import { Stake, Wallet } from "../../generated/schema";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function loadOrCreateWallet(address: Bytes): Wallet {
  let wallet = Wallet.load(address);
  if (!wallet) {
    wallet = new Wallet(address);
    wallet.totalStaked = BigInt.fromI32(0);
    wallet.klimaAllocation = BigInt.fromI32(0);
    wallet.klimaXAllocation = BigInt.fromI32(0);
  }
  return wallet;
}

