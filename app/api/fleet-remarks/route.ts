export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDatabase } from '../../../lib/mongodb';

export async function GET(req: NextRequest) {
  const mongoose = await connectToMongoDatabase();

  try {
    const { searchParams } = new URL(req.url);
    const fleetId = searchParams.get('fleetId');

    if (!fleetId) {
      return NextResponse.json({ status: 'error', message: 'Fleet ID is required' }, { status: 400 });
    }

    const db = mongoose.connection.db!; // Get the native MongoDB Db object, assert non-null
    const collection = db.collection('fleet_remarks'); // Access the fleet_remarks collection

    // Find the latest remark for the given fleetId
    const latestRemark = await collection.findOne({ fleetId: fleetId}, {
      sort: { timestamp: -1 },
    });
    console.log(latestRemark)
    

    if (!latestRemark) {
      return NextResponse.json({ status: 'success', data: { remark: null, userName: null, userRole: null }, message: 'No remark found for this vehicle' });
    }

    return NextResponse.json({ 
      status: 'success', 
      data: { 
        remark: latestRemark.remark,
        userName: latestRemark.userName || null,
        userRole: latestRemark.userRole || null
      } 
    });
  } catch (error) {
    console.error('Error fetching fleet remark:', error);
    return NextResponse.json({ status: 'error', message: 'Internal server error' }, { status: 500 });
  }
} 