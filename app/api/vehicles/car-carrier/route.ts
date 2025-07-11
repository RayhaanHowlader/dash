export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { connectToMongoDatabase } from '@/lib/mongodb';
import Vehicle from '@/models/Vehicle';

export async function GET() {
  try {
    await connectToMongoDatabase();

    const vehicles = await Vehicle.find({ type: 'Car Carrier' })
      .select('registrationNumber status driver lastMaintenance nextMaintenance')
      .sort({ registrationNumber: 1 });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Error fetching Car Carrier vehicles:', error);
    return NextResponse.json(
      { error: 'Network Issue' },
      { status: 500 }
    );
  }
} 