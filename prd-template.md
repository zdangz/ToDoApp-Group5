# LLM-Assisted PRD Creator — Guided, Step-by-Step (Reverse Prompting)

## Behavior Rules (read carefully)
You are a senior product manager facilitating a concise but realistic PRD. 
Follow this loop on every turn until the PRD is complete:

1) Ask exactly ONE focused question for the next missing section.
2) Provide a short, concrete EXAMPLE answer (1–2 lines) for guidance.
3) Update the “Current PRD Draft” with the user’s latest answer ONLY in the relevant fields.
4) Show “What’s Next” (the next section you will ask about).
5) When all sections are filled, output ONLY the final PRD in Markdown (no examples, no guidance text).

Constraints:
- Keep questions short and specific.
- Don’t jump sections; fill in order.
- Keep the draft compact and readable.
- If the user’s answer is unclear, ask a micro follow-up (one line) before updating.

## Sections & Order
1. Product Overview (Title, Summary, Target Audience)
2. Goals & Success Metrics (Business Goals, User Goals, Key Metrics)
3. User Personas (1–2)
4. Core Features (3–5, with short description + priority)
5. User Journey (key steps from start to goal)
6. Technical Considerations (platforms, integrations, data, privacy)
7. Risks & Dependencies (top 2–4)
8. Timeline & Milestones (MVP → Beta → Launch)

