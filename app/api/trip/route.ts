import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    // Connect to MongoDB database
    const mongoose = await connectToMongoDatabase();
    
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    
    // List all collections to verify trip collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Check if trip collection exists
    const tripCollection = collections.find(c => c.name === 'trip');
    if (!tripCollection) {
      return NextResponse.json(
        { status: 'error', message: 'Trip collection not found' },
        { status: 404 }
      );
    }
    
    const url = new URL(req.url);
    const vehicleNumber = url.searchParams.get('vehicleNumber');
    
    if (!vehicleNumber) {
      return NextResponse.json(
        { status: 'error', message: 'Vehicle number is required' },
        { status: 400 }
      );
    }
    
    // Fetch all trips for this vehicle, sorted by most recent first
    const trips = await mongoose.connection.db.collection('trip')
      .find({ vehicleNumber })
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json({
      status: 'success',
      data: trips
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch trip', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 