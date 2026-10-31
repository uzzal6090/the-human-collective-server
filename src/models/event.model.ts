import { ObjectId, type Collection } from "mongodb";
import { database } from "../config/database.js";

export interface EventDocument {
  _id?: ObjectId;
  title: string;
  description: string;
  eventType: string;
  thumbnailUrl: string;
  location: string;
  date: string; // YYYY-MM-DD
  creatorEmail: string;
  creatorName: string;
  createdAt: Date;
  updatedAt: Date;
}

export function getEventsCollection(): Collection<EventDocument> {
  return database.collection<EventDocument>("events");
}
