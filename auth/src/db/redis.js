const Redis = require('ioredis');

// In test environment, export a no-op mock to avoid real Redis connections
if (process.env.NODE_ENV === 'test') {
    module.exports = {
        set: async () => {},
        on: () => {},
        disconnect: () => {},
    };
} else {
    const redis = new Redis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
    });

    redis.on('connect', () => {
        console.log('Connected to Redis');
    });

    module.exports = redis;
}