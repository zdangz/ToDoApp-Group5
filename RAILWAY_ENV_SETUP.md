# Railway Environment Variables Setup

## Critical: Set These in Railway Dashboard

Go to your Railway project → **Variables** tab and add these:

### 1. Required Variables

```env
# Node Environment
NODE_ENV=production

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-generated-secret-here-minimum-32-characters

# WebAuthn Configuration - REPLACE WITH YOUR RAILWAY DOMAIN
NEXT_PUBLIC_RP_ID=your-app-name.up.railway.app
NEXT_PUBLIC_ORIGIN=https://your-app-name.up.railway.app

# Database Storage (if using persistent volume)
RAILWAY_VOLUME_MOUNT_PATH=/app/data
```

### 2. How to Get Your Railway Domain

After deploying, Railway assigns a domain like:
- `your-app-name.up.railway.app`

Or check in Railway Dashboard → **Settings** → **Domains**

### 3. Generate JWT Secret

Run this command locally:
```bash
openssl rand -base64 32
```

Copy the output and paste as `JWT_SECRET` value in Railway.

### 4. Example Configuration

If your Railway domain is `todo-app-prod.up.railway.app`:

```env
NODE_ENV=production
JWT_SECRET=abcdef123456789GENERATED_SECRET_HERE==
NEXT_PUBLIC_RP_ID=todo-app-prod.up.railway.app
NEXT_PUBLIC_ORIGIN=https://todo-app-prod.up.railway.app
RAILWAY_VOLUME_MOUNT_PATH=/app/data
```

## Persistent Volume Setup

### Why You Need This
SQLite database will be lost on each deployment without persistent storage!

### Steps:

1. In Railway Dashboard → Click **"+ New"**
2. Select **"Empty Volume"**
3. Configure:
   - **Name**: `todos-db`
   - **Mount Path**: `/app/data`
   - **Size**: 1GB (sufficient for this app)

4. Add environment variable:
   ```env
   RAILWAY_VOLUME_MOUNT_PATH=/app/data
   ```

### Verify Volume is Working

Check logs after deployment:
```
Initializing database at: /app/data/todos.db
Database initialized successfully
```

If you see `/app/todos.db` instead, the volume isn't mounted correctly.

## Common Issues

### Issue 1: "RP ID localhost is invalid"

**Problem**: WebAuthn environment variables not set or incorrect

**Solution**: 
- Set `NEXT_PUBLIC_RP_ID` to your Railway domain (no `https://`)
- Set `NEXT_PUBLIC_ORIGIN` to full URL with `https://`

### Issue 2: "Database not initialized"

**Problem**: App can't create database file

**Solutions**:
1. Ensure persistent volume is mounted at `/app/data`
2. Set `RAILWAY_VOLUME_MOUNT_PATH=/app/data`
3. Check Railway logs for permission errors

### Issue 3: Data Lost After Deployment

**Problem**: No persistent volume configured

**Solution**: Follow "Persistent Volume Setup" steps above

## Testing Your Configuration

### 1. Check Environment Variables

In Railway Dashboard → **Deployments** → **Logs**, look for:
```
Environment loaded: production
RP ID: your-app.up.railway.app
Origin: https://your-app.up.railway.app
```

### 2. Test WebAuthn Registration

1. Visit `https://your-app.up.railway.app/login`
2. Enter a username
3. Click "Register"
4. Should prompt for biometric (fingerprint/face)
5. If you see "RP ID localhost is invalid" → environment vars are wrong

### 3. Test Database Persistence

1. Register a user
2. Create a todo
3. Trigger a new deployment (push a commit)
4. After redeploy, your todo should still exist
5. If data is gone → volume not configured

## Quick Deploy Checklist

- [ ] `NODE_ENV=production` set
- [ ] `JWT_SECRET` generated and set (32+ characters)
- [ ] `NEXT_PUBLIC_RP_ID` set to Railway domain (no protocol)
- [ ] `NEXT_PUBLIC_ORIGIN` set to full HTTPS URL
- [ ] Persistent volume created
- [ ] `RAILWAY_VOLUME_MOUNT_PATH=/app/data` set
- [ ] Volume mounted at `/app/data`
- [ ] Deployment successful
- [ ] Can register with biometric auth
- [ ] Todos persist after redeployment

## Support

If issues persist:
1. Check Railway logs: `railway logs`
2. Review deployment logs in Railway Dashboard
3. Verify all environment variables are set correctly
4. Ensure volume mount path matches in both volume config and env var

---

**Last Updated**: November 13, 2025
