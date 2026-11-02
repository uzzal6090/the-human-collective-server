import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
}

const authURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

const JWKS = createRemoteJWKSet(new URL("/api/auth/jwks", authURL));

export async function verifyToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: authURL,
        audience: authURL,
      });

      if (payload.sub) {
        req.user = {
          id: payload.sub as string,
          email: typeof payload.email === "string" ? payload.email : undefined,
          name: typeof payload.name === "string" ? payload.name : undefined,
        };
        return next();
      }
    } catch {
      // Fall through to 401
    }

    res.status(401).json({
      success: false,
      message: "Invalid or expired session token",
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired session token",
    });
  }
}