## Current PRD Draft (update this block every turn)
PRD_DRAFT = {
  "Product Overview": {
    "Title": "Todo App - Modern Task Management with WebAuthn Authentication",
    "Summary": "A feature-rich Next.js 16 todo application providing secure passwordless authentication via WebAuthn/passkeys, comprehensive task management with priorities, recurring patterns, reminders, subtasks, tags, templates, and calendar visualization. Built with Singapore timezone support, SQLite persistence, and optimized for productivity workflows with real-time search, filtering, and data portability.",
    "Target Audience": "Individuals and professionals seeking a secure, feature-complete task management solution with advanced productivity features (recurring tasks, hierarchical subtasks, intelligent reminders) who value passwordless security and timezone-aware scheduling. Primary users: knowledge workers, project managers, students, and anyone managing complex personal/professional workflows requiring organization, deadline tracking, and progress visualization."
  },
  "Goals & Success Metrics": {
    "Business Goals": "Demonstrate modern full-stack web development capabilities using Next.js 16, React 19, WebAuthn authentication, and SQLite. Showcase AI-assisted development workflow via comprehensive PRPs (Product Requirement Prompts) for educational purposes. Provide production-ready deployment patterns for Railway/Vercel with enterprise-grade security (passwordless auth, HTTP-only cookies, JWT sessions).",
    "User Goals": "Efficiently manage tasks with minimal cognitive overhead through intuitive UI, automatic sorting, and visual prioritization. Achieve zero forgotten deadlines via intelligent reminders and recurring task automation. Maintain organized workflows using tags, templates, and hierarchical subtasks. Access secure, passwordless authentication without memorizing passwords. Visualize upcoming commitments via calendar with Singapore public holidays integration.",
    "Key Metrics": "User authentication success rate >95% (WebAuthn registration/login), Todo CRUD operations response time <300ms average, Search/filter performance <100ms for 1000+ todos, Notification delivery accuracy >99% (within 30s polling window), E2E test coverage >80% (Playwright), Lighthouse performance score >80, WCAG AA accessibility compliance, Zero data loss on export/import operations, Session persistence 7 days with automatic renewal."
  },
  "User Personas": [
    {
      "Name": "Sarah Chen",
      "Role/Segment": "Product Manager / Knowledge Worker",
      "Goals": "Manage multiple projects with deadlines, track recurring team meetings and quarterly reviews, break down complex deliverables into actionable subtasks, categorize work vs personal tasks, receive timely reminders for critical milestones, visualize monthly commitments on calendar alongside Singapore holidays.",
      "Pain Points": "Forgets passwords for task apps, misses deadlines without reminders, struggles to track progress on multi-step projects, loses context switching between personal and work tasks, needs timezone-accurate scheduling for distributed team coordination, requires data export for quarterly reporting."
    },
    {
      "Name": "Alex Kumar",
      "Role/Segment": "Graduate Student / Academic Researcher",
      "Goals": "Track assignment deadlines and exam schedules, manage daily study habits with recurring todos, organize research projects with subtasks (literature review, data collection, analysis), use tags to categorize courses and research topics, template common workflows (weekly reports, paper submissions), maintain academic calendar with term breaks.",
      "Pain Points": "Security concerns with password reuse, needs habit tracking for daily routines (exercise, medication), requires hierarchical task breakdown for thesis chapters, wants quick setup for repetitive workflows, needs visual calendar to avoid scheduling conflicts during exam periods."
    }
  ],
  "Core Features": [
    {
      "Feature Name": "Todo CRUD Operations",
      "Description": "Complete task management system enabling create/read/update/delete of todos with priority, due dates, recurring patterns, reminders; organized into Overdue, Active, Completed with automatic sorting and optimistic UI updates (Singapore timezone support).",
      "Priority": "P0 - Critical"
    },
    {
      "Feature Name": "Priority System",
      "Description": "Three-tier priority (High/Medium/Low) with color-coded badges (red/yellow/blue), default medium, editable anytime, WCAG AA contrast compliant, supports light/dark modes and priority-based sorting/filters.",
      "Priority": "P0 - Critical"
    },
    {
      "Feature Name": "Recurring Todos",
      "Description": "Automated repetition for daily/weekly/monthly/yearly patterns; completing an instance creates the next with calculated Singapore timezone due date and inherited metadata; visual 🔄 badge indicates recurrence.",
      "Priority": "P1 - High"
    },
    {
      "Feature Name": "Reminders & Notifications",
      "Description": "Browser notifications with seven timing options (5,10,15,30 min,1,2,24 hrs before); requires permission; polling every 30s with duplicate prevention; visual 🔔 badge for reminder timing.",
      "Priority": "P1 - High"
    },
    {
      "Feature Name": "Subtasks & Progress Tracking",
      "Description": "Unlimited hierarchical subtasks per todo with real-time progress bar (X/Y completed), color-coded progress states, inline add/toggle/delete, expandable UI, and cascade delete for data integrity.",
      "Priority": "P1 - High"
    },
    {
      "Feature Name": "Tag System",
      "Description": "User-defined tags with custom colors managed via a modal; unique names per user; multi-tag assignment shown as badges; clicking a tag filters todos; tag edits propagate to associated todos.",
      "Priority": "P1 - High"
    },
    {
      "Feature Name": "Template System",
      "Description": "Reusable todo blueprints storing metadata and serialized subtasks (JSON); templates include name, description, category; using a template creates a new todo with offset due date and recreated subtasks.",
      "Priority": "P2 - Medium"
    },
    {
      "Feature Name": "Search & Filtering",
      "Description": "Real-time search with 300ms debounce, case-insensitive matching on titles and tags; combinable AND-filters (priority+tags); active filter summary and optimized for 1000+ todos (<100ms response).",
      "Priority": "P1 - High"
    },
    {
      "Feature Name": "Export & Import",
      "Description": "JSON export/import with versioning; export includes todos, subtasks, tags and associations; import validates format, remaps IDs, reuses existing tags on name conflicts, and reports operation counts.",
      "Priority": "P2 - Medium"
    },
    {
      "Feature Name": "Calendar View",
      "Description": "Month-based calendar showing todos on due dates with Singapore public holidays; navigation (prev/next/today), day badges, modal day view, weekend styling, and URL state (?month=YYYY-MM).",
      "Priority": "P2 - Medium"
    },
    {
      "Feature Name": "Authentication (WebAuthn)",
      "Description": "Passwordless WebAuthn/passkeys for registration and login using device biometrics or security keys; HTTP-only 7-day session cookies; middleware-protected routes and immediate logout clearing session.",
      "Priority": "P0 - Critical"
    }
  ],
  "User Journey": "1. **Registration** - User visits app, enters username, clicks 'Register', authenticates via device biometric (Touch ID, Face ID, Windows Hello), passkey created and stored securely. 2. **Login** - User selects username, authenticates with passkey, receives 7-day session cookie (HTTP-only, secure). 3. **Create Todo** - User enters task title, selects priority (high/medium/low), optionally sets due date/time in Singapore timezone, enables recurrence pattern (daily/weekly/monthly/yearly), sets reminder (15min to 1 week before), clicks 'Add'. 4. **Organize with Subtasks** - User expands todo, adds multiple subtasks, checks off completed items, views real-time progress bar updating (green at 100%). 5. **Categorize with Tags** - User opens tag manager, creates color-coded tags (Work, Personal, Urgent), assigns multiple tags to todos, clicks tag badge to filter view. 6. **Search & Filter** - User types search query (matches titles/tags), combines with priority filter and tag filter (AND logic), views filtered results with active filter summary, clears all with one click. 7. **Calendar Visualization** - User navigates to /calendar, views current month with todos on due dates, sees Singapore public holidays, clicks day to view todos in modal, navigates months via prev/next/today buttons. 8. **Receive Reminders** - User enables notifications (browser permission), receives notification when todo reminder time reached (e.g., 1 hour before due), clicks notification to open app. 9. **Templates for Efficiency** - User saves frequently used todo configuration as template (e.g., 'Weekly Report' with subtasks), later clicks 'Use Template', creates new todo with all settings pre-filled, adjusts due date offset. 10. **Export/Import Data** - User exports all todos to JSON file, transfers to another device/browser, imports file, all todos/subtasks/tags recreated with relationships preserved. 11. **Complete & Recur** - User checks off recurring todo (e.g., 'Daily standup'), next instance auto-created for tomorrow with same priority/tags/reminder, original moved to Completed section. 12. **Logout** - User clicks logout button, session cleared immediately, redirected to login page.",
  "Technical Considerations": "**Platform**: Web application built with Next.js 16 (App Router, React 19, TypeScript strict mode), deployed to Railway (recommended for SQLite persistence) or Vercel (with external DB). **Frontend**: Client-side React components with Tailwind CSS 4 for styling, dark mode via system preference detection, responsive design for mobile/desktop, optimistic UI updates for instant feedback. **Backend**: Next.js API routes (serverless functions) handling all database operations, session management via JWT (jose library), WebAuthn server integration (@simplewebauthn/server v10+). **Database**: SQLite via better-sqlite3 (synchronous operations, no async/await), schema includes users, authenticators, todos, subtasks, tags, todo_tags, templates, holidays tables, CASCADE delete for data integrity, indexes on user_id and due_date for query performance. **Authentication**: WebAuthn/Passkeys only (no passwords), registration generates credential and stores in authenticators table with base64url-encoded credential_id, login verifies challenge response and creates JWT session (7-day expiry), HTTP-only secure SameSite cookies, middleware protects / and /calendar routes. **Timezone**: Mandatory Singapore timezone (Asia/Singapore) for all date/time operations via custom lib/timezone.ts utilities (getSingaporeNow, formatSingaporeDate), applies to due dates, reminders, recurring calculations, holiday seeding. **Browser APIs**: Notification API for reminders (requires user permission), WebAuthn API for passkeys, localStorage for minimal client state (filter preferences). **Testing**: Playwright E2E tests with virtual authenticators, Singapore timezone emulation in test config, organized by feature (01-authentication.spec.ts to 12-calendar.spec.ts). **Performance**: Client-side filtering optimized for 1000+ todos (<100ms), 300ms debounced search, prepared statements for all DB queries, bundle size target <500KB gzipped. **Data**: Export/import via JSON with version field, ID remapping on import to avoid conflicts, tag name deduplication. **Privacy**: No external analytics by default, all data stored locally in SQLite, session tokens in HTTP-only cookies prevent XSS, WebAuthn credentials never exposed to JavaScript.",
  "Risks & Dependencies": "**Critical Dependencies**: @simplewebauthn/server and @simplewebauthn/browser libraries (version compatibility critical, breaking changes in v9→v10 required migration), better-sqlite3 native module (requires node-gyp build, platform-specific binaries), Next.js 16 App Router (async params pattern, middleware changes from v14/v15). **Browser Compatibility**: WebAuthn requires modern browsers (Chrome 67+, Firefox 60+, Safari 13+, Edge 18+), older browsers completely unsupported, mobile Safari <14 has limited passkey sync. **SQLite Limitations**: Single-file database not ideal for high concurrency (write locks), Vercel serverless functions reset filesystem on each deployment (requires migration to PostgreSQL or Railway with volumes), no built-in replication/backup (must implement manual export). **Timezone Complexity**: Singapore timezone (SGT, UTC+8) hardcoded throughout, requires careful testing for DST-observing regions, recurring todo calculations can drift if server timezone misconfigured, holiday calendar must be manually updated annually. **Notification Reliability**: Browser notifications require user permission (many users deny), background tabs may throttle polling (30s interval can slip to 60s+), notifications don't work in incognito mode, iOS Safari requires adding to Home Screen for persistent notifications. **Deployment Constraints**: Railway free tier has usage limits (500 hours/month, may sleep after inactivity), Vercel requires external database for production (SQLite resets), GitHub Actions deployment complex (requires RAILWAY_TOKEN, project linking), WebAuthn RP_ID must match production domain exactly (localhost vs deployed URL). **Testing Gaps**: Playwright virtual authenticators don't fully replicate real device behavior (biometric edge cases untested), E2E tests assume Singapore timezone (may fail in CI/CD in other regions), notification timing tests are flaky (30s polling window). **Data Migration**: No schema versioning strategy (future DB changes require manual migrations), export/import doesn't handle versioning conflicts (v1 export imported to v2 app may break), no rollback mechanism for failed imports.",
  "Timeline & Milestones": "**Phase 1 - Foundation (Weeks 1-2, MVP)**: Implement Todo CRUD operations with Singapore timezone support, Priority System with color-coded badges and automatic sorting, Authentication (WebAuthn) registration and login flows with JWT session management, basic UI with Tailwind CSS and dark mode, database schema setup (users, authenticators, todos tables), API routes scaffolding, deploy to Railway with environment variables configured. **Milestone**: Users can register with passkey, create/edit/delete todos with priorities, todos auto-sort by priority and due date, production deployment live with HTTPS. **Phase 2 - Core Features (Weeks 3-4)**: Recurring Todos (daily/weekly/monthly/yearly patterns with auto-generation on completion), Reminders & Notifications (browser notifications, 7 timing options, polling system), Subtasks & Progress Tracking (hierarchical checklists, progress bar visualization, cascade delete), E2E test suite setup (Playwright with virtual authenticators), middleware for route protection. **Milestone**: Users can set up recurring habits, receive timely reminders, break down complex tasks into subtasks with visual progress, all critical paths covered by automated tests. **Phase 3 - Organization (Weeks 5-6)**: Tag System (color-coded labels, many-to-many relationships, tag management modal), Search & Filtering (real-time search with 300ms debounce, combinable filters, empty state handling), optimize performance for 1000+ todos, accessibility audit (WCAG AA compliance), responsive design for mobile. **Milestone**: Users can categorize todos with custom tags, quickly find tasks via search/filters, app performs smoothly at scale, accessible to keyboard and screen reader users. **Phase 4 - Productivity (Weeks 7-8)**: Template System (save/reuse todo configurations, subtask JSON serialization), Export & Import (JSON-based data portability, ID remapping, validation), Calendar View (monthly visualization, Singapore holidays integration, URL state management), comprehensive documentation (USER_GUIDE.md, deployment guides). **Milestone**: Users can accelerate workflows with templates, backup/restore all data, visualize commitments on calendar, complete documentation for self-service onboarding. **Phase 5 - Launch Readiness (Week 9)**: Final E2E test coverage (all 11 features), performance optimization (Lighthouse score >80), security hardening (rate limiting, input validation), cross-browser testing (Chrome, Firefox, Safari, Edge), production monitoring setup, bug fixes and polish based on beta user feedback. **Milestone**: Production-ready application with >95% test coverage, <300ms API response times, zero critical bugs, deployed to Railway with persistent SQLite volumes, comprehensive evaluation checklist completed (EVALUATION.md 180+/200 points)."
}

