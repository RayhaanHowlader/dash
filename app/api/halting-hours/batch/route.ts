import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

interface WaypointDoc {
  dttime: Date;
  Haltinghours: number;
  vname: string;
  lat: number | null;
  lngt: number | null;
  name: string;
  fullAddress: string;
}

// Define the waypoint schema and model directly
const waypointSchema = new mongoose.Schema({
  vname: String,
  dttime: Date,
  Haltinghours: Number,
  lat: Number,
  lngt: Number,
  name: String,
  fullAddress: String
});

// Create the model with explicit collection name
const Waypoint = mongoose.models.waypoint || mongoose.model('waypoint', waypointSchema, 'waypoint');

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vnamesStr = searchParams.get('vnames');

    if (!vnamesStr) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Vehicle numbers (vnames) parameter is required',
        },
        { status: 400 },
      );
    }

    const vnames = vnamesStr.split(',');
    
    await connectToMongoDatabase();

    // Create an aggregation pipeline to find the latest waypoint for each vehicle
    const waypoints = await Waypoint.aggregate([
      // Match documents for the requested vehicle names
      { $match: { vname: { $in: vnames } } },
      // Sort by vehicle name and date (descending)
      { $sort: { vname: 1, dttime: -1 } },
      // Group by vehicle name and take the first document (most recent)
      { 
        $group: {
          _id: "$vname",
          dttime: { $first: "$dttime" },
          haltingHours: { $first: "$Haltinghours" },
          vname: { $first: "$vname" },
          lat: { $first: "$lat" },
          lngt: { $first: "$lngt" },
          name: { $first: "$name" },
          fullAddress: { $first: "$fullAddress" }
        }
      }
    ]);

    // Create a map of the results
    const waypointsMap = waypoints.reduce((acc: Record<string, any>, waypoint) => {
      acc[waypoint.vname] = {
        dttime: waypoint.dttime,
        haltingHours: waypoint.haltingHours,
        vname: waypoint.vname,
        lat: waypoint.lat,
        lngt: waypoint.lngt,
        name: waypoint.name,
        fullAddress: waypoint.fullAddress
      };
      return acc;
    }, {});

    // Add empty entries for vehicles that don't have waypoints
    vnames.forEach(vname => {
      if (!waypointsMap[vname]) {
        waypointsMap[vname] = {
          dttime: new Date(),
          haltingHours: 0,
          vname: vname,
          lat: null,
          lngt: null,
          name: '',
          fullAddress: ''
        };
      }
    });

    // Return the halting hours data
    return NextResponse.json({
      status: 'success',
      data: waypointsMap
    });

  } catch (error) {
    console.error('Error in batch halting hours:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'An unexpected error occurred while fetching halting hours',
      },
      { status: 500 },
    );
  }
} 