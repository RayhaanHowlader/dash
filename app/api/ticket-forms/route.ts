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
    
    // Fetch all ticket forms
    const ticketForms = await mongoose.connection.db.collection('ticket_form').find({}).toArray();
    // console.log('Fetched ticket forms:', ticketForms);
    
    return NextResponse.json({
      status: 'success',
      data: ticketForms
    });
  } catch (error) {
    console.error('Error fetching ticket forms:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch ticket forms' },
      { status: 500 }
    );
  }
} 