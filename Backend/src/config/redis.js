const { createClient } = require('redis');
const logger = require('./logger');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        keepAlive: 5000, // Sends TCP keep-alive packets every 5 seconds to keep connection alive
        reconnectStrategy: (retries) => {
            // Attempt reconnect with exponential backoff (max 3000ms delay)
            return Math.min(retries * 100, 3000);
        }
    }
});

redisClient.on('error', err => logger.error('Redis Client Error', { error: err.message || err }));

// await redisClient.connect();

// await redisClient.set('foo', 'bar');
// const result = await redisClient.get('foo');
// console.log(result)  // >>> bar



module.exports = redisClient;