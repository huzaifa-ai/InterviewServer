const express = require('express');
const router = express.Router();
const poiRoutes = require('./poi');

// Mount POI routes
router.use('/pois', poiRoutes);
// Mount analytics routes
router.use('/analytics', poiRoutes);

module.exports = router;
