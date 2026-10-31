import { ObjectId, type Collection } from "mongodb";
import { database } from "../config/database.js";

export interface JoinedEventDocument {
  _id?: ObjectId;
  eventId: ObjectId;
  userEmail: string;
  userName: string;
  eventTitle: string;
  eventDescription: string;
  eventType: string;
  thumbnailUrl: string;
  location: string;
  eventDate: string;
  joinedAt: Date;
}

export function getJoinedEventsCollection(): Collection<JoinedEventDocument> {
  return database.collection<JoinedEventDocument>("joined_events");
}
