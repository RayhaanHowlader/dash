export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { connectToMongoDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    // console.log('Connecting to database...');
    const mongoose = await connectToMongoDatabase();
    
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    // console.log('Database connected successfully');
    
    // Fetch all tickets
    const tickets = await mongoose.connection.db.collection('ticket').find({ status: "open" }).toArray();
    // console.log('Fetched tickets:', tickets);
    
    return NextResponse.json({
      status: 'success',
      data: tickets
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
} 