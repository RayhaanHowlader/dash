# Fetron Vehicle Tracking Dashboard

A professional vehicle tracking dashboard built with Next.js, MongoDB, and Chart.js.

## Features

- Real-time vehicle tracking
- Vehicle type-specific pages (SXL, MXL, Trailer, Car Carrier, 17 Feet)
- Interactive charts and statistics
- Responsive design
- MongoDB integration

## Prerequisites

- Node.js 18.x or later
- MongoDB Atlas account
- npm or yarn package manager

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd fetron
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_APP_NAME=Fetron Dashboard
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/app` - Next.js 13+ app directory
- `/components` - Reusable React components
- `/lib` - Utility functions and MongoDB connection
- `/models` - MongoDB models
- `/public` - Static assets

## API Routes

- `/api/vehicles/stats` - Get vehicle statistics
- `/api/vehicles/sxl` - SXL vehicle operations
- `/api/vehicles/mxl` - MXL vehicle operations
- `/api/vehicles/trailer` - Trailer operations
- `/api/vehicles/car-carrier` - Car carrier operations
- `/api/vehicles/17-feet` - 17 feet vehicle operations

## Technologies Used

- Next.js 13+
- TypeScript
- MongoDB
- Chart.js
- Tailwind CSS
- React Icons
- NextAuth.js

## License

MIT 