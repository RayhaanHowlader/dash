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
    const vname = searchParams.get('vname');

    if (!vname) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Vehicle number (vname) is required',
        },
        { status: 400 },
      );
    }

    await connectToMongoDatabase();

    // Find the latest waypoint for the vehicle directly
    const waypoint = (await Waypoint.findOne({ vname })
      .sort({ dttime: -1 })
      .select('dttime Haltinghours vname lat lngt name fullAddress')
      .lean()) as unknown as WaypointDoc | null;

    if (!waypoint) {
      return NextResponse.json(
        {
          status: 'success',
          data: {
            waypoints: [{
              dttime: new Date(),
              haltingHours: 0,
              vname: vname,
              lat: null,
              lngt: null,
              name: '',
              fullAddress: ''
            }]
          }
        }
      );
    }

    // Return the halting hours data
    return NextResponse.json({
      status: 'success',
      data: {
        waypoints: [{
          dttime: waypoint.dttime,
          haltingHours: waypoint.Haltinghours,
          vname: waypoint.vname,
          lat: waypoint.lat,
          lngt: waypoint.lngt,
          name: waypoint.name,
          fullAddress: waypoint.fullAddress
        }]
      }
    });

  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'An unexpected error occurred while fetching halting hours',
      },
      { status: 500 },
    );
  }
} 