import { Request, Response } from "express";
import * as authService from "../services/authService";
import { config } from "../config/env";

function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(config.cookieName, token, config.cookieOptions);
}

function clearRefreshTokenCookie(res: Response): void {
  const opts = config.cookieOptions;
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
    ...(opts.domain && { domain: opts.domain }),
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: "email, password, and name are required" });
      return;
    }
    const user = await authService.register({ email, password, name });
    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err: unknown) {
    const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
    const message = err instanceof Error ? err.message : "";
    if (code === "23505" || code === "ER_DUP_ENTRY" || message.includes("Duplicate")) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    res.status(500).json({ error: "Registration failed" });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const result = await authService.login({ email, password });
    if (!result) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    setRefreshTokenCookie(res, result.refreshToken);
    res.status(200).json({
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: 900, // 15 min in seconds, for client convenience
    });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const token = req.cookies?.[config.cookieName];
    if (!token) {
      res.status(401).json({ error: "Refresh token required" });
      return;
    }
    const result = await authService.refresh(token);
    if (!result) {
      clearRefreshTokenCookie(res);
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }
    setRefreshTokenCookie(res, result.refreshToken);
    res.status(200).json({
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: 900,
    });
  } catch {
    res.status(500).json({ error: "Refresh failed" });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const token = req.cookies?.[config.cookieName];
    if (token) {
      await authService.logout(token);
    }
    clearRefreshTokenCookie(res);
    res.status(200).json({ message: "Logged out" });
  } catch {
    clearRefreshTokenCookie(res);
    res.status(200).json({ message: "Logged out" });
  }
}
