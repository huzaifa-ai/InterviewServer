require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('./utils/db');
const POI = require('./models/poi');

const importData = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Read the JSON file
    const jsonData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'pois.json'), 'utf-8')
    );

    // Format the data to match our schema
    const formattedData = jsonData.map(poi => ({
      name: poi['POI Name'],
      category: poi.Category,
      location: {
        type: 'Point',  
        coordinates: [poi.Longitude, poi.Latitude]
      },
      sentiment: {
        label: poi.Sentiment,
        score: poi['Star Rating'] ? poi['Star Rating'] / 5 : 0.5 // Normalize to 0-1 range
      },
      emotions: {
        joy: poi.Emotion === 'Joy' ? 1 : 0,
        sadness: poi.Emotion === 'Sadness' ? 1 : 0,
        fear: poi.Emotion === 'Fear' ? 1 : 0,
        disgust: poi.Emotion === 'Disgust' ? 1 : 0,
        anger: poi.Emotion === 'Anger' ? 1 : 0,
        anger: poi.Emotion === 'Happy' ? 1 : 0,
        anger: poi.Emotion === 'Calm' ? 1 : 0,
        anger: poi.Emotion === 'None' ? 1 : 0,
      },
      timestamp: poi['Review Date'] ? new Date(poi['Review Date']) : new Date()
    }));

    // Clear existing data
    await POI.deleteMany({});
    console.log('Cleared existing data');

    // Insert new data
    const inserted = await POI.insertMany(formattedData);
    console.log(`Data imported successfully! Inserted ${inserted.length} documents`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

importData();
