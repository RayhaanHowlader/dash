export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/db';

export async function GET() {
  const client = await getMongoClient();
  console.log('MongoDB connected:', !!client);

  try {
    const db = client.db();
    const collection = db.collection('vehicle');
    // Aggregate available vehicles by vehicleGroup
    const result = await collection.aggregate([
      { $match: { currentTripStatus: 'available' } },
      { $group: { _id: '$vehicleGroup', count: { $sum: 1 } } },
    ]).toArray();
    console.log('Aggregate result:', result);

    // Convert aggregation result to object: { group: count, ... }
    const groupCounts: Record<string, number> = {};
    result.forEach((item: any) => {
      groupCounts[item._id || 'Unknown'] = item.count;
    });

    return NextResponse.json({ status: 'success', data: groupCounts });
  } catch (error) {
    let errMsg = '';
    if (error instanceof Error) {
      errMsg = error.message;
    } else {
      errMsg = String(error);
    }
    console.error('Error in /api/vehicles/available:', errMsg);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch available vehicles', error: errMsg });
  }
}
