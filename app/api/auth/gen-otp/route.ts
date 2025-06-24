import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/db';
import { generateSalt, hashOtp } from '@/lib/crypto';
// No longer using otpStore

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = body?.phone;

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const client = await getMongoClient();
    const db = client.db();
    const usersCollection = db.collection('user');

    const user = await usersCollection.findOne({ phone: Number(phone) });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please contact your administrator.' },
        { status: 404 }
      );
    }

    // Generate a plain-text OTP for the user
    const plainOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = generateSalt();
    const hashedOtp = hashOtp(plainOtp, salt);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    const now = new Date();

    // Create the OTP document according to the new schema
    const otpDocument = {
      phoneNumber: Number(phone),
      otp: hashedOtp,
      purpose: 'LOGIN',
      status: 'PENDING',
      expiresAt: expiresAt,
      attempts: 0,
      maxAttempts: 5,
      salt: salt,
      createdAt: now,
      updatedAt: now,
    };

    const otpCollection = db.collection('otp');
    await otpCollection.insertOne(otpDocument);

    // Send the plain-text OTP to the user
    try {
      await sendOtpOnWhatsapp(plainOtp, Number(phone));
    } catch (whatsappError) {
      console.error('WhatsApp integration error:', whatsappError);
      // Fallback to console log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`OTP for ${phone}: ${plainOtp}`);
      }
    }

    return NextResponse.json(
      { 
        status: true,
        message: 'OTP sent successfully',
        phone: phone
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error generating OTP:', error);
    return NextResponse.json(
      { error: error?.message || 'Could not send OTP' },
      { status: 500 }
    );
  }
}

const sendOtpOnWhatsapp = async (otp: string, phone: number) => {
  const template = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'template',
    template: {
      name: 'otp_verification',
      language: {
        code: 'en',
      },
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: otp,
            },
          ],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [
            {
              type: 'text',
              text: otp,
            },
          ],
        },
      ],
    },
  };

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${process.env.WHATAPP_CLOUD_API_SENDER_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      body: JSON.stringify(template),
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en_US',
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.WHATAPP_CLOUD_API_ACCESS_TOKEN}`,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('WhatsApp API Error:', errorData);
    throw new Error('Failed to send OTP via WhatsApp');
  }

  return response;
}; 