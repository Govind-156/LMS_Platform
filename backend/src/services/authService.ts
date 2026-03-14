import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "crypto";
import { getPool } from "../config/db";
import { config } from "../config/env";

const SALT_ROUNDS = 10;

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginResult {
  user: { id: number; email: string; name: string };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResult {
  user: { id: number; email: string; name: string };
  accessToken: string;
  refreshToken: string;
}

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateRefreshToken(): string {
  return randomBytes(32).toString("hex");
}

export async function register(input: RegisterInput): Promise<{ id: number; email: string; name: string }> {
  const pool = getPool();
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const result = await pool.query(
    "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id",
    [input.email.trim().toLowerCase(), passwordHash, input.name.trim()]
  );
  const row = result.rows[0];
  const id = row?.id as number;
  return { id, email: input.email.trim().toLowerCase(), name: input.name.trim() };
}

export async function login(input: { email: string; password: string }): Promise<LoginResult | null> {
  const pool = getPool();
  const result = await pool.query(
    "SELECT id, email, password_hash, name FROM users WHERE email = $1",
    [input.email.trim().toLowerCase()]
  );
  const user = result.rows[0];
  if (!user) return null;
  const match = await bcrypt.compare(input.password, user.password_hash);
  if (!match) return null;

  const accessToken = jwt.sign(
    { sub: String(user.id), email: user.email },
    config.jwtSecret,
    { expiresIn: 15 * 60 }
  );

  const refreshToken = generateRefreshToken();
  const refreshHash = hashRefreshToken(refreshToken);
  const expiresAt = new Date(Date.now() + config.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000);
  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [user.id, refreshHash, expiresAt]
  );

  return {
    user: { id: user.id, email: user.email, name: user.name },
    accessToken,
    refreshToken,
  };
}

export async function refresh(refreshToken: string): Promise<RefreshResult | null> {
  const pool = getPool();
  const hash = hashRefreshToken(refreshToken);
  const result = await pool.query(
    "SELECT rt.id AS token_id, rt.user_id, u.email, u.name FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id WHERE rt.token_hash = $1 AND rt.revoked_at IS NULL AND rt.expires_at > NOW()",
    [hash]
  );
  const row = result.rows[0];
  if (!row) return null;

  await pool.query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1", [row.token_id]);

  const accessToken = jwt.sign(
    { sub: String(row.user_id), email: row.email },
    config.jwtSecret,
    { expiresIn: 15 * 60 }
  );

  const newRefreshToken = generateRefreshToken();
  const newRefreshHash = hashRefreshToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + config.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000);
  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [row.user_id, newRefreshHash, expiresAt]
  );

  return {
    user: { id: row.user_id, email: row.email, name: row.name },
    accessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logout(refreshToken: string): Promise<void> {
  const pool = getPool();
  const hash = hashRefreshToken(refreshToken);
  await pool.query(
    "UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL",
    [hash]
  );
}

export async function findUserById(id: number): Promise<{ id: number; email: string; name: string } | null> {
  const pool = getPool();
  const result = await pool.query("SELECT id, email, name FROM users WHERE id = $1", [id]);
  const user = result.rows[0];
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name };
}

export function verifyAccessToken(token: string): { sub: string; email: string } | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string; email: string };
    return payload;
  } catch {
    return null;
  }
}
