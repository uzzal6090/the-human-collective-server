import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getEventsCollection, type EventDocument } from "../models/event.model.js";
import { getJoinedEventsCollection, type JoinedEventDocument } from "../models/joinedEvent.model.js";
import type { AuthenticatedRequest } from "../middleware/verifyToken.js";

// Helper to get today's date in YYYY-MM-DD
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper to safely extract string ID from Express params
function getIdParam(id: string | string[] | undefined): string {
  if (Array.isArray(id)) return id[0] || "";
  return id || "";
}

// 1. GET 6 Recent Upcoming Events (PDF Requirement Page 3)
export async function getRecentUpcomingEvents(_req: Request, res: Response): Promise<void> {
  try {
    const today = getTodayDateString();
    const collection = getEventsCollection();

    // Use .limit(6) as strictly specified in the assignment PDF
    const events = await collection
      .find({ date: { $gte: today } })
      .sort({ date: 1, createdAt: -1 })
      .limit(6)
      .toArray();

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching recent events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent events",
    });
  }
}

// 2. GET All Upcoming Events with Search & Category Filter (PDF Requirement Page 4)
export async function getAllUpcomingEvents(req: Request, res: Response): Promise<void> {
  try {
    const today = getTodayDateString();
    const { search, category } = req.query;

    const query: Record<string, any> = {
      date: { $gte: today },
    };

    if (category && category !== "all" && typeof category === "string") {
      query.eventType = { $regex: new RegExp(`^${category}$`, "i") };
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { location: searchRegex },
        { description: searchRegex },
      ];
    }

    const collection = getEventsCollection();
    const events = await collection
      .find(query)
      .sort({ date: 1 })
      .toArray();

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming events",
    });
  }
}

// 3. GET Single Event Details (PDF Requirement Page 4)
export async function getEventById(req: Request, res: Response): Promise<void> {
  try {
    const id = getIdParam(req.params.id);

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid event ID format",
      });
      return;
    }

    const collection = getEventsCollection();
    const event = await collection.findOne({ _id: new ObjectId(id) });

    if (!event) {
      res.status(404).json({
        success: false,
        message: "Event not found",
      });
      return;
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Error fetching event details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch event details",
    });
  }
}

// 4. POST Create Event (PDF Requirement Page 4 - Protected)
export async function createEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { title, description, eventType, thumbnailUrl, location, date } = req.body;
    const user = req.user;

    if (!user?.email) {
      res.status(401).json({
        success: false,
        message: "User email not found in session",
      });
      return;
    }

    // Input Validation
    if (!title || !description || !eventType || !thumbnailUrl || !location || !date) {
      res.status(400).json({
        success: false,
        message: "All fields are required",
      });
      return;
    }

    // Date must be in the future
    const today = getTodayDateString();
    if (date < today) {
      res.status(400).json({
        success: false,
        message: "Event date must be in the future. Past dates are not allowed.",
      });
      return;
    }

    const newEvent: EventDocument = {
      title: title.trim(),
      description: description.trim(),
      eventType: eventType.trim(),
      thumbnailUrl: thumbnailUrl.trim(),
      location: location.trim(),
      date,
      creatorEmail: user.email,
      creatorName: user.name || user.email.split("@")[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const collection = getEventsCollection();
    const result = await collection.insertOne(newEvent);

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: {
        ...newEvent,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create event",
    });
  }
}

// 5. GET Events Created by Logged-in User (PDF Requirement Page 5 - Protected)
export async function getMyEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user?.email) {
      res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
      return;
    }

    const collection = getEventsCollection();
    const myEvents = await collection
      .find({ creatorEmail: user.email })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: myEvents,
    });
  } catch (error) {
    console.error("Error fetching user events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your events",
    });
  }
}

