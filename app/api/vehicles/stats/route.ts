export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { MongoClient } from 'mongodb';
import { getVehicleCollection } from '@/lib/db';
import { withErrorHandling } from '@/lib/utils';

const mongoClient = new MongoClient(process.env.MONGODB_URI as string);

export const GET = withErrorHandling(async (req: NextRequest) => {
  const vehicle_collection = await getVehicleCollection();

  // Get counts for each vehicle group
  const sxlCount = await vehicle_collection.countDocuments({ vehicleGroup: 'LINE_SXL' });
  const mxlCount = await vehicle_collection.countDocuments({ vehicleGroup: 'LINE_MXL' });
  const trailerCount = await vehicle_collection.countDocuments({ vehicleGroup: 'LINE_TRAILER' });
  const carCarrierCount = await vehicle_collection.countDocuments({ vehicleGroup: 'LINE_CAR' });
  const doubleDeckerCount = await vehicle_collection.countDocuments({ vehicleGroup: 'LINE_DD' });
  const feet17Count = await vehicle_collection.countDocuments({ vehicleGroup: 'LINE_17FEET' });
  const localvehicleCount = await vehicle_collection.countDocuments({ vehicleGroup: 'LOCAL_VEHICLE' });

  // Get total count directly to verify
  const totalDirectCount = await vehicle_collection.countDocuments({});
  
  // Get active vehicles (in-transit)
  const activeVehicles = await vehicle_collection.countDocuments({ currentTripStatus: 'in-transit' });
  
  // Get maintenance vehicles
  const maintenanceVehicles = await vehicle_collection.countDocuments({ currentTripStatus: 'maintenance' });

  return NextResponse.json(
    {
      status: 'success',
      data: {
        sxl: sxlCount,
        mxl: mxlCount,
        trailer: trailerCount,
        carCarrier: carCarrierCount,
        doubleDecker: doubleDeckerCount,
        feet17: feet17Count,
        localvehicle: localvehicleCount,
        active: activeVehicles,
        maintenance: maintenanceVehicles,
        total: totalDirectCount
      },
    },
    { status: 200 }
  );
}, mongoClient); 