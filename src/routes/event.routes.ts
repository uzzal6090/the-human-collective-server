import { Router } from "express";
import {
  getRecentUpcomingEvents,
  getAllUpcomingEvents,
  getEventById,
  createEvent,
  getMyEvents,
  updateEvent,
  deleteEvent,
  joinEvent,
  getMyJoinedEvents,
} from "../controllers/event.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

// Public routes
router.get("/recent", getRecentUpcomingEvents);
router.get("/", getAllUpcomingEvents);

// Specific protected user routes (Must be declared before /:id)
router.get("/user/my-events", verifyToken, getMyEvents);
router.get("/user/joined-events", verifyToken, getMyJoinedEvents);

// Public single event route
router.get("/:id", getEventById);

// Protected mutation routes
router.post("/", verifyToken, createEvent);
router.post("/:id/join", verifyToken, joinEvent);
router.put("/:id", verifyToken, updateEvent);
router.delete("/:id", verifyToken, deleteEvent);

export default router;
