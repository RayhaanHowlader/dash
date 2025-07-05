export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/db';
import { verifyOtp } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp: plainOtp } = body;

    if (!phone || !plainOtp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    const client = await getMongoClient();
    const db = client.db();
    const otpCollection = db.collection('otp');

    // Find the most recent, pending OTP for this phone number
    const otpRecord = await otpCollection.findOne(
      {
        phoneNumber: Number(phone),
        status: 'PENDING',
        expiresAt: { $gt: new Date() },
      },
      { sort: { createdAt: -1 } } // Get the latest one
    );

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP. Please request a new one.' },
        { status: 400 }
      );
    }
    
    // Check if max attempts have been reached
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
        await otpCollection.updateOne(
            { _id: otpRecord._id },
            { $set: { status: 'FAILED' } }
        );
        return NextResponse.json(
            { error: 'Too many failed attempts. Please request a new OTP.' },
            { status: 400 }
        );
    }

    // Verify the provided OTP against the stored hash
    const isValid = verifyOtp(plainOtp, otpRecord.otp, otpRecord.salt);

    if (!isValid) {
      // Increment attempts and update the record
      await otpCollection.updateOne(
        { _id: otpRecord._id },
        { $inc: { attempts: 1 }, $set: { updatedAt: new Date() } }
      );
      return NextResponse.json({ error: 'Invalid OTP provided.' }, { status: 400 });
    }

    // OTP is valid, update its status to VERIFIED
    await otpCollection.updateOne(
      { _id: otpRecord._id },
      { $set: { status: 'VERIFIED', updatedAt: new Date() } }
    );
    
    // OTP is verified, now get the user data
    const usersCollection = db.collection('user');
    const user = await usersCollection.findOne(
      { phone: Number(phone) },
      { projection: { password: 0 } } // Exclude sensitive fields
    );

    if (!user) {
      // This should not happen if the gen-otp check passed, but it's a good safeguard.
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    
    // Prepare user data for the response
    const userData = {
      id: user._id.toString(),
      name: user.name,
      phone: user.phone,
      role: user.role,
      vehicleGroup: user.vehicleGroup,
      status: user.status,
      assignedVehicles: user.assignedVehicles || []
    };

    return NextResponse.json(
      {
        status: true,
        message: 'OTP verified successfully',
        user: userData,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: error?.message || 'Could not verify OTP' },
      { status: 500 }
    );
  }
} 