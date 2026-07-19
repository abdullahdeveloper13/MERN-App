# HireSphere AI

Production-ready MERN stack foundation for a multi-role hiring platform.

## Stack

- Frontend: React 19, TypeScript, Vite, Tailwind, shadcn/ui, React Router, TanStack Query, React Hook Form, Zod, Framer Motion, Lucide React
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Multer, Cloudinary, Nodemailer, Socket.IO
- DevOps: ESLint, Prettier, Husky, Docker, Docker Compose

## Structure

- `client/` React app
- `server/` Express API

## Setup

1. Copy `.env.example` to `.env` and fill in values.
2. Install dependencies:
   - `npm install`
3. Run locally:
   - `npm run dev`

## Features scaffolded

- Authentication and role-based dashboards
- Job seeker, employer, recruiter, and admin architecture
- REST API versioning
- File upload support via Cloudinary adapter
- AI service abstraction for future model swaps
- Docker and Docker Compose setup

## Notes

This repo is scaffolded to be production-oriented and ready for incremental implementation. The AI integrations are intentionally adapter-based so providers can be swapped without changing the UI.
