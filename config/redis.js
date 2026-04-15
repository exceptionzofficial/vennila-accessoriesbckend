const redis = require('redis');
const dotenv = require('dotenv');

dotenv.config();

console.log(`Connecting to Redis at: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);

const client = redis.createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT)
    }
});

client.on('error', (err) => console.log('Redis Client Error', err));
client.on('connect', () => console.log('Redis Client Connected'));

const connectRedis = async () => {
    try {
        await client.connect();
    } catch (err) {
        console.error('Could not connect to Redis', err);
    }
};

module.exports = { client, connectRedis };
