# Getting Started - Run Todo App on localhost:3000

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 18.0.0 or higher)
- **npm** (comes with Node.js)

Check your versions:
```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 8.0.0 or higher
```

---

## Step-by-Step Installation

### 1. Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all required packages including:
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- SQLite (better-sqlite3)
- Authentication libraries (jose)
- And more...

**Expected output:** You should see a progress bar and "added XXX packages" message.

---

### 2. Set Up Environment Variables

Create your environment file:

```bash
cp .env.example .env
```

**Optional:** Edit the `.env` file to customize settings:

```bash
# Open .env in your editor
nano .env
# or
code .env
```

Default `.env` contents:
```env
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
RP_ID=localhost
RP_NAME=Todo App
RP_ORIGIN=http://localhost:3000
DATABASE_PATH=./todos.db
NODE_ENV=development
```

> **Important:** For production, change `JWT_SECRET` to a secure random string of at least 32 characters.

---

### 3. Start the Development Server

Run the development server:

```bash
npm run dev
```

**Expected output:**
```
> todo-app@1.0.0 dev
> next dev

  ▲ Next.js 15.0.0
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

✓ Ready in 2.3s
```

---

### 4. Open Your Browser

Navigate to:
```
http://localhost:3000
```

You will be automatically redirected to the login page at:
```
http://localhost:3000/login
```

---

## First Time Setup

### Register a New Account

1. **On the login page**, you'll see:
   - Username input field
   - "Login" button (green)
   - "Register" button (blue)

2. **Enter a username** (e.g., "john" or "sarah")

3. **Click the "Register" button**

4. **You'll be automatically logged in** and redirected to the main todo page

### Start Using the App

Once logged in, you can:

✅ **Create a todo:**
- Enter a title in the text input
- Select priority (Low/Medium/High)
- Optionally set a due date
- Click "Add"

✅ **Manage todos:**
- Check the checkbox to mark as complete
- Click "Delete" to remove a todo
- View active and completed todos separately

✅ **Logout:**
- Click the "Logout" button in the top-right corner

---

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you'll see an error. To use a different port:

```bash
PORT=3001 npm run dev
```

Then open `http://localhost:3001`

### Installation Errors

**Problem:** `npm install` fails with build errors (especially on Windows)

**Solution:** You may need to install build tools:

**Windows:**
```bash
npm install --global windows-build-tools
```

**macOS:** Install Xcode Command Line Tools:
```bash
xcode-select --install
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install build-essential
```

Then retry:
```bash
npm install
```

### Database Issues

**Problem:** Database errors or "SQLITE_CANTOPEN"

**Solution:** 
1. Make sure you have write permissions in the project directory
2. Delete `todos.db` if it exists and restart the server
3. The database will be recreated automatically

### Module Not Found Errors

**Problem:** "Module not found" errors after starting the server

**Solution:**
1. Delete `node_modules` and `package-lock.json`:
   ```bash
   rm -rf node_modules package-lock.json
   ```
2. Clear Next.js cache:
   ```bash
   rm -rf .next
   ```
3. Reinstall:
   ```bash
   npm install
   npm run dev
   ```

### Page Not Loading

**Problem:** Browser shows "This site can't be reached"

**Solutions:**
- Check that the dev server is running (look for "Ready in X.Xs" message)
- Try `http://127.0.0.1:3000` instead of `localhost`
- Check your firewall settings
- Try a different browser

---

## Database Location

The SQLite database file is created at:
```
./todos.db
```

This file stores:
- Users
- Todos
- All your data

**Backup:** To backup your data, simply copy the `todos.db` file.

**Reset:** To start fresh, delete `todos.db` and restart the server.

---

## Additional Commands

### Build for Production

```bash
npm run build
```

This creates an optimized production build in `.next/` directory.

### Run Production Build

```bash
npm run build
npm start
```

Production server will start on port 3000.

### Lint Code

```bash
npm run lint
```

Checks for code quality issues.

---

## Features Available in This Version

This simplified MVP includes:

✅ **Authentication**
- Simple username-based registration
- Login/logout functionality
- Session persistence (7 days)
- Protected routes

✅ **Todo Management**
- Create todos with title, priority, due date
- Mark todos as complete/incomplete
- Delete todos
- Automatic sorting by completion status

✅ **UI/UX**
- Clean, modern interface
- Dark mode support (follows system preference)
- Responsive design
- Real-time updates

✅ **Technical**
- SQLite database persistence
- JWT session management
- TypeScript for type safety
- Tailwind CSS for styling

---

## Next Steps

Once you're comfortable with the basic app, you can extend it with additional features from the PRD:

- 🔐 WebAuthn/passkey authentication
- 🔄 Recurring todos
- 🔔 Reminders & notifications
- ✅ Subtasks & progress tracking
- 🏷️ Tags & categories
- 📋 Templates
- 📅 Calendar view
- 🔍 Search & filtering
- 💾 Export/import

See `USER_GUIDE.md` for complete feature documentation.

---

## Support

If you encounter issues:

1. Check the terminal output for error messages
2. Review this guide's troubleshooting section
3. Check that all prerequisites are installed
4. Ensure you're in the project directory
5. Try deleting `node_modules` and reinstalling

---

**Happy task managing! 🎉**

Last updated: November 12, 2025