// 6. PUT Update Event (PDF Requirement Page 5 - Protected, Creator Only)
export async function updateEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = getIdParam(req.params.id);
    const user = req.user;

    if (!user?.email) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid event ID format" });
      return;
    }

    const { title, description, eventType, thumbnailUrl, location, date } = req.body;

    if (!title || !description || !eventType || !thumbnailUrl || !location || !date) {
      res.status(400).json({ success: false, message: "All fields are required" });
      return;
    }

    const today = getTodayDateString();
    if (date < today) {
      res.status(400).json({ success: false, message: "Event date must be in the future" });
      return;
    }

    const collection = getEventsCollection();
    const event = await collection.findOne({ _id: new ObjectId(id) });

    if (!event) {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }

    // Permission check: only the creator can update
    if (event.creatorEmail !== user.email) {
      res.status(403).json({
        success: false,
        message: "Forbidden: You can only update your own events",
      });
      return;
    }

    const updateData = {
      title: title.trim(),
      description: description.trim(),
      eventType: eventType.trim(),
      thumbnailUrl: thumbnailUrl.trim(),
      location: location.trim(),
      date,
      updatedAt: new Date(),
    };

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Also update denormalized data in joined_events if needed
    const joinedCollection = getJoinedEventsCollection();
    await joinedCollection.updateMany(
      { eventId: new ObjectId(id) },
      {
        $set: {
          eventTitle: updateData.title,
          eventDescription: updateData.description,
          eventType: updateData.eventType,
          thumbnailUrl: updateData.thumbnailUrl,
          location: updateData.location,
          eventDate: updateData.date,
        },
      }
    );

    res.json({
      success: true,
      message: "Event updated successfully",
      data: { ...event, ...updateData },
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update event",
    });
  }
}

// 7. DELETE Event (PDF Requirement Page 5 - Protected, Creator Only)
export async function deleteEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = getIdParam(req.params.id);
    const user = req.user;

    if (!user?.email) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid event ID format" });
      return;
    }

    const collection = getEventsCollection();
    const event = await collection.findOne({ _id: new ObjectId(id) });

    if (!event) {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }

    // Permission check: only creator can delete
    if (event.creatorEmail !== user.email) {
      res.status(403).json({
        success: false,
        message: "Forbidden: You can only delete your own events",
      });
      return;
    }

    await collection.deleteOne({ _id: new ObjectId(id) });

    // Also delete any joined event references
    const joinedCollection = getJoinedEventsCollection();
    await joinedCollection.deleteMany({ eventId: new ObjectId(id) });

    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete event",
    });
  }
}

// 8. POST Join Event (PDF Requirement Page 4 & 5 - Protected)
export async function joinEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = getIdParam(req.params.id);
    const user = req.user;

    if (!user?.email) {
      res.status(401).json({ success: false, message: "Please log in to join this event" });
      return;
    }

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid event ID format" });
      return;
    }

    const eventCollection = getEventsCollection();
    const event = await eventCollection.findOne({ _id: new ObjectId(id) });

    if (!event) {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }

    const joinedCollection = getJoinedEventsCollection();

    // Check if user already joined
    const alreadyJoined = await joinedCollection.findOne({
      eventId: new ObjectId(id),
      userEmail: user.email,
    });

    if (alreadyJoined) {
      res.status(400).json({
        success: false,
        message: "You have already joined this event",
      });
      return;
    }

    const joinedRecord: JoinedEventDocument = {
      eventId: new ObjectId(id),
      userEmail: user.email,
      userName: user.name || user.email.split("@")[0],
      eventTitle: event.title,
      eventDescription: event.description,
      eventType: event.eventType,
      thumbnailUrl: event.thumbnailUrl,
      location: event.location,
      eventDate: event.date,
      joinedAt: new Date(),
    };

    await joinedCollection.insertOne(joinedRecord);

    res.status(201).json({
      success: true,
      message: "Successfully joined the event!",
      data: joinedRecord,
    });
  } catch (error) {
    console.error("Error joining event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to join event",
    });
  }
}

// 9. GET Joined Events for Logged-in User, Sorted by Date (PDF Requirement Page 5)
export async function getMyJoinedEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;

    if (!user?.email) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const joinedCollection = getJoinedEventsCollection();

    // Show events joined by logged-in user sorted by event date (as specified in PDF Page 5)
    const joinedEvents = await joinedCollection
      .find({ userEmail: user.email })
      .sort({ eventDate: 1 })
      .toArray();

    res.json({
      success: true,
      data: joinedEvents,
    });
  } catch (error) {
    console.error("Error fetching joined events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch joined events",
    });
  }
}
