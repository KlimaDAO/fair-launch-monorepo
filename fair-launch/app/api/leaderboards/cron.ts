import { NextResponse, NextRequest } from 'next/server';
import { processDataAndCache } from './route'; // Import the function to process data

export async function GET(req: NextRequest) {
  const cacheKey = 'leaderboards';

  // @todo - add CRON SECRET
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized', status: 401 });
  }

  await processDataAndCache(cacheKey); // Call the function to process data and update cache
  return NextResponse.json({ message: 'Data processing started.' });
}