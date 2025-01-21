# Points of Interest Backend

This is the backend server for the Points of Interest application that provides API endpoints for managing and retrieving POI data with emotional analysis.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
PORT=3001
```

3. Import initial data (if needed):
```bash
node scripts/importData.js
```

## Running the Server

To start the development server:
```bash
npm start
```

The server will start running on `http://localhost:3001`

## API Endpoints

- `GET /api/pois` - Get all points of interest
- `POST /api/pois` - Create a new point of interest
- `GET /api/pois/:id` - Get a specific point of interest
- `PUT /api/pois/:id` - Update a point of interest
- `DELETE /api/pois/:id` - Delete a point of interest

## Project Structure

```
backend/
├── routes/         # API route definitions
├── models/         # Database models
├── scripts/        # Utility scripts
└── server.js       # Main application file
```
