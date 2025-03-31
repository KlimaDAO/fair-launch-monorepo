import { NextResponse, NextRequest } from 'next/server';
import { calculateLeaderboardPoints } from '@actions/leaderboards-action';
import { waitUntil } from '@vercel/functions';
// import { cache } from '@utils/cache';
import { cacheManager } from '@utils/cache'; // Import the cache manager

export async function GET(req: NextRequest) {
  const cacheKey = 'leaderboards';
  // @todo - add CRON SECRET
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized', status: 401 });
  }

  waitUntil(processDataAndCache(cacheKey)); // Call the function to process data and update cache
  return NextResponse.json({ message: 'Data processing started.' });
}

async function processDataAndCache(cacheKey: string) {
  const processedData = await processData(); // Your data processing logic here
  console.log('processedData', processedData);
  await updateCache(cacheKey, processedData); // Function to update cache
}

// Function to update cache
async function updateCache(key: string, data: any) {
  cacheManager.update(key, { data, timestamp: Date.now() }); // Update in-memory cache with timestamp
}

// Function to process data
async function processData() {
  const leaderboardData = await calculateLeaderboardPoints(100);
  const serializedData = leaderboardData.map(item => {
    return {
      ...item,
      totalStaked: Number(item.totalStaked),
      totalPoints: Number(item.totalPoints),
    };
  });
  // Simulate a long-running process
  console.log('serializedData', serializedData);
  return serializedData;
}