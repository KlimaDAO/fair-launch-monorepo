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
  let allWallets: Wallet[] = [];
  let page = 1;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      while (true) {
        const result = await request(
          config.subgraphUrl,
          `query ($limit: Int!, $skip: Int!) {
            wallets(first: $limit, skip: $skip, orderBy: totalStaked, orderDirection: desc) {
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
          { limit: limit, skip: (page - 1) * limit }
        ) as { wallets: Wallet[] };

        if (!result.wallets || result.wallets.length === 0) {
          break;
        }

        allWallets = allWallets.concat(result.wallets);
        console.log(`Fetched ${result.wallets.length} wallets from page ${page}.`);
        page++;
      }
      break;
    } catch (error: any) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      if (attempt < retries - 1) {
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }
  return { wallets: allWallets };
};