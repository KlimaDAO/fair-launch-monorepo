import { request } from "graphql-request";
import { SUBGRAPH_URL } from "./constants";

export interface Stake {
  id: string;
  amount: string;
  multiplier: string;
  startTimestamp: string;
  stakeCreationHash: string;
}

export interface Wallet {
  id: string;
  klimaAllocation: string;
  klimaXAllocation: string;
  totalStaked: string;
  stakes: Stake[];
}

/**
 * Fetch user stakes  
 * @param address - The address of the user
 * @returns The user stakes
 */
export const fetchUserStakes = async (address: string): Promise<{ stakes?: Stake[] }> =>
  await request(
    SUBGRAPH_URL,
    `query ($address: String!) {
      stakes(first: 100, orderBy: startTimestamp, orderDirection: desc, where: { wallet: $address }) {
        id
        amount
        startTimestamp
        stakeCreationHash
        multiplier
      }
    }`,
    { address: address.toLowerCase() }
  );

/**
 * Fetch the current leaderboard
 * @returns The leaderboard
 */
export const fetchLeaderboard = async (limit: number = 100): Promise<{ wallets: Wallet[] }> =>
  await request(
    SUBGRAPH_URL,
    `query ($limit: Int!) {
      wallets(first: $limit, orderBy: totalStaked, orderDirection: desc) {
        id
        klimaAllocation
        klimaXAllocation
        totalStaked
        stakes(first: 100) {
          id
          multiplier
          amount
          startTimestamp
          stakeCreationHash
        }
      }
    }`,
    { limit: limit }
  );
