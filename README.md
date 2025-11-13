# 📝 Todo App - Modern Task Management

> A feature-rich, production-ready todo application built with Next.js 15, React 19, and WebAuthn authentication.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## ✨ Features

### 🔐 **Secure Authentication**
- WebAuthn/Passkey authentication (no passwords!)
- JWT session management with HTTP-only cookies
- Device biometrics support (fingerprint, face ID)
- 7-day session expiry

### 📋 **Smart Todo Management**
- **Priority Levels**: High (🔴), Medium (🟡), Low (🔵)
- **Due Dates**: Intelligent time-based display with overdue tracking
- **Recurring Tasks**: Daily, weekly, monthly, and yearly patterns
- **Reminders**: 15min, 30min, 1hr, 1day, 2day, 1week before due date
- **Subtasks**: Break down complex todos into manageable steps
- **Tags**: Organize todos with custom color-coded labels
- **Search & Filter**: Advanced filtering by priority, tags, status, and more

### 🎯 **Advanced Features**
- **Templates**: Reusable todo patterns with predefined subtasks
- **Calendar View**: Visual monthly calendar with todo highlights
- **Export/Import**: Backup and restore your todos (JSON format)
- **Singapore Timezone**: All operations use `Asia/Singapore` timezone
- **Dark Mode**: Automatic theme switching based on system preferences
- **Responsive Design**: Works seamlessly on desktop and mobile

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/zdangz/ToDoApp-Group5.git
   cd ToDoApp-Group5
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### First Time Setup

1. On the login page, enter a username and click **"Register"**
2. (Production only) Complete WebAuthn biometric authentication
3. Start adding todos!

> **Note**: Development mode uses simplified authentication. See [Authentication](#authentication) for production setup.

---

## 📚 Documentation

- **[Getting Started Guide](GETTING_STARTED.md)** - Detailed installation and setup
- **[Quick Start](QUICKSTART.md)** - Quick reference for common tasks
- **[User Guide](docs/USER_GUIDE.md)** - Comprehensive feature documentation (2000+ lines)
- **[Railway Deployment](docs/RAILWAY_DEPLOYMENT.md)** - Deploy to Railway platform
- **[MCP SQLite Guide](docs/MCP_SQLITE_GUIDE.md)** - Database management and inspection

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React features
- **TypeScript 5.3** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **better-sqlite3** - Fast, synchronous SQLite database
- **jose** - JWT token management

### Authentication
- **@simplewebauthn/server** - WebAuthn server-side verification
- **@simplewebauthn/browser** - WebAuthn client-side API

### Testing
- **Playwright** - End-to-end testing framework
- Virtual authenticators for WebAuthn testing

---

## 📁 Project Structure

```
ToDoApp-Group5/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── todos/        # Todo CRUD operations
│   │   ├── tags/         # Tag management
│   │   └── templates/    # Template operations
│   ├── calendar/         # Calendar view page
│   ├── login/            # Authentication page
│   ├── page.tsx          # Main todo page (~2200 lines)
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── lib/                   # Core library code
│   ├── db.ts             # Database schema & operations (~700 lines)
│   ├── auth.ts           # JWT session management
│   └── timezone.ts       # Singapore timezone utilities
├── middleware.ts          # Route protection
├── tests/                 # Playwright E2E tests
│   ├── helpers.ts        # Test utilities
│   └── *.spec.ts         # Test suites
├── docs/                  # Documentation
├── .github/              # GitHub configuration
└── todos.db              # SQLite database (auto-created)
```

---

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server on localhost:3000

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint

# Testing
npm test             # Run all Playwright tests
npm run test:ui      # Run tests in interactive UI mode
npm run test:report  # View test report
```

---

## 🗄️ Database Schema

### Core Tables

- **users** - User accounts
- **authenticators** - WebAuthn credentials
- **todos** - Todo items with priority, due dates, recurrence
- **subtasks** - Checklist items for todos
- **tags** - Custom labels with colors
- **todo_tags** - Many-to-many relationship
- **templates** - Reusable todo patterns
- **holidays** - Singapore public holidays

### Key Features

- ✅ Foreign key constraints with CASCADE delete
- ✅ Automatic timestamps (created_at, updated_at)
- ✅ Synchronous operations (no async/await for DB)
- ✅ WAL mode for better concurrency
- ✅ Type-safe interfaces exported from `lib/db.ts`

---

## 🔐 Authentication

### Development Mode (Current)
- Simplified username-based authentication
- Instant login/register for testing
- JWT session cookies (7-day expiry)

### Production Mode (Full WebAuthn)
- Passkey/biometric authentication
- No passwords stored
- Device-bound credentials
- Sync across devices with cloud providers

To enable full WebAuthn:
1. Update `.env` with production values:
   ```env
   RP_ID=yourdomain.com
   RP_ORIGIN=https://yourdomain.com
   NODE_ENV=production
   ```
2. Deploy to HTTPS-enabled server
3. WebAuthn requires secure context (HTTPS)

---

## 🌐 Deployment

### Railway (Recommended)

Railway provides persistent SQLite storage:

```bash
# Install Railway CLI
npm install -g railway

# Login and initialize
railway login
railway init

# Set environment variables
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set NODE_ENV=production

# Deploy
railway up
```

See [Railway Deployment Guide](docs/RAILWAY_DEPLOYMENT.md) for detailed instructions.

### Vercel / Netlify

⚠️ **Note**: SQLite is not persistent on serverless platforms. Use Railway or deploy with external database (PostgreSQL, MySQL).

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npx playwright test

# Interactive mode
npx playwright test --ui

# Specific test file
npx playwright test tests/01-authentication.spec.ts

# View report
npx playwright show-report
```

### Test Coverage

- ✅ Authentication (register, login, logout)
- ✅ Todo CRUD operations
- ✅ Priority levels and filtering
- ✅ Due dates and overdue tracking
- ✅ Recurring todos
- ✅ Subtasks management
- ✅ Tags and filtering
- ✅ Templates
- ✅ Search functionality
- ✅ Export/Import
- ✅ Calendar view

Tests use virtual WebAuthn authenticators configured in `playwright.config.ts`.

---

## 🎨 Customization

### Theme Colors

Edit `app/globals.css`:
```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}
```

### Tailwind Configuration

Modify `tailwind.config.ts` for custom colors, spacing, etc.

### Singapore Timezone

To change timezone, update `lib/timezone.ts`:
```typescript
const TIMEZONE = 'America/New_York'; // Example
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Use conventional commit messages
- Ensure `npm run lint` passes

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Group 5**
- Project Repository: [github.com/zdangz/ToDoApp-Group5](https://github.com/zdangz/ToDoApp-Group5)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [SimpleWebAuthn](https://simplewebauthn.dev/) - WebAuthn library
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - SQLite database
- [Playwright](https://playwright.dev/) - Testing framework

---

## 📞 Support

- **Documentation**: Check the [docs/](docs/) folder
- **Issues**: Open an issue on [GitHub](https://github.com/zdangz/ToDoApp-Group5/issues)
- **Discussions**: Use GitHub Discussions for questions

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Team collaboration features
- [ ] File attachments for todos
- [ ] Voice input for creating todos
- [ ] Analytics dashboard
- [ ] AI-powered task suggestions
- [ ] Multiple timezone support
- [ ] Integrations (Google Calendar, Slack, etc.)

---

<div align="center">
  
**Made with ❤️ by Group 5**

⭐ Star this repo if you find it helpful!

</div>
