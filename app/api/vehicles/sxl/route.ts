import { NextResponse } from 'next/server';
import { connectToMongoDatabase } from '@/lib/mongodb';
import Vehicle from '@/models/Vehicle';

export async function GET() {
  try {
    await connectToMongoDatabase();

    const vehicles = await Vehicle.find({ type: 'SXL' })
      .select('registrationNumber status driver lastMaintenance nextMaintenance')
      .sort({ registrationNumber: 1 });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Error fetching SXL vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SXL vehicles' },
      { status: 500 }
    );
  }
} 