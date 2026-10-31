import path from "node:path";
import dotenv from "dotenv";

// Load server .env file reliably regardless of working directory
dotenv.config({ path: path.resolve(import.meta.dirname, "../../.env") });

import { connectDatabase, database, mongoClient } from "../config/database.js";
import type { EventDocument } from "../models/event.model.js";

function getFutureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const sampleEvents: EventDocument[] = [
  {
    title: "Winter Clothes Distribution – Mirpur 10, Dhaka",
    description:
      "Join us to distribute warm jackets, sweaters, and winter clothes to underprivileged families and children in the Mirpur 10 area. Volunteers are needed to assist with organizing and handing out packages.",
    eventType: "Donation",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1000&q=80",
    location: "Mirpur 10 Community Center, Dhaka",
    date: getFutureDate(5),
    creatorEmail: "sarah.rahman@example.com",
    creatorName: "Sarah Rahman",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Blanket Distribution for the Needy – Mohammadpur, Dhaka",
    description:
      "Providing quality warm blankets to street dwellers, rickshaw pullers, and elderly individuals facing the cold season in Mohammadpur and nearby bus stations.",
    eventType: "Donation",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1000&q=80",
    location: "Town Hall Ground, Mohammadpur, Dhaka",
    date: getFutureDate(8),
    creatorEmail: "sarah.rahman@example.com",
    creatorName: "Sarah Rahman",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Clean City Campaign & Waste Segregation – Dhanmondi, Dhaka",
    description:
      "A community-driven cleanliness initiative around Dhanmondi Lake. We will collect non-biodegradable plastics, install trash bins, and raise public awareness on waste management.",
    eventType: "Cleanup",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=1000&q=80",
    location: "Dhanmondi Lake Amphitheater, Dhaka",
    date: getFutureDate(12),
    creatorEmail: "community.lead@example.com",
    creatorName: "Tanvir Ahmed",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Urban Tree Plantation & Green Corridor – Uttara, Dhaka",
    description:
      "Planting 500 indigenous fruit and shade trees along Uttara Sector 11 canals to enhance local biodiversity and mitigate urban heat island effects.",
    eventType: "Plantation",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1000&q=80",
    location: "Sector 11 Lake Walkway, Uttara, Dhaka",
    date: getFutureDate(15),
    creatorEmail: "community.lead@example.com",
    creatorName: "Tanvir Ahmed",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Books & School Stationery Drive for Primary Students – Rayerbazar",
    description:
      "Collecting and distributing textbooks, notebooks, school bags, and stationery kits to over 200 underprivileged elementary school students.",
    eventType: "Education",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1000&q=80",
    location: "Rayerbazar Community School, Dhaka",
    date: getFutureDate(20),
    creatorEmail: "sarah.rahman@example.com",
    creatorName: "Sarah Rahman",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Free Health Checkup & Blood Pressure Screening – Mirpur, Dhaka",
    description:
      "Volunteer doctors and nurses offering free health examinations, blood glucose tests, and basic medications for elderly community residents.",
    eventType: "Health",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1000&q=80",
    location: "Mirpur 2 Cultural Complex, Dhaka",
    date: getFutureDate(25),
    creatorEmail: "community.lead@example.com",
    creatorName: "Tanvir Ahmed",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function seedDatabase(): Promise<void> {
  try {
    await connectDatabase();
    const eventsCollection = database.collection<EventDocument>("events");

    const existingCount = await eventsCollection.countDocuments();
    if (existingCount > 0) {
      console.log(`Database already has ${existingCount} events. Skipping seed.`);
      process.exit(0);
    }

    console.log("Seeding realistic sample social development events...");
    await eventsCollection.insertMany(sampleEvents);
    console.log(`Successfully seeded ${sampleEvents.length} events into MongoDB!`);
    await mongoClient.close();
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seedDatabase();