## Final Output Template (use ONLY at the end)
When all fields above are filled, output just this Markdown with all placeholders replaced. Do not include examples, guidance, or meta text.

# Product Requirements Document (PRD)

## 1. Product Overview
**Title:** {{Title}}  
**Summary:** {{Summary}}  
**Target Audience:** {{Target Audience}}

## 2. Goals & Success Metrics
- **Business Goals:** {{Business Goals}}
- **User Goals:** {{User Goals}}
- **Key Metrics:** {{Key Metrics}}

## 3. User Personas
{{#each User Personas}}
- **{{Name}} ({{Role/Segment}})**  
  - Goals: {{Goals}}  
  - Pain Points: {{Pain Points}}
{{/each}}

## 4. Core Features
{{#each Core Features}}
- **{{Feature Name}}** ({{Priority}}) — {{Description}}
{{/each}}

## 5. User Journey
{{User Journey}}

## 6. Technical Considerations
**Platforms:** Web application built with Next.js 16 (App Router), React 19, deployed to Railway or Vercel. Browser requirements: Modern browsers with WebAuthn support (Chrome 67+, Firefox 60+, Safari 13+, Edge 18+).

**Database:** SQLite via better-sqlite3 (synchronous operations), stored as single file (todos.db). Database schema includes users, authenticators, todos, subtasks, tags, templates, and holidays tables with proper CASCADE delete relationships.

**Authentication:** WebAuthn/Passkeys only (no traditional passwords) using @simplewebauthn/server and @simplewebauthn/browser. JWT sessions stored in HTTP-only cookies with 7-day expiry. Middleware protects authenticated routes.

**Key Integrations:**
- Browser Notification API for todo reminders (requires user permission)
- Singapore timezone handling (Asia/Singapore) for all date/time operations via custom timezone utilities
- Holiday API integration for Singapore public holidays

**Data & Privacy:**
- All user data stored locally in SQLite database file
- Session tokens use JWT with HTTP-only cookies
- WebAuthn credentials stored with base64url encoding
- No external data transmission except authentication challenges
- Timezone-aware calculations for recurring tasks and reminders

**Development & Testing:**
- TypeScript for type safety
- Tailwind CSS 4 for styling with dark mode support
- Playwright for E2E testing with virtual WebAuthn authenticators
- ESLint for code quality
- All API routes follow RESTful patterns with session validation

## 7. Risks & Dependencies
{{Risks & Dependencies}}

## 8. Timeline & Milestones
{{Timeline & Milestones}}

## Start the Guided Flow (turn 1)
Ask the first question about **Product Overview** and show a concise example.

Prompt structure for each turn:
- **Question:** <one focused question>  
- **Example (for guidance):** <one short example answer>  
- **Current PRD Draft:** <paste updated PRD_DRAFT block with only the fields filled so far>  
- **What’s Next:** <name the next section>