# Fetron Dashboard Login System

This document explains how to set up and use the OTP-based login system for the Fetron Dashboard.

## Features

- **Secure OTP Flow**: Implements a highly secure, hash-based OTP verification process.
- **Phone Number Authentication**: Users enter a valid 10-digit Indian phone number.
- **WhatsApp Integration**: 6-digit plain-text OTPs are sent via the WhatsApp Business API.
- **User Validation**: Only users registered in the `user` collection can receive an OTP.
- **Database-Driven**: Uses your existing `otps` collection schema for robust and reliable OTP management.
- **Attempt Tracking**: Monitors and blocks after too many failed verification attempts for an OTP.
- **Session Management**: Uses secure, cookie-based authentication after successful login.

## Setup Instructions

### 1. Database Setup

Make sure you have MongoDB running. The system uses two collections:
- `user`: Stores your primary user data.
- `otps`: Used for temporary, secure storage of OTPs, matching your provided schema.

### 2. Environment Variables

Make sure your `.env.local` file contains the following:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# Node Environment
NODE_ENV=development

# WhatsApp Business API Credentials
WHATAPP_CLOUD_API_ACCESS_TOKEN=your_whatsapp_api_token
WHATAPP_CLOUD_API_SENDER_PHONE_NUMBER_ID=your_whatsapp_phone_id

