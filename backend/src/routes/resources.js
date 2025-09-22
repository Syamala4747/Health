const express = require('express');
const { query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { optionalAuth } = require('../middleware/auth');
const { queryDocuments, getDocument, COLLECTIONS } = require('../config/firebase');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * Get all resources with filtering
 */
router.get('/', [
  optionalAuth,
  query('type').optional().isIn(['article', 'video', 'game', 'pdf', 'audio']),
  query('language').optional().isIn(['en', 'te', 'hi', 'ta']),
  query('category').optional().isString(),
  query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  query('search').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { type, language, category, difficulty, search, limit = 50 } = req.query;

  try {
    let filters = [
      { field: 'isActive', operator: '==', value: true }
    ];

    if (type) {
      filters.push({ field: 'type', operator: '==', value: type });
    }

    if (language) {
      filters.push({ field: 'language', operator: '==', value: language });
    }

    if (category) {
      filters.push({ field: 'category', operator: '==', value: category });
    }

    if (difficulty) {
      filters.push({ field: 'difficulty', operator: '==', value: difficulty });
    }

    const resources = await queryDocuments(COLLECTIONS.RESOURCES, filters,
      { field: 'createdAt', direction: 'desc' }, parseInt(limit));

    // Apply search filter (client-side for simplicity)
    let filteredResources = resources;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredResources = resources.filter(resource => 
        resource.title?.toLowerCase().includes(searchLower) ||
        resource.description?.toLowerCase().includes(searchLower) ||
        resource.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Remove sensitive admin fields for non-admin users
    const publicResources = filteredResources.map(resource => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      language: resource.language,
      category: resource.category,
      difficulty: resource.difficulty,
      url: resource.url,
      thumbnailUrl: resource.thumbnailUrl,
      duration: resource.duration,
      tags: resource.tags,
      rating: resource.rating || 0,
      viewCount: resource.viewCount || 0,
      createdAt: resource.createdAt
    }));

    res.json({ 
      resources: publicResources,
      total: filteredResources.length,
      filters: { type, language, category, difficulty, search }
    });

  } catch (error) {
    logger.error('Get resources error:', error);
    res.status(500).json({ error: 'Failed to retrieve resources' });
  }
}));

/**
 * Get resource by ID
 */
router.get('/:resourceId', optionalAuth, asyncHandler(async (req, res) => {
  const { resourceId } = req.params;

  try {
    const resource = await getDocument(COLLECTIONS.RESOURCES, resourceId);
    
    if (!resource || !resource.isActive) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Increment view count
    const newViewCount = (resource.viewCount || 0) + 1;
    await updateDocument(COLLECTIONS.RESOURCES, resourceId, {
      viewCount: newViewCount,
      lastViewed: new Date().toISOString()
    });

    // Log resource access
    if (req.user) {
      logger.info('Resource accessed', {
        resourceId,
        userId: req.user.uid,
        title: resource.title,
        type: resource.type
      });
    }

    const publicResource = {
      id: resource.id,
      title: resource.title,
      description: resource.description,
      content: resource.content,
      type: resource.type,
      language: resource.language,
      category: resource.category,
      difficulty: resource.difficulty,
      url: resource.url,
      thumbnailUrl: resource.thumbnailUrl,
      duration: resource.duration,
      tags: resource.tags,
      rating: resource.rating || 0,
      viewCount: newViewCount,
      createdAt: resource.createdAt,
      relatedResources: resource.relatedResources || []
    };

    res.json({ resource: publicResource });

  } catch (error) {
    logger.error('Get resource by ID error:', error);
    res.status(500).json({ error: 'Failed to retrieve resource' });
  }
}));

/**
 * Get resource categories
 */
router.get('/meta/categories', asyncHandler(async (req, res) => {
  try {
    // In a real implementation, this could be cached or stored separately
    const categories = [
      {
        id: 'anxiety',
        name: 'Anxiety Management',
        description: 'Resources for managing anxiety and panic',
        icon: 'mind',
        color: '#E6E6FA'
      },
      {
        id: 'depression',
        name: 'Depression Support',
        description: 'Resources for understanding and coping with depression',
        icon: 'heart',
        color: '#DDA0DD'
      },
      {
        id: 'stress',
        name: 'Stress Relief',
        description: 'Techniques and tools for stress management',
        icon: 'leaf',
        color: '#B19CD9'
      },
      {
        id: 'mindfulness',
        name: 'Mindfulness & Meditation',
        description: 'Mindfulness practices and meditation guides',
        icon: 'lotus',
        color: '#C8A2C8'
      },
      {
        id: 'relationships',
        name: 'Relationships',
        description: 'Building healthy relationships and communication',
        icon: 'people',
        color: '#DDBDDD'
      },
      {
        id: 'self-care',
        name: 'Self-Care',
        description: 'Self-care practices and wellness routines',
        icon: 'spa',
        color: '#E6D7E6'
      },
      {
        id: 'crisis',
        name: 'Crisis Support',
        description: 'Emergency resources and crisis intervention',
        icon: 'shield',
        color: '#F0E6F0'
      },
      {
        id: 'games',
        name: 'Wellness Games',
        description: 'Interactive games for mood improvement',
        icon: 'game',
        color: '#E6E6FA'
      }
    ];

    res.json({ categories });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
}));

/**
 * Get featured resources
 */
router.get('/meta/featured', optionalAuth, asyncHandler(async (req, res) => {
  try {
    const featuredResources = await queryDocuments(COLLECTIONS.RESOURCES, [
      { field: 'isFeatured', operator: '==', value: true },
      { field: 'isActive', operator: '==', value: true }
    ], { field: 'featuredOrder', direction: 'asc' }, 10);

    const publicResources = featuredResources.map(resource => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      language: resource.language,
      category: resource.category,
      thumbnailUrl: resource.thumbnailUrl,
      duration: resource.duration,
      rating: resource.rating || 0,
      viewCount: resource.viewCount || 0
    }));

    res.json({ resources: publicResources });
  } catch (error) {
    logger.error('Get featured resources error:', error);
    res.status(500).json({ error: 'Failed to retrieve featured resources' });
  }
}));

