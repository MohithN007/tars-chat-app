Real-Time Chat Application

A production-grade 1–1 real-time messaging system built using Next.js (App Router), TypeScript, Convex, and Clerk.

This project demonstrates modern full-stack architecture with real-time data synchronization, authentication lifecycle management, presence tracking, and scalable backend design.

System Overview

The application allows authenticated users to discover other users, initiate direct conversations, exchange messages in real time, and interact through reactions and read receipts. All state changes propagate instantly through Convex’s reactive query model.

The system is designed with correctness, scalability, and type safety in mind.

Technology Stack

Frontend

Next.js 14 (App Router)

TypeScript

Tailwind CSS

Backend

Convex (database, queries, mutations, indexing, real-time subscriptions)

Authentication

Clerk (session management, production-ready auth)

Deployment

Vercel (frontend)

Convex Cloud (backend)


Data Flow

The client subscribes to live queries using Convex hooks.

Mutations update the database.

Convex automatically re-evaluates affected queries.

Only impacted clients receive real-time updates.

UI re-renders with synchronized state.

No manual WebSocket handling is required.

Design Decisions

Conversations store sorted member IDs to prevent duplicates.

Unread message counts are derived using indexed read receipts rather than stored counters.

Typing indicators use expiration timestamps to avoid stale presence states.

Messages use soft deletion to preserve conversation history integrity.

All database interactions are type-safe through Convex’s generated TypeScript types.

Core Capabilities

Authentication is handled entirely through Clerk with separate development and production instances.

The messaging layer supports:

Real-time delivery

Typing indicators with expiry

Online/offline presence tracking

Read receipts and unread counts

Emoji reactions

Soft deletion

Responsive UI

Smart auto-scroll behavior

The architecture is extensible for:

Group messaging

Media attachments

Push notifications

Rate limiting

Access control rules

Local Development

Clone the repository:

git clone https://github.com/your-username/tars-chat-app.git
cd tars-chat-app

Install dependencies:

npm install

Create .env.local:

NEXT_PUBLIC_CONVEX_URL=your_dev_convex_url
CONVEX_DEPLOYMENT=dev:your_project_name

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

Start backend:

npx convex dev

Start frontend:

npm run dev
Production Deployment

Deploy Convex:

npx convex deploy

Configure Clerk production instance and whitelist your production domain.

Add production environment variables in Vercel:

NEXT_PUBLIC_CONVEX_URL=...
CONVEX_DEPLOY_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...


Push to GitHub and deploy via Vercel.



Engineering Highlights

Real-time reactive data layer without manual socket management

Indexed query design for scalable conversation lookup

Strict TypeScript enforcement across client and backend

Clean separation of UI, data, and business logic

Production-grade auth + deployment pipeline




Author

Mohith
Fullstack Developer
