export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { getVehicleCollection } from '@/lib/db';
import { withErrorHandling } from '@/lib/utils';

const mongoClient = new MongoClient(process.env.MONGODB_URI as string);

export const GET = withErrorHandling(async (req: NextRequest) => {
  const url = new URL(req.url);
  const vehicleGroup = url.searchParams.get('group');

  if (!vehicleGroup) {
    return NextResponse.json(
      { status: 'error', message: 'Vehicle group is required' },
      { status: 400 }
    );
  }

  const vehicle_collection = await getVehicleCollection();

  const vehicles = await vehicle_collection
    .find(
      { vehicleGroup },
      {
        projection: {
          _id: 1,
          vehicleNumber: 1,
          vehicleType: 1,
          currentTripStatus: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    )
    .toArray();

  // Count vehicles by status
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.currentTripStatus === 'in-transit').length;
  const maintenanceVehicles = vehicles.filter(v => v.currentTripStatus === 'maintenance').length;

  return NextResponse.json(
    {
      status: 'success',
      data: {
        vehicles,
        stats: {
          total: totalVehicles,
          active: activeVehicles,
          maintenance: maintenanceVehicles
        }
      },
    },
    { status: 200 }
  );
}, mongoClient);

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  
  const { vehicleNumber, vehicleType, vehicleGroup } = body;
  
  if (!vehicleNumber || !vehicleType || !vehicleGroup) {
    return NextResponse.json(
      { status: 'error', message: 'Missing required fields' },
      { status: 400 }
    );
  }

  const vehicle_collection = await getVehicleCollection();
  
  const vehicle = await vehicle_collection.insertOne({
    vehicleNumber,
    vehicleType,
    vehicleGroup,
    currentTripStatus: 'available',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return NextResponse.json(
    { status: 'success', data: vehicle },
    { status: 201 }
  );
}, mongoClient);

export const PUT = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  
  const { id, ...updateData } = body;
  
  if (!id) {
    return NextResponse.json(
      { status: 'error', message: 'Vehicle ID is required' },
      { status: 400 }
    );
  }

  const vehicle_collection = await getVehicleCollection();
  
  const result = await vehicle_collection.updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: {
        ...updateData,
        updatedAt: new Date()
      }
    }
  );

  return NextResponse.json(
    { status: 'success', data: result },
    { status: 200 }
  );
}, mongoClient);

export const DELETE = withErrorHandling(async (req: NextRequest) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { status: 'error', message: 'Vehicle ID is required' },
      { status: 400 }
    );
  }

  const vehicle_collection = await getVehicleCollection();
  
  const result = await vehicle_collection.deleteOne({
    _id: new ObjectId(id)
  });

  return NextResponse.json(
    { status: 'success', data: result },
    { status: 200 }
  );
}, mongoClient); 