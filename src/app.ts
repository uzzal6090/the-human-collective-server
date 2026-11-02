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

// Intercept OAuth callback redirects to pass session token to client URL for 100% reliable cross-domain/mobile authentication
app.use((req, res, next) => {
  if (req.path.startsWith("/api/auth/callback/")) {
    const originalWriteHead = res.writeHead;

    res.writeHead = function (statusCode: number, ...args: any[]) {
      if (statusCode === 302 || statusCode === 307) {
        const location = res.getHeader("location") || res.getHeader("Location");
        const setCookie = res.getHeader("set-cookie") || res.getHeader("Set-Cookie");
        if (typeof location === "string" && setCookie) {
          const cookieStr = Array.isArray(setCookie) ? setCookie.join("; ") : String(setCookie);
          const match = cookieStr.match(/(?:better-auth|__Secure-better-auth)\.session_token=([^;]+)/);
          if (match && match[1]) {
            const token = match[1];
            try {
              const url = new URL(location, "http://localhost");
              url.searchParams.set("session_token", token);
              const newLocation = location.startsWith("http") ? url.toString() : `${url.pathname}${url.search}`;
              res.setHeader("Location", newLocation);
            } catch {
              const separator = location.includes("?") ? "&" : "?";
              res.setHeader("Location", `${location}${separator}session_token=${token}`);
            }
          }
        }
      }
      return originalWriteHead.apply(res, [statusCode, ...args] as any);
    };
  }
  next();
});

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
