import { request } from "graphql-request";
import { SUBGRAPH_URL } from "./constants";
import { unstable_cacheLife as cacheLife } from 'next/cache';

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
export const fetchUserStakes = async (address: string | null): Promise<{ stakes?: Stake[]; error?: string }> => {
  'use cache';

  cacheLife({ stale: 120, revalidate: 60, expire: 900 });

  if (!address) return { stakes: [] };

  try {
    const result = await request(
      SUBGRAPH_URL,
      `query ($address: String!) {
        stakes(first: 100, orderBy: startTimestamp, orderDirection: asc, where: { wallet: $address }) {
          id
          amount
          startTimestamp
          multiplier
        }
      }`,
      { address: address.toLowerCase() }
    );

    return result || { stakes: [] };
  } catch (error: any) {
    console.error('Error fetching user stakes:', error);
    let errorMessage = 'An error occurred while fetching stakes.';

    // Handle specific error codes
    if (error.response && error.response.errors) {
      const errorCode = error.response.errors[0].extensions.code;
      if (errorCode === '429') {
        errorMessage = 'Too many requests. Please try again later.';
      }
    }
    return { stakes: [], error: errorMessage }; // Return error message
  }
};

/**
 * Fetch the current leaderboard
 * @returns The leaderboard
 */
export const fetchLeaderboard = async (limit: number = 100): Promise<{ wallets?: Wallet[]; error?: string }> => {
  'use cache';

  cacheLife({ stale: 120, revalidate: 60, expire: 900 });

  try {
    const result = await request(
      SUBGRAPH_URL,
      `query ($limit: Int!) {
      wallets(first: $limit, orderBy: totalStaked, orderDirection: desc) {
        id
        totalStaked
      }
    }`,
      { limit: limit }
    );

    // stakes(first: 100) {
    //   id
    //   multiplier
    //   amount
    //   startTimestamp
    // }

    // after processing the leaderboard data, only ever return the top 100...
    // this should be processed in the background job...

    return result || { wallets: [] };

  } catch (error: any) {
    console.error('Error fetching user stakes:', error);
    let errorMessage = 'An error occurred while fetching stakes.';

    // Handle specific error codes
    if (error.response && error.response.errors) {
      const errorCode = error.response.errors[0].extensions.code;
      if (errorCode === '429') {
        errorMessage = 'Too many requests. Please try again later.';
      }
    }
    return { wallets: [], error: errorMessage }; // Return error message
  }
};