# OTP Hashing Secret
# A long, random string used for creating secure OTP hashes.
OTP_SECRET=your-very-long-and-random-secret-for-hashing
```

### 3. WhatsApp Business API Setup
1. Create a WhatsApp Business API account.
2. Get your `access token` and `phone number ID`.
3. Set up a template named `otp_verification`.
4. Add your credentials to the environment variables.

## Authentication Flow

1.  **OTP Generation (`/api/auth/gen-otp`)**
    1.  The user provides a phone number.
    2.  The system checks if the user exists in the `user` collection.
    3.  A plain-text, 6-digit OTP is generated (e.g., `123456`).
    4.  A unique, random `salt` is generated.
    5.  The plain-text OTP is combined with the `salt` and securely hashed (HMAC-SHA512).
    6.  A new document is created in the `otps` collection containing the **hashed OTP**, the `salt`, an expiration time (10 minutes), and other metadata.
    7.  The **plain-text OTP** (`123456`) is sent to the user via WhatsApp.

2.  **OTP Verification (`/api/auth/verify-otp`)**
    1.  The user submits the plain-text OTP they received.
    2.  The system finds the latest `PENDING` OTP record for that phone number in the `otps` collection.
    3.  It checks for expiration and failed attempt limits.
    4.  It re-hashes the submitted plain-text OTP using the `salt` stored in the database record.
    5.  The new hash is compared to the stored hash in a timing-safe manner.
    6.  If they match, the OTP is marked as `VERIFIED`, and the user's data is returned to log them in.
    7.  If they don't match, the `attempts` count is increased.

## Production Recommendation: TTL Index
For automatic cleanup of old OTPs in your database, you should create a TTL (Time-To-Live) index on the `otps` collection. This will command MongoDB to automatically delete documents after a certain time.

Run this command in your MongoDB shell:
```javascript
db.otps.createIndex( { "expiresAt": 1 }, { expireAfterSeconds: 0 } )
```
This tells MongoDB to look at the `expiresAt` field and delete the document when that time is reached. This is crucial for keeping your `otps` collection clean.
***
*This file was last updated to reflect the secure, hash-based OTP implementation using the existing `otps` collection schema.*

## How to Use

### 1. Access the Login Page

Navigate to `/login` in your browser. If you're not authenticated, you'll be automatically redirected here.

### 2. Enter Phone Number

- Enter a valid 10-digit Indian phone number
- The system will check if the user exists in the `user` collection.
- If the user exists, an OTP will be sent via WhatsApp and stored in the `otps` collection.

### 3. Enter OTP

- Enter the 6-digit OTP received on WhatsApp
- The OTP is valid for 10 minutes
- You can resend OTP after 30 seconds

### 4. Access Dashboard

After successful verification, you'll be redirected to the dashboard with full access.

## API Endpoints

### POST /api/auth/gen-otp
Generates and sends OTP to the provided phone number via WhatsApp.

**Request Body:**
```json
{
  "phone": 8850164414
}
```

**Response:**
```json
{
  "status": true,
  "message": "OTP sent successfully",
  "phone": 8850164414
}
```

### POST /api/auth/verify-otp
Verifies the OTP and returns user data.

**Request Body:**
```json
{
  "phone": 8850164414,
  "otp": "123456"
}
```

**Response:**
```json
{
  "status": true,
  "message": "OTP verified successfully",
  "user": {
    "id": "user_id",
    "name": "Shilpa",
    "phone": 8850164414,
    "role": "fleet_manager",
    "vehicleGroup": "LINE_TRAILER",
    "status": "active",
    "assignedVehicles": [...]
  }
}
```

### POST /api/auth/logout
Logs out the user and clears authentication cookies.

## Components

### OtpInput Component
A reusable 6-digit OTP input component with:
- Auto-focus on next input
- Backspace navigation
- Paste support
- Visual feedback for filled inputs

### LogoutButton Component
A logout button that can be used anywhere in the dashboard.

## Security Features

1. **User Validation**: Only registered users can receive OTP
2. **OTP Expiration**: OTPs expire after 10 minutes
3. **Single Use**: OTPs are deleted from the database immediately after use.
4. **Cookie Security**: Authentication uses secure HTTP-only cookies
5. **Route Protection**: Middleware protects all dashboard routes
6. **Reliable Storage**: OTPs are stored in the database to work correctly in all server environments.

## WhatsApp Integration

### Template Setup
Create a WhatsApp template with:
- Name: `otp_verification`
- Language: English
- Body: "Your OTP is {{1}}"
- Button: "Verify OTP" with {{1}} parameter

### Environment Variables
```env
WHATAPP_CLOUD_API_ACCESS_TOKEN=your_access_token
WHATAPP_CLOUD_API_SENDER_PHONE_NUMBER_ID=your_phone_id
```

### Fallback
If WhatsApp API fails:
- In development: OTP is logged to console
- In production: Consider SMS fallback

## Development vs Production

### Development Mode
- OTP is logged to console for easy testing
- WhatsApp integration is optional
- Memory storage is sufficient

### Production Mode
- Full WhatsApp integration
- Consider Redis for OTP storage
- Implement proper error handling and fallbacks

## Troubleshooting

### Common Issues

1. **"User not found" error**: Make sure the user exists in the `user` collection
2. **"Invalid OTP" error**: Check if OTP has expired or already been used. Remember that OTPs are single-use.
3. **WhatsApp API errors**: Verify API credentials and template setup
4. **Database connection issues**: Verify MongoDB connection string

### Testing

1. Use the test user (8850164414) for development
2. Check console logs for OTP in development mode
3. Verify WhatsApp messages are received
4. Verify cookies are set after successful login

## File Structure

```
app/
├── login/
│   └── page.tsx              # Login page component
├── api/auth/
│   ├── gen-otp/
│   │   └── route.ts          # OTP generation API (WhatsApp)
│   ├── verify-otp/
│   │   └── route.ts          # OTP verification API
│   └── logout/
│       └── route.ts          # Logout API
├── globals.css               # Login page styles
└── page.tsx                  # Dashboard (updated with logout)

components/
├── OtpInput.tsx              # OTP input component
└── LogoutButton.tsx          # Logout button component

lib/
├── db.ts                     # Database connection
├── auth.ts                   # Authentication utilities
└── otpStore.ts               # Deprecated (can be removed)

middleware.ts                 # Route protection middleware
```

## Styling

The login page uses a modern glassmorphism design with:
- Gradient backgrounds
- Glass effect cards
- Smooth animations
- Responsive design
- Dark theme with accent colors

All styles are defined in `app/globals.css` under the "Login Page Styles" section.

## WhatsApp Template Example

Your WhatsApp template should look like this:

**Template Name**: `otp_verification`

**Header**: None

**Body**: 
```
Your Fetron Dashboard verification code is {{1}}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this message.
```

**Footer**: None

**Buttons**: None

**Language**: English (en)

**Category**: Authentication 