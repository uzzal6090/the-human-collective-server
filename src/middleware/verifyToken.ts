import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";

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

    // 2. Fallback to Bearer JWT token validation
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
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
