import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";
import { connectDatabase } from "./config/database.js";
import { verifyToken } from "./middleware/verifyToken.js";
import { errorHandler } from "./middleware/errorHandler.js";
import eventRoutes from "./routes/event.routes.js";
import userRoutes from "./routes/user.routes.js";

// Ensure DB connection for serverless / traditional environments
connectDatabase().catch((err) => console.error("Database connection error:", err));

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, origin);
    },
    credentials: true,
  })
);

// Better Auth handler in Express 5 uses path-to-regexp v8 wildcard {*any}
app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());

// API Routes
app.use("/api/events", eventRoutes);
app.use("/api/user", userRoutes);

// Protected Auth Verification Endpoint
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({
    success: true,
    message: "Protected API accessed successfully",
    user: (req as any).user,
  });
});

// Production Root Health & Status Endpoint
app.get("/", (_req, res) => {
  res.json({
    success: true,
    name: "The Human Collective API",
    status: "healthy",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
