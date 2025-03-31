// // app/api/data/route.js
// import { NextResponse } from 'next/server';
// import { waitUntil } from '@vercel/functions';
// import { calculateLeaderboardPoints } from '@actions/leaderboards-action';

// const cache = new Map(); // Simple in-memory cache
// const CACHE_EXPIRATION_TIME = 2 * 60 * 1000; // 2 minutes in milliseconds
// let isProcessing = false;

// // vercel cron job...
// // every 5 minutes call the function and update the cach

// export async function GET() {
//   const cacheKey = 'leaderboards';
//   const cachedData = await getFromCache(cacheKey); // Function to get data from cache
//   console.log('cachedData', cachedData);

//   if (cachedData) {
//     console.log('inside cachedData', cachedData);
//     return NextResponse.json({ data: cachedData.data }); // Return cached data if available
//   }

//   console.log('isProcessing', isProcessing);

//   if (!isProcessing) {
//     isProcessing = true; // Set the processing flag
//     waitUntil(processDataAndCache(cacheKey)); // Process data in the background
//   }

//   return NextResponse.json({ data: cachedData }, { status: 202 }); // Inform user
// }

// // Function to process data and update cache
// async function processDataAndCache(cacheKey: string) {
//   const processedData = await processData(); // Your data processing logic here
//   console.log('processedData', processedData);
//   await updateCache(cacheKey, processedData); // Function to update cache
//   isProcessing = false;
// }

// // Function to get data from cache
// async function getFromCache(key: string) {
//   const cachedEntry = cache.get(key); // Retrieve data from in-memory cache
//   if (cachedEntry) {
//     const { data, timestamp } = cachedEntry;
//     // Check if the cache is still valid
//     if (Date.now() - timestamp < CACHE_EXPIRATION_TIME) {
//       return { data }; // Return cached data if still valid
//     }
//   }
//   return null; // Cache is expired or doesn't exist
// }

// // Function to update cache
// async function updateCache(key: string, data: any) {
//   cache.set(key, { data, timestamp: Date.now() }); // Update in-memory cache with timestamp
// }

// // Function to process data
// async function processData() {
//   const leaderboardData = await calculateLeaderboardPoints(100);
//   console.log('leaderboardData', leaderboardData);
//   const serializedData = leaderboardData.map(item => {
//     return {
//       ...item,
//       totalStaked: Number(item.totalStaked), // Convert BigInt to string
//       totalPoints: Number(item.totalPoints), // Convert BigInt to string
//       // Add more fields as necessary
//     };
//   });
//   // Simulate a long-running process
//   console.log('serializedData', serializedData);
//   return serializedData;
// }

import { NextResponse } from 'next/server';
import { cacheManager } from '@utils/cache'; // Import the cache manager

export async function GET() {
  const cacheKey = 'leaderboards';
  const cachedData = cacheManager.get(cacheKey);

  if (cachedData) {
    return NextResponse.json({ ...cachedData.data }); // Return cached data if available
  }

  return NextResponse.json({
    message: 'No data available, please check back later.'
  }, { status: 404 }); // Inform user that no data is available
}