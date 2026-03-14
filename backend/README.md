# LMS Backend

Express + TypeScript API for the AI Learning Platform.

## Tech Stack

- **Node.js** + **Express**
- **TypeScript**
- **ts-node-dev** for development

## Setup

1. Copy `.env.example` to `.env`.
2. Set `PORT` (default 3001) and `DATABASE_URL` (PostgreSQL connection string, e.g. Supabase).
3. Run `npm run dev`.

## Scripts

- `npm run dev` — Start with ts-node-dev (respawn on file change)
- `npm run build` — Compile TypeScript to `dist/`
- `npm start` — Run compiled app (`node dist/index.js`). Use this in production.
- `npm run lint` — Run ESLint

## Deployment (Render)

1. **Build command:** `npm run build` (or `npm install && npm run build` if needed).
2. **Start command:** `npm start` (runs `node dist/index.js`).
3. **Health check:** `GET /api/health` returns `200` with `{ "status": "ok" }`. Configure Render’s health check path to `/api/health`.

### Environment variables (production)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Port (default `3001`). Render sets this automatically. |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string (e.g. Supabase URI from Project Settings → Database). |
| `JWT_SECRET` | **Yes** | Secret to sign JWTs. Use a long random value (e.g. `openssl rand -base64 32`). |
| `CORS_ORIGIN` | **Yes** (when frontend on different origin) | Frontend URL for CORS, e.g. `https://your-app.vercel.app`. Comma-separated for multiple. |
| `COOKIE_DOMAIN` | No | Cookie domain; leave unset unless using subdomains. |
| `GROQ_API_KEY` | No | Groq API key for AI tutor. Leave empty to disable `/api/ai/chat`. Get one at [Groq Console](https://console.groq.com/keys). |
| `GROQ_MODEL` | No | Groq model (default `llama-3.3-70b-versatile`). |
| `NODE_ENV` | No | Set to `production` on Render. |

### Cookie and CORS

- **Refresh token cookie:** `httpOnly`, `secure` (in production), `sameSite: "none"` in production when `CORS_ORIGIN` is set (so the cookie is sent from the Vercel frontend to the Render backend). Path: `/api/auth`.
- **CORS:** In production, if `CORS_ORIGIN` is set, only that origin (or list of origins) is allowed. In development, `origin: true` is used so any origin is allowed.

## Structure

- `src/config` — Environment (port, database URL)
- `src/routes` — API route definitions
- `src/controllers` — Request handlers
- `src/middleware` — Express middleware
- `src/services` — Business logic

## Database (PostgreSQL / Supabase)

### Supabase as production DB

1. **Create a project** at [Supabase](https://supabase.com/). The free tier includes a PostgreSQL database.
2. **Get the connection string:** In the Supabase dashboard, go to **Project Settings → Database**. Under **Connection string**, choose **URI** and copy it. Use the **Session mode** (direct) URI for the backend (e.g. `postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres` or the direct connection on port `5432`).
3. **Point Render to Supabase:** In Render → your backend service → Environment, set `DATABASE_URL` to the Supabase PostgreSQL URI. SSL is enabled automatically when the URL contains `supabase` or when `NODE_ENV=production`.
4. **Apply schema:** Run migrations once against the database (see below).

### Schema (same as PRD, PostgreSQL)

Migrations in `migrations/` apply the full schema:

- **001_initial_schema.sql:** `users`, `subjects`, `sections`, `videos`, `enrollments`, `video_progress`, `refresh_tokens` (with indexes and FKs).
- **002_payments.sql:** `payments` (for fake payment create/confirm flow).

Run migrations (creates all tables and indexes):

```bash
# Set DATABASE_URL in .env to your Supabase URI, then:
npm run migrate
```

To run migrations against production from your machine: set `DATABASE_URL` to the Supabase URI (e.g. in `.env`) and run `npm run migrate`. Alternatively, use a one-off job or release command on Render that runs `npm run migrate` (if your plan supports it).

### Verify connection

```bash
npm run test:db
```

This connects with the same config as the app, runs `SELECT 1`, and optionally reports row counts for `users` and `subjects`. Use it to confirm the production DB is reachable before or after migrations.

### Test auth, enrollments, progress, and payments

After the backend on Render points to Supabase (`DATABASE_URL` set) and migrations have been run:

1. **Health:** `GET https://your-backend.onrender.com/api/health` → `{ "status": "ok" }`.
2. **Auth:** Register and log in via the frontend (or `POST /api/auth/register`, `POST /api/auth/login`). Refresh token is stored in `refresh_tokens` and sent in a cookie.
3. **Payments / enrollments:** From the frontend, open a course and complete the fake payment flow; check `payments` and `enrollments` in the DB or by loading “My courses” on the profile page.
4. **Progress:** Open a lesson, watch part of the video, and refresh or open the lesson again to confirm resume; check `video_progress` or the course progress bar.

All of these use the same PostgreSQL connection via the app’s pool.

## API

- `GET /api/health` — Returns `{ "status": "ok" }`

### Auth (JWT + refresh token)

- `POST /api/auth/register` — Body: `{ email, password, name }`. Creates user, returns `{ user: { id, email, name } }`.
- `POST /api/auth/login` — Body: `{ email, password }`. Returns `{ user, accessToken, expiresIn }` and sets HTTP-only cookie `refreshToken`.
- `POST /api/auth/refresh` — No body. Cookie: `refreshToken`. Returns new `{ user, accessToken, expiresIn }` and rotates refresh token cookie.
- `POST /api/auth/logout` — No body. Cookie: `refreshToken`. Revokes token and clears cookie.

Access token: 15 min. Refresh token: 30 days, stored hashed in `refresh_tokens`. Use `Authorization: Bearer <accessToken>` for protected routes. Use middleware `requireAuth` from `middleware/authMiddleware` to attach `req.user`.

### Subjects (courses)

- `GET /api/subjects` — Returns published courses only (`is_published = true`). Response: array of `{ id, title, slug, description, price, thumbnail, is_published, created_at, updated_at }`.
- `GET /api/subjects/:subjectId` — Course details including price. 404 if not found or not published.
- `GET /api/subjects/:subjectId/tree` — Course structure: `{ subject_id, sections: [{ id, subject_id, title, order_index, videos: [{ id, section_id, title, description, youtube_url, order_index, duration_seconds }] }] }`. Sections and videos ordered by `order_index`. No auth required.

### Payments (fake flow, auth required)

- `POST /api/payments/create` — Body: `{ subject_id }`. Creates a pending payment record, returns `{ payment_id }`.
- `POST /api/payments/confirm` — Body: `{ payment_id }`. Waits 2 seconds, marks payment success, creates enrollment. Returns `{ status: "success", enrollment_created: true }`. If already enrolled, returns `enrollment_created: false`.

### Enrollments (auth required)

- `POST /api/enrollments` — Body: `{ subject_id }`. Creates enrollment directly (for fake flow without going through payment). 409 if already enrolled.

### Users (auth required)

- `GET /api/users/me/courses` — Returns the current user’s enrolled courses: array of `{ id, subject_id, title, slug, description, price, thumbnail }`.

**Enrollment enforcement:** Use `enrollmentService.isEnrolled(userId, subjectId)` in video and tree endpoints to restrict course content to enrolled users only.

### Videos (auth required)

- `GET /api/videos/:videoId` — Returns lesson detail for enrolled users. Response: `{ id, title, description, youtube_url, duration_seconds, section_id, section_title, subject_id, subject_title, previous_video_id, next_video_id, locked }`. **403** if user is not enrolled in the course; **404** if video not found. **locked:** first video is unlocked when enrolled; each following video is unlocked only when the previous video is completed (in `video_progress`).

### Progress (auth required)

- `GET /api/progress/videos/:videoId` — Returns `{ last_position_seconds, is_completed }` for the current user and video. Returns `{ last_position_seconds: 0, is_completed: false }` if no progress yet.
- `POST /api/progress/videos/:videoId` — Body: `{ last_position_seconds, is_completed }`. Creates or updates `video_progress`. When `is_completed` is true, `completed_at` is set. Use for resume playback and for unlocking the next lesson (GET /api/videos/:videoId uses this to compute `locked`).
- `GET /api/progress/subjects/:subjectId` — Returns `{ completed, total }` (count of completed videos and total videos in the course) for the current user. Use for course progress bar.

### AI tutor (auth required)

- `POST /api/ai/chat` — Body: `{ video_id, question }`. Requires auth. Loads video title, description, section and course (subject) from DB; ensures user is enrolled in the course; sends to Groq (Llama) with a tutor system prompt and returns `{ answer }`. Env: `GROQ_API_KEY` (required for AI), optional `GROQ_MODEL` (default `llama-3.3-70b-versatile`). **403** if user does not have access to the lesson; **429** on rate limit; **503** if AI is not configured.
