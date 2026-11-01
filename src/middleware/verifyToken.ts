import type { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";
import { database } from "../config/database.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
}

export async function verifyToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Try Better Auth session from headers/cookies
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session?.user) {
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      };
      return next();
    }

    // 2. Try Bearer token (direct database session check + Jose JWKS fallback)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      // Direct database lookup for opaque session tokens
      try {
        const sessionDoc = await database.collection("session").findOne({
          token,
          expiresAt: { $gt: new Date() },
        });

        if (sessionDoc?.userId) {
          const userQuery = ObjectId.isValid(sessionDoc.userId)
            ? { _id: new ObjectId(sessionDoc.userId) }
            : { _id: sessionDoc.userId as any };

          const userDoc = await database.collection("user").findOne(userQuery);

          if (userDoc) {
            req.user = {
              id: userDoc._id.toString(),
              email: userDoc.email,
              name: userDoc.name,
            };
            return next();
          }
        }
      } catch (dbErr) {
        console.warn("Direct session lookup in verifyToken warning:", dbErr);
      }

      // Jose JWKS verification fallback for standard JWT tokens
      try {
        const authURL = process.env.BETTER_AUTH_URL || "http://localhost:5000";
        const JWKS = createRemoteJWKSet(new URL("/api/auth/jwks", authURL));

        const { payload } = await jwtVerify(token, JWKS, {
          issuer: authURL,
          audience: authURL,
        });

        if (payload.sub) {
          req.user = {
            id: payload.sub,
            email: typeof payload.email === "string" ? payload.email : undefined,
            name: typeof payload.name === "string" ? payload.name : undefined,
          };
          return next();
        }
      } catch {
        // Fall through to 401
      }
    }

    res.status(401).json({
      success: false,
      message: "Authentication required. Please log in.",
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired session token",
    });
  }
}
