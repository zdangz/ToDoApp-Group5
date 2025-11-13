# Railway Deployment - Quick Fix Guide

## Issue Fixed ✅

**Problem:** SQLite database initialization during Docker build phase caused `SQLITE_IOERR_DELETE_NOENT` error.

**Solution:** Modified `lib/db.ts` to skip database initialization during Next.js build phase using `NEXT_PHASE` environment variable.

---

## Deployment Steps

### 1. Push Your Code to GitHub

```bash
git add .
git commit -m "Fix Railway deployment - skip DB init during build"
git push origin main
```

### 2. Deploy to Railway

#### Option A: Railway CLI

```bash
# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project (or create new one)
railway link

# Deploy
railway up
```

#### Option B: Railway Dashboard

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository: `zdangz/ToDoApp-Group5`
4. Railway will automatically detect Next.js and deploy

### 3. Configure Environment Variables

In Railway Dashboard → Your Project → Variables tab, add:

```env
NODE_ENV=production
JWT_SECRET=<generate-a-secure-32-character-secret>
NEXT_PUBLIC_RP_ID=<your-railway-domain>.up.railway.app
NEXT_PUBLIC_ORIGIN=https://<your-railway-domain>.up.railway.app
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

### 4. Configure Persistent Storage (CRITICAL for SQLite)

Railway provides persistent volumes for SQLite:

1. In Railway Dashboard → Your Project
2. Click "+ New" → "Empty Volume"
3. **Mount Path**: `/app/data`
4. **Size**: 1GB (free tier)

Then update environment variable:
```env
RAILWAY_VOLUME_MOUNT_PATH=/app/data
```

**Note:** Without persistent storage, your database will be lost on each deployment!

---

## Verification

### Check Deployment Status

```bash
# Using Railway CLI
railway status

# View logs
railway logs
```

### Test Your App

1. Visit: `https://<your-app>.up.railway.app`
2. Register a new account
3. Create a todo
4. Verify persistence after redeployment

---

## How the Fix Works

### Modified `lib/db.ts`:

```typescript
// Only initialize database if not in build phase
let db: Database.Database;

if (process.env.NEXT_PHASE === 'phase-production-build') {
  // During build, create a mock database object to prevent errors
  db = {} as Database.Database;
} else {
  // Normal runtime: initialize the real database
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
}

// Initialize database schema (skip during build)
if (process.env.NEXT_PHASE !== 'phase-production-build') {
  db.exec(`...`);
}
```

**What this does:**
- During `npm run build`: Creates a mock database object, skips initialization
- During runtime: Initializes real SQLite database with schema
- Prevents disk I/O errors during Docker build phase

---

## Troubleshooting

### Build Still Fails

**Check `package.json` scripts:**
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start -p ${PORT:-3000}"
  }
}
```

**Railway automatically sets `PORT` environment variable.**

### Database Not Persisting

**Issue:** Data lost after redeployment

**Solution:** Ensure volume is mounted correctly:
1. Volume created in Railway
2. `RAILWAY_VOLUME_MOUNT_PATH=/app/data` environment variable set
3. Volume mounted at `/app/data`

**Verify in logs:**
```bash
railway logs | grep "todos.db"
```

Should see: `/app/data/todos.db`

### Can't Connect to Database

**Check database path in logs:**
```typescript
// lib/db.ts shows path being used:
const dbPath = process.env.RAILWAY_VOLUME_MOUNT_PATH 
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'todos.db')
  : path.join(process.cwd(), 'todos.db');
```

### WebAuthn Not Working

**Issue:** Passkey authentication fails

**Cause:** WebAuthn requires HTTPS

**Solution:** Railway provides HTTPS by default at `*.up.railway.app`

Ensure environment variables match:
```env
NEXT_PUBLIC_RP_ID=your-app.up.railway.app
NEXT_PUBLIC_ORIGIN=https://your-app.up.railway.app
```

---

## File Changes Summary

### Modified Files:
- ✅ `lib/db.ts` - Skip DB init during build phase

### New Files:
- ✅ `railway.json` - Railway configuration
- ✅ `.dockerignore` - Optimize Docker builds
- ✅ `RAILWAY_DEPLOYMENT_FIX.md` - This guide

---

## Alternative: Use PostgreSQL on Railway

If you prefer PostgreSQL over SQLite:

### 1. Add PostgreSQL Service

In Railway Dashboard:
- Click "+ New" → "Database" → "Add PostgreSQL"
- Railway auto-provisions and connects

### 2. Install PostgreSQL Driver

```bash
npm install pg
npm uninstall better-sqlite3
```

### 3. Update `lib/db.ts`

Replace SQLite code with PostgreSQL connection:
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Use pool.query() instead of db.prepare()
```

---

## Cost Estimates

### Railway Free Tier:
- ✅ 500 hours/month execution time
- ✅ 1GB memory
- ✅ 1GB storage
- ✅ Automatic HTTPS
- ✅ Custom domains

**Perfect for this project!**

### Paid Plan ($5/month):
- More execution hours
- Priority support
- Advanced metrics

---

## Next Steps

1. ✅ Deploy to Railway
2. ✅ Configure environment variables
3. ✅ Set up persistent volume
4. ✅ Test WebAuthn authentication
5. ✅ Seed Singapore holidays:
   ```bash
   railway run npm run seed-holidays
   ```

---

## Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Project Issues**: https://github.com/zdangz/ToDoApp-Group5/issues

---

**Deployment Status:** ✅ Ready for Railway

**Last Updated:** November 13, 2025
