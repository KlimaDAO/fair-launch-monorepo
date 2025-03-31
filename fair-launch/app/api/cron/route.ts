import { waitUntil } from '@vercel/functions';
import { NextResponse } from 'next/server';
import { cacheManager } from '@utils/cache';
import { calculateLeaderboardPoints } from '@actions/leaderboards-action';

export async function GET() {
  const cacheKey = 'leaderboards';
  waitUntil(processDataAndCache(cacheKey));
  return NextResponse.json({ message: 'Data processing started.' });
}

async function processDataAndCache(cacheKey: string) {
  const processedData = await processData();
  console.log('processedData', processedData);
  await updateCache(cacheKey, processedData);
}

async function updateCache(key: string, data: any) {
  cacheManager.update(key, { data, timestamp: Date.now() });
}

async function processData() {
  const leaderboardData = await calculateLeaderboardPoints(100);
  const serializedData = leaderboardData.map(item => {
    return {
      ...item,
      totalStaked: Number(item.totalStaked),
      totalPoints: Number(item.totalPoints),
    };
  });
  return serializedData;
}