require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('../utils/db');
const POI = require('../models/poi');

const importData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await POI.deleteMany();

    // Read JSON file using correct path
    const jsonPath = path.join(__dirname, '..', 'pois.json');
    const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    // Format the data to match our schema
    const formattedData = rawData.map(poi => ({
      name: poi['POI Name'],
      category: poi.Category,
      location: {
        type: 'Point',
        coordinates: [parseFloat(poi.Longitude), parseFloat(poi.Latitude)]
      },
      sentiment: {
        label: poi.Sentiment || 'neutral',
        score: poi['Star Rating'] ? parseFloat(poi['Star Rating']) / 5 : 0.5
      },
      emotions: {
        joy: poi.Emotion === 'Joy' ? 1 : 0,
        sadness: poi.Emotion === 'Sadness' ? 1 : 0,
        fear: poi.Emotion === 'Fear' ? 1 : 0,
        disgust: poi.Emotion === 'Disgust' ? 1 : 0,
        anger: poi.Emotion === 'Anger' ? 1 : 0,
        happy: poi.Emotion === 'Happy' ? 1 : 0,
        calm: poi.Emotion === 'Calm' ? 1 : 0,
        none: poi.Emotion === 'None' ? 1 : 0,
      },
      timestamp: poi['Review Date'] ? new Date(poi['Review Date']) : new Date()
    }));

    // Clear existing data
    await POI.deleteMany({});
    console.log('Cleared existing data');

    // Import formatted data
    await POI.insertMany(formattedData);
    console.log('Data imported successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

importData();
