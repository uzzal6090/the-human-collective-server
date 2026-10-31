import "dotenv/config";
import { verifyToken } from "./middleware/verifyToken.js";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Better Auth handler must come before express.json()
app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());

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
    message: "The Human Collective API is running",
  });
});

export default app;