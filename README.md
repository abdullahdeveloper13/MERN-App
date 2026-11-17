# HireSphere AI

HireSphere AI is a multi-role hiring platform built with the MERN stack. Job seekers can discover jobs, manage profiles and resumes, apply, save roles, track interviews, and message employers. Employers and recruiters can manage companies, publish jobs, review candidates, move applications through a hiring pipeline, and schedule interviews. Administrators get moderation, analytics, audit logs, and platform settings.

The interface uses real API data only. Empty states are shown when the database has no content, and optional integrations report their status instead of displaying simulated results.

## Stack

- Client: React 19, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Framer Motion, Lucide
- Server: Node.js, Express 5, TypeScript, MongoDB/Mongoose, JWT cookies, Socket.IO, Zod, Multer
- Integrations: Cloudinary uploads, Resend/SMTP email, Google Identity Services, optional OpenAI-compatible AI provider
- Tooling: npm workspaces, ESLint 9, Vitest, Supertest, Husky, Docker

## Project layout

```text
client/                 React application
  src/pages/public      Landing, job/company discovery, job details
  src/pages/auth        Login, registration, password and verification flows
  src/pages/dashboard   Role dashboards and workspace pages
  src/components        Layouts and shared UI
server/                 Express API
  src/controllers       HTTP handlers
  src/models            Mongoose models
  src/routes            Versioned API routes
  src/services          Email, Cloudinary, notifications, AI
  src/migrations        Database migrations
  src/scripts           Migration and admin-seed scripts
  test                  API and utility tests
```

## Local setup

Requirements: Node.js 22+, npm, and a MongoDB database (MongoDB Atlas works well).

```bash
cp .env.example .env
# Fill in the required values in .env
npm install
npm run db:migrate --workspace server
npm run seed:admin --workspace server
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:5000
- Health check: http://localhost:5000/health

The Vite dev server proxies `/api` and `/socket.io` to the API. The root `.env` is shared by both workspaces.

### Required configuration

At minimum, configure:

- `MONGODB_URI` and `MONGODB_DB_NAME`
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` with random values of at least 16 characters
- `CLIENT_URL`

Cloudinary, email, Google sign-in, and AI are optional at startup. Their features return clear configuration errors when they are not set. Uploads require Cloudinary; verification and reset links require email transport.

For production, set `NODE_ENV=production` and serve the client over HTTPS. Set `CLIENT_URL` to the public client origin. When the client and API use different domains, also list every client origin in `CORS_ORIGINS` (comma-separated) and set `VITE_API_URL` to the absolute API URL, for example `https://api.example.com/api/v1`. Authentication cookies are automatically marked `Secure` and `SameSite=None` on HTTPS so cross-domain sessions work; set `COOKIE_SECURE=true` only when TLS terminates before the request reaches Node.

## Scripts

Run these from the repository root:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API and Vite dev server together |
| `npm run build` | Build the server and client |
| `npm run lint` | Lint both workspaces |
| `npm test` | Run server and client tests |
| `npm run db:migrate --workspace server` | Apply pending migrations |
| `npm run db:migrate:status --workspace server` | Show migration status |
| `npm run db:migrate:down --workspace server` | Roll back the latest migration |
| `npm run seed:admin --workspace server` | Create the administrator from `ADMIN_EMAIL`/`ADMIN_PASSWORD` |

The admin seed is idempotent. It will not overwrite an existing account and refuses to attach an admin role to a non-admin email.

## Roles and main flows

- **Job seeker**: update profile, upload resume/avatar, browse and filter published jobs, save jobs, apply with job-specific questions, withdraw applications, track statuses and interviews, message employers, receive notifications.
- **Employer**: create a company profile and logo, publish/edit/pause/close jobs, manage application questions, review applicants and resume downloads, move candidates through `reviewing → shortlisted → interview → offered → hired`, schedule interviews, message candidates.
- **Recruiter**: work with assigned companies/jobs, manage listings and candidate pipelines alongside employers.
- **Admin**: view platform analytics, activate/deactivate users, verify companies, moderate jobs, inspect all applications, assign recruiters, review audit logs, and view integration settings.

Authentication uses httpOnly access and refresh cookies. Refresh tokens rotate and are stored hashed in MongoDB. Protected routes verify the current database role on each request.

## API overview

All application endpoints are under `/api/v1`.

- `/auth`: register, login, refresh, logout, Google ID-token login, email verification, password reset/change, current session
- `/profiles`: own profile/account updates, avatar and resume upload, authorized resume download
- `/companies`: public discovery and reviews, employer company management, logo upload
- `/jobs`: public search/filter/categories/stats, employer/recruiter job management
- `/applications`: apply, list own applications, pipeline listing and detail, status transitions, withdrawal
- `/saved-jobs`, `/conversations`, `/notifications`, `/dashboard`: saved roles, messaging, notifications, role dashboards
- `/admin`: analytics, moderation, recruiter assignments, audit logs, settings
- `/ai`: provider status and authenticated job-description, interview-question, and resume-analysis helpers

Real-time updates are delivered with Socket.IO for new notifications, messages, and application status changes.

## Database migrations

Migrations live in `server/src/migrations` and are tracked in the `_migrations` collection. They create the initial collections and synchronize model indexes. Run migrations before seeding or starting a new environment.

## Docker

The repository includes production Dockerfiles for both workspaces and a Compose file that connects to an external MongoDB (such as Atlas). It does not start a local database.

```bash
docker compose build
docker compose up -d
```

The client is exposed at http://localhost:5173 and proxies `/api` and `/socket.io` to the server container. Compose reads the root `.env`; make sure `MONGODB_URI` points to a reachable database. When deploying behind HTTPS, update `CLIENT_URL` and set `COOKIE_SECURE=true`.

Apply migrations and seed the admin against the production database before exposing the service:

```bash
docker compose run --rm server node dist/scripts/migrate.js up
docker compose run --rm server node dist/scripts/seed-admin.js
```

## Tests and quality checks

```bash
npm run lint
npm test
npm run build
```

Server tests use Vitest and Supertest without requiring a running database. Client tests cover shared formatting utilities. The production client build also runs TypeScript checking and uses route-level code splitting.

## Operational notes and limitations

- Cloudinary is required for all file uploads. Resume downloads are authorized and served through signed Cloudinary URLs.
- Email delivery is optional; when no transport is configured, verification and reset messages are skipped and the API remains available.
- Google sign-in uses the Google Identity Services ID-token flow. Configure the authorized JavaScript origin for the deployed client.
- AI features use an OpenAI-compatible chat-completions API and are disabled with a `503` response until `AI_API_KEY` and `AI_MODEL` are set. AI output is advisory and does not make hiring decisions.
- The app does not include background job processing; email sending and notification creation are performed in request flows.
- Production deployments should add log aggregation, backups, uptime monitoring, and a managed MongoDB tier appropriate to traffic.
