import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/authService";
import { findUserById } from "../services/authService";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!bearer) {
    res.status(401).json({ error: "Access token required" });
    return;
  }
  const payload = verifyAccessToken(bearer);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  findUserById(parseInt(payload.sub, 10))
    .then((user) => {
      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }
      req.user = user;
      next();
    })
    .catch(() => {
      res.status(500).json({ error: "Authentication failed" });
    });
}
