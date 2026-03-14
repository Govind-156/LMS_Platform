# LMS Frontend

Next.js 14 (App Router) frontend for the AI Learning Platform.

## Tech Stack

- **Next.js 14** (App Router)
- **React** + **TypeScript**
- **TailwindCSS**
- **Zustand** (state)
- **Axios** (API client)

## Setup

1. Copy `.env.local.example` to `.env.local`.
2. Set `NEXT_PUBLIC_API_BASE_URL` to your backend API root **including `/api`** (e.g. `http://localhost:3001/api`).
3. Run `npm run dev`.

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run start` — Start production server (after `npm run build`)
- `npm run lint` — Run ESLint

## Deployment (Vercel)

1. **Build command:** `npm run build` (default).
2. **Output:** Next.js standalone or default output; no extra config required.
3. **Environment variables:** In Vercel → Project → Settings → Environment Variables, add:

   | Variable | Value | Notes |
   |----------|--------|--------|
   | `NEXT_PUBLIC_API_BASE_URL` | `https://your-backend.onrender.com/api` | Your Render backend URL **including `/api`**. Required. No trailing slash. |

   All API requests use this base URL. The Axios client sends **credentials (cookies)** on every request (`withCredentials: true`), so login, refresh, and payment flows work with the deployed backend.

4. **Auth and payment with deployed backend**
   - Backend (Render) must have **CORS** set to your Vercel URL (e.g. `https://your-app.vercel.app`) via `CORS_ORIGIN`.
   - Backend must use **secure, SameSite=None** for the refresh-token cookie in production (so the cookie is sent cross-origin). The backend is already configured for this when `CORS_ORIGIN` is set.
   - After deployment, test: sign up, log in, enroll (payment flow), and open a lesson to confirm cookies and CORS work.

## Structure

- `app/` — Routes: `/`, `/courses`, `/courses/[courseId]`, `/courses/[courseId]/video/[videoId]`, `/profile`, `/login`, `/register`
- `components/` — Reusable UI
- `store/` — Zustand stores (auth, payment)
- `lib/` — API client (base URL from `NEXT_PUBLIC_API_BASE_URL`, credentials enabled) and auth interceptors
- `types/` — Shared TypeScript types
