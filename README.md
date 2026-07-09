# Reno Platforms Notice Board

A polished, responsive Notice Board application built using **Next.js Pages Router**, **Prisma ORM**, and **Tailwind CSS**. It supports complete Create, Read, Update, and Delete (CRUD) operations connected to a serverless hosted database (e.g. Supabase or Neon).

## Features
- **Responsive Layout**: Designed for mobile and desktop screens.
- **Urgent-First Ordering**: Urgent notices are pinned to the top of the board using a database-level sorting query (`orderBy`), and carry a pulsing red "Urgent" badge.
- **Unified Slide-Over Modal**: Dynamic form handles both notice creation and editing, pre-populating fields on edit requests.
- **Delete Confirmation Dialog**: Built-in modal safety step to prevent accidental deletions.
- **Interactive Search & Filtering**: Client-side filtering by category (Exams, Events, General), priorities, or title/description keywords.
- **Smart Image compression (Bonus)**: Accepts image URLs or local file uploads. Local files are compressed and resized on a canvas *in the browser* to ~20KB before database injection, ensuring rapid page loads and database storage friendliness.

---

## Getting Started

### 1. Prerequisites
Ensure you have **Node.js (v18+)** installed.

### 2. Database Setup (Supabase / Postgres)
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Navigate to **Project Settings** (gear icon) -> **Database** -> **Connection string** -> select **URI** (or Transaction Pooler).
3. Copy the database connection URI. It will look like:
   ```text
   postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```
4. Create a `.env` file in the root directory of this project:
   ```bash
   cp .env.example .env
   ```
5. Paste your copied URI into the `.env` file as `DATABASE_URL`, replacing `[YOUR_PASSWORD]` with your actual database password.

### 3. Initialize Database Tables
Run the Prisma sync command to build the tables in your Supabase database:
```bash
npx prisma db push
```

### 4. Run the Local Development Server
Install dependencies and start the Next.js dev server:
```bash
npm install --legacy-peer-deps
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the Notice Board.

### 5. Build for Production
To build and check compilation for Vercel deployment:
```bash
npm run build
```

---

## Future Improvements (With More Time)
1. **Supabase Storage Integration**: Instead of storing optimized Base64 image strings in the database, I would set up a Supabase Storage bucket and upload files directly using the Supabase Client SDK, saving DB row space.
2. **Role-Based Access Control (RBAC)**: Implement authentication (such as NextAuth.js or Supabase Auth) so only authorized admin/faculty roles can create, edit, or delete notices, while students have read-only access.
3. **Real-time Synchronization**: Use Supabase Database Webhooks or Realtime channels to broadcast new notices instantly to all active browsers without requiring page reloads or polling.

---

## AI Usage Disclosure
This project was developed with the assistance of **Antigravity (built by Google DeepMind)**, an agentic AI coding companion:
- **Scaffolding and Setup**: The agent initialized the Pages Router layout, configured peer dependencies for React 19, and set up the Postgres Prisma schemas.
- **UI & UX Polish**: Guided the development of the responsive dashboard layout, stats indicators, modal structures, and custom svg integrations.
- **Problem Solving**: Assisted in resolving Tailwind CSS v4 native binary compilation conflicts on Windows by orchestrating a downgrade to a pure-JS Tailwind CSS v3 compiler.
- **Quality Assurance**: Assisted in manual and script-based browser verification to test the CRUD lifecycle, database-level sorting, and form validation.
