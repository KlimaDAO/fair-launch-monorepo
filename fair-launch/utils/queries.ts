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
  limit: number = 100
): Promise<{ wallets?: Wallet[]; error?: string }> => {
  const config = getConfig();
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
    console.error("Error fetching user leaderboards:", error);
    const errorMessage = "An error occurred while fetching leaderboards.";
    return { wallets: [], error: errorMessage };
  }
};
