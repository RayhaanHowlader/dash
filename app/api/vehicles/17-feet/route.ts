export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { connectToMongoDatabase } from '@/lib/mongodb';
import Vehicle from '@/models/Vehicle';

export async function GET() {
  try {
    await connectToMongoDatabase();

    const vehicles = await Vehicle.find({ type: '17 Feet' })
      .select('registrationNumber status driver lastMaintenance nextMaintenance')
      .sort({ registrationNumber: 1 });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Error fetching 17 Feet vehicles:', error);
    return NextResponse.json(
      { error: 'network Issue' },
      { status: 500 }
    );
  }
} 