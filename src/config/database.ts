import "dotenv/config";
import { MongoClient, type MongoClientOptions } from "mongodb";

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is missing from environment variables");
}

// Serverless-friendly MongoClient options:
// - serverSelectionTimeoutMS: bounded wait for server selection (10s)
// - connectTimeoutMS: initial TCP/TLS handshake timeout (10s)
// - socketTimeoutMS: socket inactivity timeout (20s)
// - maxPoolSize: cap concurrent connections in serverless (10)
// - minPoolSize: 0 allows idle connections to close (serverless-friendly)
// - retryWrites/retryReads: automatic retry of transient failures
const clientOptions: MongoClientOptions = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 20000,
  maxPoolSize: 10,
  minPoolSize: 0,
  retryWrites: true,
  retryReads: true,
};

export const mongoClient = new MongoClient(mongoUri, clientOptions);
export const database = mongoClient.db("the-human-collective");

let connectionPromise: Promise<void> | null = null;
let isConnected = false;
let connectionError: Error | null = null;

export async function connectDatabase(): Promise<void> {
  // Already connected: reuse existing client (avoid duplicate connections)
  if (isConnected) return;

  // A connection attempt is already in progress: wait for it
  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  connectionPromise = (async () => {
    try {
      await mongoClient.connect();
      isConnected = true;
      connectionError = null;
      console.log("MongoDB connected successfully");
    } catch (err) {
      connectionError = err instanceof Error ? err : new Error(String(err));
      connectionPromise = null; // allow retry on next call
      console.error("MongoDB connection error:", connectionError.message);
      throw connectionError;
    }
  })();

  await connectionPromise;
}

export function isDatabaseConnected(): boolean {
  return isConnected;
}

export function getConnectionError(): Error | null {
  return connectionError;
}
