Tevora Associate Developer Take-Home

This repo scaffolds a Next.js (App Router) + Prisma project for the AI chat assignment.

What this scaffold includes:
- Next.js app skeleton (App Router)
- Prisma schema for User, Chat and Message (Postgres datasource)
- .env.example listing required environment variables
- Basic dependencies installed (next, react, prisma, @prisma/client, next-auth, pg)

What you'll still implement (guided steps below):
1) Authentication (NextAuth / Auth.js): set up providers or Credentials provider.
2) Prisma migrations: run prisma migrate to create tables in Postgres.
3) Chat UI: build a simple interface under /app that posts to a server-side API.
4) Claude integration: server-side API route that calls Anthropic/Claude using CLAUDE_API_KEY.
5) Persist messages to Prisma so chat history is stored per-user.

Quick start (local)
1. Copy .env.example to .env and fill in values (DATABASE_URL, NEXTAUTH_SECRET, CLAUDE_API_KEY, NEXTAUTH_URL).
2. Install deps: npm install
3. Initialize Prisma client and run migration:
   - npx prisma generate
   - npx prisma migrate dev --name init
4. Start dev server: npm run dev (you may want to add a script in package.json: "dev": "next dev")

Notes and decisions
- Database: Prisma + Postgres (preferred). If you don't have Postgres locally, use a Postgres docker image or switch the datasource to SQLite for quick prototyping.
- Auth: this scaffold targets NextAuth/Auth.js (Next.js integration). The README and code will walk through wiring the API route.
- Model: the data model is intentionally minimal (User, Chat, Message) so chat history can be queried per user.

Next actions (I can help step-by-step):
- Wire NextAuth (API route, providers, session callbacks).
- Add the server-side Claude API endpoint and a minimal client-side chat UI.
- Add migrations and test end-to-end locally.

If you'd like to proceed, pick the next task you'd like help with:
- "Wire Auth (NextAuth) with Credentials provider"
- "Add Prisma migrations and seed script"
- "Create server-side Claude API route"
- "Implement chat UI (App Router)"
