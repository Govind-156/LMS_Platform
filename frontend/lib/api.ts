import axios from "axios";

/**
 * Backend API base URL (include /api). Set via NEXT_PUBLIC_API_BASE_URL.
 * Local: http://localhost:3001/api
 * Vercel: https://your-backend.onrender.com/api
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // send cookies (refresh token) on every request for auth/payment
});
