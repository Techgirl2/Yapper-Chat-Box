# Yapper - AI Chat Application

A full-stack chat application with user authentication and Claude AI integration.

**Live Demo:** https://yapper-chatbox.vercel.app/

## Tech Stack

- Next.js (App Router)
- PostgreSQL + Prisma ORM
- NextAuth.js (authentication)
- Anthropic Claude API

## Setup

1. **Clone and install:**
   ```bash
   git clone <repo-url>
   cd take_home_assgn
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Fill in `.env`:
   - `DATABASE_URL` — PostgreSQL connection string
   - `CLAUDE_API_KEY` — Get from https://console.anthropic.com
   - `NEXTAUTH_SECRET` — Run `openssl rand -base64 32`
   - `NEXTAUTH_URL` — `http://localhost:3000` (local) or your deployed URL

3. **Start Docker (if using local Postgres):**
   ```bash
   docker-compose up -d
   ```

4. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

5. **Start dev server:**
   ```bash
   npm run dev
   ```

6. **Open http://localhost:3000 and sign up!**

## Features

- User sign up/login/logout
- Chat with Claude AI
- Persistent chat history per user
- Server-side API (secrets never exposed to client)

## Deployment

Deploy to Vercel:
1. Push code to GitHub
2. Create Vercel Postgres database
3. Update DATABASE_URL in `.env` with Vercel connection string
4. Run `npx prisma migrate deploy`
5. Import repo to Vercel, add env variables, deploy

For full deployment steps, see comments in `.env.example`.
