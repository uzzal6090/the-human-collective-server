import dns from "node:dns";
import { MongoClient } from "mongodb";

dns.setServers(["8.8.8.8"]);

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is missing from environment variables");
}

export const mongoClient = new MongoClient(mongoUri);

export const database = mongoClient.db("the-human-collective");

export async function connectDatabase(): Promise<void> {
  await mongoClient.connect();
  console.log("MongoDB connected successfully");
}