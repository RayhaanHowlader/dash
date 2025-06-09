import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export function withErrorHandling(handler: Function, mongoClient: MongoClient) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error: any) {
      console.error('API Error:', error);
      return NextResponse.json(
        { status: 'error', message: error.message || 'Internal server error' },
        { status: 500 }
      );
    } finally {
      // Don't close the connection as it's managed by the singleton
    }
  };
} 