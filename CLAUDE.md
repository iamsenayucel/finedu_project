# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

FinEdu is a gamified financial-literacy platform for students from elementary school through university, with three roles: Student, Teacher, Admin. The repo contains **two independently deployed applications**:

- **Backend** (repo root): Django + Django REST Framework, deployed to Render (`finedu-project.onrender.com`).
- **Frontend** (`arayuz/`): React + TypeScript + Vite, deployed to Vercel.

They do not share a build step or package manager — treat them as separate projects that happen to live in one repo.

## Commands

### Backend (run from repo root)

```bash
venv\Scripts\activate          # Windows venv (already present at ./venv)
pip install -r requirements.txt

python manage.py runserver     # dev server
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py test          # Django test runner (accounts/tests.py is currently an empty scaffold)
```

Local Postgres for dev is available via `docker-compose.yml` (`postgres:15`, exposed on host port `5433`). Without a `DATABASE_URL` env var, Django falls back to local `db.sqlite3` (see `finedu_core/settings.py`).

### Frontend (run from `arayuz/`)

```bash
npm install
npm run dev       # Vite dev server
npm run build     # production build (vite build) — this is the only CI-equivalent check available; there is no lint or test script
```

There is no `npm run lint` or `npm test` configured. Use `npm run build` to catch TypeScript/JSX structural errors (esbuild-level, not full `tsc` type-checking — `typescript` isn't installed as a direct binary in this project).

## Architecture

### Backend: single-app Django project

- `finedu_core/` is the Django project (settings, root `urls.py`); `accounts/` is the only app and holds all models, views, serializers, and URLs for the entire platform (users, units, content, progress, classrooms, chatbot, analytics, admin reporting). There's no separation into multiple Django apps — new backend features generally go into `accounts/views.py` + `accounts/urls.py`.
- Two parallel URL surfaces exist: classic server-rendered Django views (`register_view`, `login_view`, `dashboard_view`, templates) and a JSON API under `/api/` (`accounts/urls.py`) consumed by the React frontend. The React app only talks to the `/api/` surface plus `/api/login/`, which is DRF's built-in `obtain_auth_token` (registered directly in `finedu_core/urls.py`, not in `accounts/urls.py`). Auth is DRF TokenAuthentication — the frontend stores the token in `localStorage` under `"token"` and sends `Authorization: Token <token>`.
- Content hierarchy: `Unit` (scoped to a `grade_level`) → `Subtopic` → `Content` (`VIDEO` or `GAME`). Games are selected via `Content.game_code`, a `CharField` with a `GAME_CHOICES` list in `accounts/models.py` — **that list is out of date** relative to what the frontend actually supports (see below), and since the field allows `null`/`blank`, choices aren't hard-enforced at the DB layer.
- Progress/gamification: `UserProgress` (one per student+content; `score` is only ever set on first completion, `play_count` increments on replay) and `UserBadge` (awarded once all `Content` in a `Unit` are completed — see `user_progress_api` in `accounts/views.py` for the badge-award logic and streak update via `CustomUser.update_streak()`).
- Media/video storage is Cloudinary in production (`STORAGES["default"]` in `settings.py`); static files are served via Whitenoise. Cloudinary credentials and `DATABASE_URL` (Neon Postgres) come from environment variables — never hardcode them.
- `SECRET_KEY` is currently hardcoded in `finedu_core/settings.py` and `DEBUG = True` is hardcoded (not env-gated) — be aware of this when touching settings; don't introduce more hardcoded secrets, and prefer moving existing ones to env vars if asked to touch this file.

### Frontend: React + Vite, `arayuz/src/`

- Two component trees exist side by side: `src/app/` (pages, layout components, routing) and `src/components/games/` (the standalone educational game components). `src/app/routes.ts` defines all top-level routes via `react-router`'s `createBrowserRouter` (`/`, `/login`, `/register`, `/dashboard`, `/unit/:unitId`, `/admin`, `/profile`).
- `src/components/games/GameContainer.tsx` maps a `game_code` string (from `Content.game_code`) to a specific game component via a `switch`. **When adding a new game**, it must be registered in three places that don't share a source of truth: `GameContainer.tsx`'s switch, the Django `GAME_CHOICES` in `accounts/models.py`, and the admin UI's game picker in `AdminPanel.tsx` — check all three.
- **No shared API client**: the backend base URL (`https://finedu-project.onrender.com`) is hardcoded as a literal string independently in every page/component that calls the API (`Login.tsx`, `Dashboard.tsx`, `AdminPanel.tsx`, `Profile.tsx`, `Register.tsx`, `UnitDetail.tsx`, `ChatBot.tsx`). There's no `fetch` wrapper, no env-based config, and no axios instance — if the backend URL ever changes, all of these need to be updated individually.
- Auth requests build headers manually per call: `{ "Authorization": \`Token ${localStorage.getItem("token")}\`, "Content-Type": "application/json" }`. There's no centralized auth interceptor.
- `src/app/utils/apiCache.ts` is a minimal in-memory TTL cache (5 min) used to avoid redundant GETs across page views; call `invalidateCache()` after mutations that should bust it (e.g. after login, per `Login.tsx`).
- **Render free-tier cold start**: the backend sleeps after inactivity. `Login.tsx` pings `/api/health/` on mount to warm the server, and retries the login request with a longer timeout (60s) if the first attempt (15s) aborts. Note this only handles normal cold-start sleep — if the backend gets stuck at boot (gunicorn logs show no "Booting worker" line after "Control socket listening"), retries won't help; the fix is a manual restart in the Render dashboard, not a frontend/backend code change.
- `UnitDetail.tsx` implements sequential content locking: content at index N is locked unless the content at index N-1 is in the student's completed-IDs list — there's no backend-enforced ordering, it's purely a frontend gate.
- Path alias `@` → `src/` is configured in `vite.config.ts`. Vercel deploy uses `arayuz/vercel.json` to rewrite all paths to `/index.html` for SPA routing (client-side routes 404 on Vercel without this).
- Game components follow a shared visual pattern for side panels (glossary/strategy content flanking the game): outer `max-w-7xl` wrapper, `flex gap-4 items-start`, `w-64 hidden lg:block sticky top-4` for left (cyan-themed) and right (amber-themed) panels, `flex-1 min-w-0` center column, with `AnimatePresence`/`framer-motion` for panel transitions keyed by scenario/stage index. When a game wraps content in `DndProvider` (react-dnd), the panel layout goes *inside* the provider.