/**
 * Get popular resources
 */
router.get('/meta/popular', optionalAuth, asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  try {
    const popularResources = await queryDocuments(COLLECTIONS.RESOURCES, [
      { field: 'isActive', operator: '==', value: true }
    ], { field: 'viewCount', direction: 'desc' }, parseInt(limit));

    const publicResources = popularResources.map(resource => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      language: resource.language,
      category: resource.category,
      thumbnailUrl: resource.thumbnailUrl,
      duration: resource.duration,
      rating: resource.rating || 0,
      viewCount: resource.viewCount || 0
    }));

    res.json({ resources: publicResources });
  } catch (error) {
    logger.error('Get popular resources error:', error);
    res.status(500).json({ error: 'Failed to retrieve popular resources' });
  }
}));

/**
 * Get resources by category
 */
router.get('/category/:categoryId', [
  optionalAuth,
  query('language').optional().isIn(['en', 'te', 'hi', 'ta']),
  query('type').optional().isIn(['article', 'video', 'game', 'pdf', 'audio']),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { language, type, limit = 20 } = req.query;

  try {
    let filters = [
      { field: 'category', operator: '==', value: categoryId },
      { field: 'isActive', operator: '==', value: true }
    ];

    if (language) {
      filters.push({ field: 'language', operator: '==', value: language });
    }

    if (type) {
      filters.push({ field: 'type', operator: '==', value: type });
    }

    const resources = await queryDocuments(COLLECTIONS.RESOURCES, filters,
      { field: 'createdAt', direction: 'desc' }, parseInt(limit));

    const publicResources = resources.map(resource => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      language: resource.language,
      difficulty: resource.difficulty,
      thumbnailUrl: resource.thumbnailUrl,
      duration: resource.duration,
      rating: resource.rating || 0,
      viewCount: resource.viewCount || 0
    }));

    res.json({ 
      resources: publicResources,
      category: categoryId,
      total: resources.length
    });
  } catch (error) {
    logger.error('Get resources by category error:', error);
    res.status(500).json({ error: 'Failed to retrieve category resources' });
  }
}));

/**
 * Search resources
 */
router.get('/search/:query', [
  optionalAuth,
  query('language').optional().isIn(['en', 'te', 'hi', 'ta']),
  query('type').optional().isIn(['article', 'video', 'game', 'pdf', 'audio']),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const { query: searchQuery } = req.params;
  const { language, type, limit = 20 } = req.query;

  try {
    let filters = [
      { field: 'isActive', operator: '==', value: true }
    ];

    if (language) {
      filters.push({ field: 'language', operator: '==', value: language });
    }

    if (type) {
      filters.push({ field: 'type', operator: '==', value: type });
    }

    const allResources = await queryDocuments(COLLECTIONS.RESOURCES, filters);

    // Client-side search (for simplicity)
    const searchLower = searchQuery.toLowerCase();
    const matchedResources = allResources.filter(resource => 
      resource.title?.toLowerCase().includes(searchLower) ||
      resource.description?.toLowerCase().includes(searchLower) ||
      resource.content?.toLowerCase().includes(searchLower) ||
      resource.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    ).slice(0, parseInt(limit));

    const publicResources = matchedResources.map(resource => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      language: resource.language,
      category: resource.category,
      thumbnailUrl: resource.thumbnailUrl,
      duration: resource.duration,
      rating: resource.rating || 0,
      viewCount: resource.viewCount || 0,
      // Highlight search matches
      relevance: calculateRelevance(resource, searchQuery)
    }));

    // Sort by relevance
    publicResources.sort((a, b) => b.relevance - a.relevance);

    res.json({ 
      resources: publicResources,
      query: searchQuery,
      total: matchedResources.length
    });
  } catch (error) {
    logger.error('Search resources error:', error);
    res.status(500).json({ error: 'Failed to search resources' });
  }
}));

// Helper function to calculate search relevance
function calculateRelevance(resource, query) {
  const queryLower = query.toLowerCase();
  let score = 0;

  // Title matches are most important
  if (resource.title?.toLowerCase().includes(queryLower)) {
    score += 10;
  }

  // Description matches
  if (resource.description?.toLowerCase().includes(queryLower)) {
    score += 5;
  }

  // Tag matches
  if (resource.tags?.some(tag => tag.toLowerCase().includes(queryLower))) {
    score += 3;
  }

  // Content matches (if available)
  if (resource.content?.toLowerCase().includes(queryLower)) {
    score += 2;
  }

  // Boost popular resources
  score += Math.log(1 + (resource.viewCount || 0)) * 0.1;

  return score;
}

module.exports = router;