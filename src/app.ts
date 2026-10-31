import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";
import { verifyToken } from "./middleware/verifyToken.js";
import eventRoutes from "./routes/event.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Better Auth handler must come before express.json()
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());

// API Routes
app.use("/api/events", eventRoutes);
app.use("/api/user", userRoutes);

// Health & Protected Test Route
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({
    success: true,
    message: "Protected API accessed successfully",
    user: (req as any).user,
  });
});

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "The Human Collective API is running smoothly",
    version: "1.0.0",
  });
});

export default app;
