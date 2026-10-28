# PortfolioForge — Portfolio Website Generator

PortfolioForge is a beginner-friendly full-stack web application that lets a user register, create a personal portfolio, choose a template, customize its colors and appearance, edit portfolio sections, and preview the result live.

## Problem statement

Students and early-career professionals often need a personal website but may not know how to design and build one from scratch. PortfolioForge provides a simple editor and reusable layouts so users can present their skills, projects, education, and contact details.

## Objectives

- Make portfolio creation straightforward for beginners.
- Demonstrate frontend, REST API, authentication, and database concepts.
- Store portfolio data persistently in Supabase PostgreSQL.
- Keep each user's portfolio data private from other signed-in users.

## Implemented features

1. User registration and login (passwords hashed with bcrypt).
2. Three templates: Minimal, Bold, and Classic.
3. Live preview as fields change.
4. Accent color and light/dark appearance controls.
5. Show/hide About, Skills, Projects, Education, and Contact sections.
6. Responsive editor and preview layout.
7. Save portfolios to the database and start another draft.
8. Open a separate preview tab.
9. Express API validation, JWT authentication, rate limiting for authentication routes, security headers, and per-user portfolio ownership checks.

**MVP note:** the app stores multiple portfolios and can load the most recently updated one when a user signs in. A portfolio list/selector and public publishing URL are not included in this first version. “Open preview” opens a local preview in a new browser tab; it is not a public hosting feature.

## Technology stack

- HTML5, CSS3, Vanilla JavaScript
- Node.js and Express.js
- Supabase PostgreSQL
- `@supabase/supabase-js`, `bcryptjs`, `jsonwebtoken`, `helmet`, `cors`, `express-rate-limit`, `dotenv`
- Git and GitHub

## Folder structure

```text
portfolio-generator/
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── backend/
│   ├── server.js
│   ├── supabase.js
│   ├── routes/auth.js
│   ├── routes/portfolios.js
│   ├── middleware/authenticate.js
│   ├── utils/validation.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── database/schema.sql
├── .gitignore
└── README.md
```

## Prerequisites

