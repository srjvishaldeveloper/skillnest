import { Queue } from "bullmq";
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL;

function createRedisConnection(): Redis {
  const conn = new Redis(REDIS_URL || "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
  });
  conn.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
  });
  return conn;
}

const connection = createRedisConnection() as any;

export const mediaQueue = new Queue("media-processing", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: { age: 3600, count: 50 },
    removeOnFail: { age: 86400, count: 50 },
  },
});

export { createRedisConnection };
