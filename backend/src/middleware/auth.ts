import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";

let developmentSecret: string | undefined;

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, getJwtSecret(), { algorithm: "HS256", expiresIn: "7d" });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as {
      userId?: unknown;
    };
    if (typeof payload.userId !== "string" || !payload.userId) {
      throw new Error("Invalid token payload");
    }
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function assertJwtConfiguration(): void {
  getJwtSecret();
}

function getJwtSecret(): string {
  const configuredSecret = process.env.JWT_SECRET?.trim();
  if (configuredSecret) {
    if (Buffer.byteLength(configuredSecret, "utf8") < 32) {
      throw new Error("JWT_SECRET must be at least 32 bytes");
    }
    return configuredSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production");
  }

  // Avoid a committed development secret. Tokens intentionally become invalid
  // after a development server restart when no local secret is configured.
  developmentSecret ??= randomBytes(32).toString("base64url");
  return developmentSecret;
}
