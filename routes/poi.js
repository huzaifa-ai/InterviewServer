const express = require('express');
const router = express.Router();
const POI = require('../models/poi');

// Get POIs with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const category = req.query.category;
    const searchQuery = req.query.search;
    const sentiment = req.query.sentiment;

    const query = {};
    if (category && category !== 'all') {
      query.category = category;
    }
    if (searchQuery) {
      query.name = { $regex: searchQuery, $options: 'i' };
    }
    if (sentiment) {
      query['sentiment.label'] = sentiment;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get paginated data with total count
    const [pois, total] = await Promise.all([
      POI.find(query)
        .select('name category location sentiment emotions timestamp')
        .skip(skip)
        .limit(limit)
        .sort({ timestamp: -1 }),
      POI.countDocuments(query)
    ]);

    // Send response with metadata
    res.json({
      data: pois,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.error('Error in GET /pois:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get sentiment analytics
router.get('/sentiment', async (req, res) => {
  try {
    const sentimentAnalytics = await POI.aggregate([
      {
        $group: {
          _id: '$sentiment.label',
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(sentimentAnalytics);
  } catch (error) {
    console.error('Error in GET /sentiment:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get category analytics
router.get('/categories', async (req, res) => {
  try {
    const categoryAnalytics = await POI.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    res.json(categoryAnalytics);
  } catch (error) {
    console.error('Error in GET /categories:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get emotion analytics
router.get('/emotions', async (req, res) => {
  try {
    const emotionAnalytics = await POI.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgJoy: { $avg: "$emotions.joy" },
          avgSadness: { $avg: "$emotions.sadness" },
          avgFear: { $avg: "$emotions.fear" },
          avgDisgust: { $avg: "$emotions.disgust" },
          avgAnger: { $avg: "$emotions.anger" },
          avgHappy: { $avg: "$emotions.happy" },
          avgCalm: { $avg: "$emotions.calm" },
          avgNone: { $avg: "$emotions.none" }
        }
      },
      {
        $project: {
          _id: 0,
          avgJoy: { $ifNull: ["$avgJoy", 0] },
          avgSadness: { $ifNull: ["$avgSadness", 0] },
          avgFear: { $ifNull: ["$avgFear", 0] },
          avgDisgust: { $ifNull: ["$avgDisgust", 0] },
          avgAnger: { $ifNull: ["$avgAnger", 0] },
          avgHappy: { $ifNull: ["$avgHappy", 0] },
          avgCalm: { $ifNull: ["$avgCalm", 0] },
          avgNone: { $ifNull: ["$avgNone", 0] }
        }
      }
    ]);

    res.json(emotionAnalytics[0] || {
      avgJoy: 0,
      avgSadness: 0,
      avgFear: 0,
      avgDisgust: 0,
      avgAnger: 0,
      avgHappy: 0,
      avgCalm: 0,
      avgNone: 0
    });
  } catch (error) {
    console.error('Error in GET /emotions:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get geospatial data
router.get('/geo', async (req, res) => {
  try {
    const { category, sentiment } = req.query;
    const query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    if (sentiment) {
      query['sentiment.label'] = sentiment;
    }

    const geoData = await POI.find(query)
      .select('name category location sentiment')
      .limit(1000); // Limit to prevent browser overload

    res.json(geoData);
  } catch (error) {
    console.error('Error in GET /geo:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
