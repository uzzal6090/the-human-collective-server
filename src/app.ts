import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./config/database.js";
import { verifyToken } from "./middleware/verifyToken.js";
import { errorHandler } from "./middleware/errorHandler.js";
import eventRoutes from "./routes/event.routes.js";
import userRoutes from "./routes/user.routes.js";

// Ensure DB connection is established before the app handles any requests.
// Awaiting here prevents the fire-and-forget race condition where requests
// could reach database-dependent routes before MongoDB is connected.
await connectDatabase().catch((err) => {
  console.error("Database initialization failed:", err instanceof Error ? err.message : String(err));
  throw err;
});

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
app.get("/", (req, res) => {
  // If an end-user / browser lands on root (e.g. following OAuth or direct link), redirect to the client frontend!
  if (req.headers.accept && req.headers.accept.includes("text/html")) {
    const clientUrl = process.env.CLIENT_URL || "https://the-human-collective-client.vercel.app";
    return res.redirect(clientUrl);
  }

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
