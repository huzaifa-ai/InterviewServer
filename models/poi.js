const mongoose = require('mongoose');

const poiSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  sentiment: {
    label: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      required: true
    }
  },
  emotions: {
    joy: Number,
    sadness: Number,
    fear: Number,
    disgust: Number,
    anger: Number,
    happy: Number,
    calm: Number,
    none: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create index for geospatial queries
poiSchema.index({ location: '2dsphere' });

const POI = mongoose.model('POI', poiSchema);

module.exports = POI;