Install:
- [Node.js LTS (includes npm)](https://nodejs.org/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/downloads)
- A free [Supabase](https://supabase.com/) account and project

Check installations in a new terminal:

```powershell
node --version
npm --version
git --version
```

Each command should print a version number. If a command is not recognized, install that tool and reopen the terminal.

## 1. Set up Supabase

1. Sign in to Supabase and create a new project.
2. Open **SQL Editor** in the project dashboard.
3. Open `database/schema.sql`, copy the complete SQL, paste it into the editor, and click **Run**.
4. Open **Table Editor** and confirm that `profiles` and `portfolios` exist.
5. Open **Project Settings → API** and copy the Project URL and the server-side service-role/secret key. Supabase may label the newer privileged key as a secret key; use the appropriate server-only key available to your project.

The application uses its own profile/password table for this student MVP, not Supabase Auth. Passwords are hashed with bcrypt before they are stored. The service-role key bypasses RLS, so the Express API must remain the only way this application accesses these tables. Never place the service-role key in browser JavaScript, HTML, GitHub, or screenshots.

## 2. Configure the backend

Open a terminal in the `portfolio-generator/backend` directory:

```powershell
npm install
Copy-Item .env.example .env
```

Open `backend/.env` and replace the example values:

```dotenv
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_REAL_SERVER_SIDE_KEY
JWT_SECRET=PASTE_A_LONG_RANDOM_SECRET_HERE
CORS_ORIGIN=
```

Generate a JWT secret by running this command in the backend directory:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy its output into `JWT_SECRET`. Do not commit `.env`. The `.env.example` file contains placeholders and should be committed.

## 3. Run the application

From `portfolio-generator/backend`:

```powershell
npm run dev
```

Expected terminal output:

```text
PortfolioForge is running at http://localhost:3000
```

Open **http://localhost:3000** in your browser. The Express server serves the frontend and API from the same origin. Create an account, fill in the editor, change the template or accent color, and save.

Check database/API status by opening **http://localhost:3000/api/health**. A working configuration returns JSON with `"ok": true` and `"database": "connected"`.

For a non-development run, use `npm start`.

## Architecture

1. The browser renders the UI with HTML and CSS.
2. Vanilla JavaScript updates the live preview and uses `fetch()` to call Express.
3. Express validates incoming requests and verifies signed JWTs for private routes.
4. The server uses the Supabase client to store and retrieve PostgreSQL records.
5. Every portfolio read/update/delete is filtered by the authenticated user's ID.

## API endpoints

All responses are JSON. Private endpoints require `Authorization: Bearer <token>`.

| Method | Path | Purpose | Access |
|---|---|---|---|
| GET | `/api/health` | API and database health check | Public |
| POST | `/api/auth/register` | Create an account | Public; rate limited |
| POST | `/api/auth/login` | Verify credentials and issue a 2-hour JWT | Public; rate limited |
| GET | `/api/auth/me` | Get current profile | Signed-in user |
| GET | `/api/portfolios` | List current user's portfolios | Signed-in user |
| POST | `/api/portfolios` | Save a new portfolio | Signed-in user |
| PUT | `/api/portfolios/:id` | Update own portfolio | Owner only |
| DELETE | `/api/portfolios/:id` | Delete own portfolio | Owner only |

Registration body: `{ "name": "Example User", "email": "user@example.com", "password": "at-least-8-characters" }`.

Portfolio create/update body: `{ "content": { "title": "My Portfolio", "personName": "Example User", "template": "minimal", "accent": "#6d5ce8", "appearance": "light" } }`. Other supported content fields are `headline`, `about`, `contactEmail`, `location`, `skills`, `projects`, `education`, `showAbout`, `showSkills`, `showProjects`, `showEducation`, and `showContact`.

Common errors: `400` invalid input, `401` missing/invalid login, `404` record not found or not owned by the current user, `409` duplicate email, `429` too many authentication attempts, `500` server/database error, and `503` health check cannot reach the database.

## Manual testing checklist

- [ ] Register with a valid name, email, and password (8+ characters): account is created.
- [ ] Register again with the same email: a friendly duplicate-account message appears.
- [ ] Log in with the correct password: editor opens.
- [ ] Log in with an incorrect password: login is rejected.
- [ ] Change name, skills, projects, template, accent, and appearance: preview updates immediately.
- [ ] Toggle each section: that section appears/disappears in the preview.
- [ ] Save the portfolio: success status appears and record persists in Supabase.
- [ ] Refresh and log in again: most recently updated portfolio is loaded.
- [ ] Click Open preview: a new tab shows the current preview.
- [ ] Open `/api/health`: database should be connected.
- [ ] Resize the browser to phone width: editor and preview stack vertically.
- [ ] Call a private API without a token: API returns `401`.
- [ ] Try to update a portfolio belonging to another account: API returns `404`.

## Troubleshooting

- **`npm` is not recognized:** install Node.js LTS, close and reopen the terminal, then run `node --version` and `npm --version`.
- **Missing environment variables:** confirm you created `backend/.env`, filled all required values, and started the server from `backend`.
- **Health check returns 503:** check `SUPABASE_URL`, the server-side key, internet connection, and that `database/schema.sql` ran successfully.
- **Registration returns 500:** check the Supabase table and column names match the schema.
- **Port is already in use:** set `PORT=3001` in `.env` and open `http://localhost:3001`.
- **Login says invalid credentials:** check email spelling and password; passwords are case-sensitive.
- **Preview does not open:** allow pop-ups for localhost.
- **Changes do not save:** check the API response and terminal; make sure the browser still has a valid session token.

## GitHub upload

Run these commands from the project root (`portfolio-generator`):

```powershell
git init
git status
git add .
git status
git commit -m "Build PortfolioForge"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Create an empty repository on GitHub first and replace `YOUR_GITHUB_REPOSITORY_URL` with its actual URL. Before committing, verify that `.env`, `node_modules/`, real credentials, private user information, and database exports are not staged. `.gitignore` prevents new untracked secrets from being added, but it does not remove secrets already committed. If a key is exposed, rotate it immediately and clean the repository history as needed.

## Security and limitations

- Passwords are hashed using bcrypt; they are not stored as plain text.
- JWTs expire after two hours and are stored in `sessionStorage` in the browser for this educational MVP. A production app should consider secure, HTTP-only cookies, CSRF protections, stronger monitoring, and a managed authentication provider.
- Keep the Supabase service-role/secret key server-side only.
- RLS is enabled with no direct browser policies. The Express server uses a privileged key and performs ownership checks on every portfolio operation.
- There is no password reset, email verification, public publishing/hosting, or portfolio selector in this MVP. Add these before using it as a public production service.
