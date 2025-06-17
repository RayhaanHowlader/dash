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
    const vehicleNumbersStr = url.searchParams.get('vehicleNumbers');
    
    if (!vehicleNumbersStr) {
      return NextResponse.json(
        { status: 'error', message: 'Vehicle numbers parameter is required' },
        { status: 400 }
      );
    }
    
    const vehicleNumbers = vehicleNumbersStr.split(',');
    
    // Create an aggregation pipeline to get the latest trips for each vehicle
    const trips = await mongoose.connection.db.collection('trip')
      .aggregate([
        // Match documents for the requested vehicle numbers
        { $match: { vehicleNumber: { $in: vehicleNumbers } } },
        // Sort by vehicle number and createdAt (descending)
        { $sort: { vehicleNumber: 1, createdAt: -1 } },
        // Group by vehicle number
        {
          $group: {
            _id: "$vehicleNumber",
            trips: { $push: "$$ROOT" }
          }
        },
        // Limit to at most 5 trips per vehicle
        {
          $project: {
            _id: 0,
            vehicleNumber: "$_id",
            trips: { $slice: ["$trips", 5] } // Get up to 5 most recent trips
          }
        }
      ])
      .toArray();
    
    // Convert the results to a map for easier access
    const tripsMap = trips.reduce((acc: Record<string, any[]>, item) => {
      acc[item.vehicleNumber] = item.trips;
      return acc;
    }, {});
    
    // Add empty arrays for vehicles without trips
    vehicleNumbers.forEach(vehicleNumber => {
      if (!tripsMap[vehicleNumber]) {
        tripsMap[vehicleNumber] = [];
      }
    });
    
    return NextResponse.json({
      status: 'success',
      data: tripsMap
    });
  } catch (error) {
    console.error('Error in batch trip retrieval:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch trips', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 