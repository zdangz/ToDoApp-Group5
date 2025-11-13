# Todo App - Quick Start

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set a secure JWT_SECRET (at least 32 characters).

3. **Seed Singapore holidays:**
   ```bash
   npm run seed-holidays
   ```
   
   This populates 22 Singapore public holidays for 2025-2026.

4. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## First Time Use

1. Go to `/login`
2. Enter a username
3. Click "Register"
4. Start creating todos!

## Features

- ✅ Create, read, update, delete todos
- ✅ Priority system (high/medium/low)
- ✅ Due dates with Singapore timezone
- ✅ Mark todos as complete
- ✅ Dark mode support
- ✅ Simple authentication

## Production Notes

This is a simplified version for local development. The full production version includes:
- WebAuthn/passkey authentication
- Recurring todos
- Reminders & notifications
- Subtasks & progress tracking
- Tags & categories
- Templates
- Calendar view
- Export/import
- And more!

See `USER_GUIDE.md` for complete feature documentation.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- SQLite (better-sqlite3)
- JWT sessions

## Database

The SQLite database (`todos.db`) is automatically created on first run.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed-holidays` - Seed Singapore public holidays (2025-2026)
