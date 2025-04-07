import { request } from "graphql-request";
import { getConfig } from "./constants";

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

export const fetchLeaderboard = async (
  limit: number = 1000,
  retries: number = 3,
  delay: number = 1000
): Promise<{ wallets?: Wallet[]; error?: string }> => {
  const config = getConfig();
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await request(
        config.subgraphUrl,
        `query ($limit: Int!) {
          wallets(first: $limit, orderBy: totalStaked, orderDirection: desc) {
            id
            totalStaked,
            stakes (first: 100) {
              id
              amount
              startTimestamp
              multiplier
            }
          }
        }`,
        { limit: limit }
      );
      return result || { wallets: [] };
    } catch (error: any) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      if (attempt < retries - 1) {
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }
  const errorMessage = "An error occurred while fetching leaderboards after multiple attempts.";
  return { wallets: [], error: errorMessage };
};
