const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const client = new Client({
  cloud: {
    id: process.env.ELASTIC_CLOUD_ID
  },
  auth: {
    apiKey: process.env.ELASTIC_API_KEY
  }
});

// Initialize Elasticsearch index
async function initializeElasticsearch() {
  try {
    const indexName = 'pois';
    
    // Check if index exists
    const indexExists = await client.indices.exists({ index: indexName });
    
    if (!indexExists) {
      // Create index with mapping
      await client.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              name: { type: 'text' },
              category: { type: 'keyword' },
              location: { type: 'geo_point' },
              sentiment: {
                properties: {
                  label: { type: 'keyword' },
                  score: { type: 'float' }
                }
              },
              emotions: {
                properties: {
                  joy: { type: 'float' },
                  sadness: { type: 'float' },
                  fear: { type: 'float' },
                  disgust: { type: 'float' },
                  anger: { type: 'float' },
                  happy: { type: 'float' },
                  calm: { type: 'float' },
                  none: { type: 'float' }
                }
              },
              timestamp: { type: 'date' }
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('Error initializing Elasticsearch:', error);
  }
}

// Index a single POI
async function indexPOI(poi) {
  try {
    await client.index({
      index: 'pois',
      id: poi._id.toString(),
      document: {
        name: poi.name,
        category: poi.category,
        location: {
          lat: poi.location.coordinates[1],
          lon: poi.location.coordinates[0]
        },
        sentiment: poi.sentiment,
        emotions: poi.emotions,
        timestamp: poi.timestamp
      }
    });
  } catch (error) {
    console.error('Error indexing POI:', error);
  }
}

// Search POIs
async function searchPOIs({ query, category, page = 1, limit = 50 }) {
  try {
    const from = (page - 1) * limit;
    
    const searchQuery = {
      bool: {
        must: [],
        should: [],
        minimum_should_match: query ? 1 : 0
      }
    };

    // Add search query if provided
    if (query) {
      searchQuery.bool.should.push(
        {
          match: {
            name: {
              query,
              fuzziness: "AUTO",
              boost: 2
            }
          }
        },
        {
          match: {
            category: {
              query,
              fuzziness: "AUTO"
            }
          }
        }
      );
    }

    // Add category filter if provided
    if (category && category !== 'all') {
      searchQuery.bool.must.push({
        match: {
          category: {
            query: category,
            operator: "and"
          }
        }
      });
    }

    const result = await client.search({
      index: 'pois',
      from,
      size: limit,
      query: searchQuery,
      sort: [
        { _score: 'desc' },
        { timestamp: 'desc' }
      ]
    });

    return {
      data: result.hits.hits.map(hit => ({
        ...hit._source,
        _id: hit._id,
        location: {
          type: 'Point',
          coordinates: [hit._source.location.lon, hit._source.location.lat]
        }
      })),
      pagination: {
        total: result.hits.total.value,
        page,
        limit,
        totalPages: Math.ceil(result.hits.total.value / limit)
      }
    };

  } catch (error) {
    console.error('Error searching POIs:', error);
    throw error;
  }
}

// Bulk index POIs
async function bulkIndexPOIs(pois) {
  try {
    const operations = pois.flatMap(poi => [
      { index: { _index: 'pois', _id: poi._id.toString() } },
      {
        name: poi.name,
        category: poi.category,
        location: {
          lat: poi.location.coordinates[1],
          lon: poi.location.coordinates[0]
        },
        sentiment: poi.sentiment,
        emotions: poi.emotions,
        timestamp: poi.timestamp
      }
    ]);

    const result = await client.bulk({ operations });
    if (result.errors) {
      console.error('Bulk indexing had errors:', result.items);
    }
    return result;
  } catch (error) {
    console.error('Error bulk indexing POIs:', error);
    throw error;
  }
}

module.exports = {
  client,
  initializeElasticsearch,
  indexPOI,
  searchPOIs,
  bulkIndexPOIs
};
