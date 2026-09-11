const redisClient = require('../config/redis');
const logger = require('../config/logger');

const submitCodeRateLimiter = async (req, res, next) => {
  const userId = req.result._id; 
  const redisKey = `submit_cooldown:${userId}`;

  try {
    // Check if user has a recent submission
    const exists = await redisClient.exists(redisKey);
    
    if (exists) {
      return res.status(429).json({
        error: 'Please wait 10 seconds before submitting again'
      });
    }

    // Set cooldown period
    await redisClient.set(redisKey, 'cooldown_active', {
      EX: 10, // Expire after 10 seconds
      NX: true // Only set if not exists
    });

    next();
  } catch (error) {
    logger.error('Rate limiter error', { error: error.message, requestId: req.requestId });
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = submitCodeRateLimiter;
