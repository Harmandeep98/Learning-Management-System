import { Redis } from 'ioredis';

const redisClient = () => {
    if (process.env.REDISURI) {
        console.log("Redis connected")
        return process.env.REDISURI
    }
    throw new Error("Failed to connect to Redis");
}

export const redis = new Redis(redisClient(), { tls: { rejectUnauthorized: false } });