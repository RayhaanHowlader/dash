import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json(
      { status: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear authentication cookies
    response.cookies.set('isAuthenticated', '', {
      path: '/',
      expires: new Date(0),
    });

    response.cookies.set('user', '', {
      path: '/',
      expires: new Date(0),
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Could not logout' },
      { status: 500 }
    );
  }
} 