# Teaching Evaluation — Frontend

A web application for observing and evaluating university teaching sessions. Observers fill out structured evaluation forms during class visits, generate PDF/DOCX reports, and provide recommendations to instructors.

**Live site:** https://teachingeval.netlify.app

---

## What does this app do?

| Role | Can do |
|------|--------|
| **Observer** | Fill out evaluation forms, write activity logs, generate reports |
| **Instructor** | View their own evaluation reports and recommendations |
| **Admin** | Manage users, roles, and editable page content |

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| [React 19](https://react.dev) | UI framework |
| [Vite](https://vitejs.dev) | Dev server & build tool |
| [React Bootstrap](https://react-bootstrap.github.io) | UI components |
| [Zustand](https://zustand-demo.pmnd.rs) | Global state (auth, evaluation) |
| [TanStack Query](https://tanstack.com/query) | Server data fetching & caching |
| [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) | Forms & validation |
| [TipTap](https://tiptap.dev) | Rich text editor |
| [Google Gemini AI](https://ai.google.dev) | AI-assisted content generation |
| [React PDF](https://react-pdf.org) | PDF report generation |

---

## Prerequisites

Before you start, make sure you have installed:

- **Node.js** v20 or higher — [download here](https://nodejs.org)
- **npm** (comes with Node.js)

Check your versions:
```bash
node --version   # should be >= 20
npm --version
```

---

## Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/sri-tella/TE-frontend.git
cd TE-frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your values:
```bash
cp .env.example .env.development
```

Open `.env.development` and set:
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_GEMINI_API_KEY=your_google_gemini_api_key_here
```

> **Getting a Gemini API key:** Go to [Google AI Studio](https://aistudio.google.com), sign in, and create a free API key.

> **Backend URL:** If the backend is running locally, keep `http://localhost:8080`. To use the hosted backend instead, set `https://te-backend-production.up.railway.app`.

### 4. Start the development server
```bash
npm run dev
```

Open your browser at **http://localhost:5173**

---

## Available Scripts

```bash
npm run dev      # Start dev server with hot reload
npm run build    # Build for production (output → /dist)
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint
```

---

## Project Structure

```
src/
├── api/          # Functions that call the backend API
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── pages/        # One file per route/page
├── schemas/      # Zod validation schemas
├── store/        # Zustand global state stores
└── utils/        # Helper functions
```

### Key Pages

| Route | Page |
|-------|------|
| `/login` | Sign in |
| `/signup` | Create account |
| `/obs-home` | Observer / Admin dashboard |
| `/ins-home` | Instructor dashboard |
| `/evaluate` | Evaluation form |
| `/report-viewer` | View a report |
| `/reports` | All reports list |
| `/admin-management` | Admin user management |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_GEMINI_API_KEY` | Google Gemini API key for AI features |

> These variables are baked into the app **at build time** by Vite. In production they are set in Railway's environment settings — never commit real keys to git.

---

## Deployment

The frontend is deployed on **Netlify**.

- Every push to `main` triggers an automatic deploy
- Build command: `npm run build`
- Publish directory: `dist`
- SPA routing is handled by `netlify.toml` (all routes redirect to `index.html`)

---

## Common Issues

**`npm install` fails**
Make sure your Node.js version is 20 or higher.

**Blank page after login**
Check that `VITE_API_BASE_URL` is set correctly and the backend is running.

**AI features not working**
Make sure `VITE_GEMINI_API_KEY` is valid and has not exceeded its free quota.

**CORS error in the browser console**
The backend needs to have your frontend URL in its allowed origins list. See the backend README.
