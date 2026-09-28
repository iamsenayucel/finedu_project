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
python manage.py check                            # Django system check
python manage.py makemigrations --check --dry-run # migration drift check (fails if models changed but no migration was committed)
python manage.py test                              # Django test runner — accounts/tests.py (69 tests as of AŞAMA 3)
```

Local Postgres for dev is available via `docker-compose.yml` (`postgres:15`, exposed on host port `5433`). Without a `DATABASE_URL` env var, Django falls back to local `db.sqlite3` (see `finedu_core/settings.py`). Tests always run against this local-fallback config (no `DATABASE_URL`/`OPENAI_API_KEY`/Cloudinary credentials needed — nothing in the test suite makes a real external network call).

### Frontend (run from `arayuz/`)

```bash
npm ci            # reproducible install from package-lock.json (use this, not `npm install`, in CI/fresh clones)
npm run dev       # Vite dev server
npm run lint      # ESLint (flat config, eslint.config.js)
npm run typecheck # tsc --noEmit — real TypeScript type-check, separate from the build
npm run test      # Vitest, watch mode
npm run test:run  # Vitest, single run (used in CI)
npm run build     # production build (vite build)
npm run test:e2e  # Playwright E2E — see "E2E tests" below
```

`npm run build` only proves the app bundles (esbuild-level); it does not run the TypeScript type checker. Use `npm run typecheck` for that. All five checks (lint, typecheck, test:run, build, plus the backend checks above) run in CI — see below.

#### E2E tests (Playwright, AŞAMA 5)

`npm run test:e2e` (from `arayuz/`) drives `playwright.config.ts`, which starts and tears down **both** servers itself: the Vite dev server, and a real local Django backend running against an isolated `e2e_db.sqlite3` (via `e2e/backend_server.py` at the repo root, which runs `migrate` then the `seed_e2e` management command before `runserver`). It never touches the developer's `db.sqlite3`, Neon, or Render — `SQLITE_NAME` (an optional env var on `DATABASES['default']` in `finedu_core/settings.py`, only honored when `DATABASE_URL` is unset) is what points it at the throwaway file. First-time local setup: the backend `venv` must have `requirements.txt` installed, and `npx playwright install chromium` must be run once to download the browser binary. Test users are deterministic — `e2e_admin` / `e2e_teacher` / `e2e_student` / `e2e_student_presurvey`, see `arayuz/e2e/fixtures.ts` and `accounts/management/commands/seed_e2e.py`.

### CI

`.github/workflows/ci.yml` runs on every pull request and on push to `main`, as three independent jobs:
- **backend**: `python manage.py check`, migration drift check, `python manage.py test`.
- **frontend**: `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build`.
- **e2e**: installs both stacks + a Chromium browser, then `npm run test:e2e` (see above). Does not block/depend on the other two jobs.

Any failure blocks a clean merge signal (GitHub won't auto-block the merge itself unless branch protection's "required status checks" is turned on for `main` in repo settings).

## Architecture

### Backend: single-app Django project

- `finedu_core/` is the Django project (settings, root `urls.py`); `accounts/` is the only app and holds all models, views, serializers, and URLs for the entire platform (users, units, content, progress, classrooms, chatbot, analytics, admin reporting). There's no separation into multiple Django apps — new backend features generally go into `accounts/views.py` + `accounts/urls.py`.
- Two parallel URL surfaces exist: classic server-rendered Django views (`register_view`, `login_view`, `dashboard_view`, templates) and a JSON API under `/api/` (`accounts/urls.py`) consumed by the React frontend. The React app only talks to the `/api/` surface plus `/api/login/`, which is DRF's built-in `obtain_auth_token` (registered directly in `finedu_core/urls.py`, not in `accounts/urls.py`). Auth is DRF TokenAuthentication — the frontend stores the token in `localStorage` under `"token"` and sends `Authorization: Token <token>`.
- Content hierarchy: `Unit` (scoped to a `grade_level`) → `Subtopic` → `Content` (`VIDEO` or `GAME`). Games are selected via `Content.game_code`, a `CharField` with a `GAME_CHOICES` list in `accounts/models.py` — **that list is out of date** relative to what the frontend actually supports (see below), and since the field allows `null`/`blank`, choices aren't hard-enforced at the DB layer.
- Progress/gamification: `UserProgress` (one per student+content; `score` is only ever set on first completion, `play_count` increments on replay) and `UserBadge` (awarded once all `Content` in a `Unit` are completed — see `user_progress_api` in `accounts/views.py` for the badge-award logic and streak update via `CustomUser.update_streak()`).
- Media/video storage is Cloudinary in production (`STORAGES["default"]` in `settings.py`); static files are served via Whitenoise. Cloudinary credentials and `DATABASE_URL` (Neon Postgres) come from environment variables — never hardcode them.
- `SECRET_KEY` is currently hardcoded in `finedu_core/settings.py` and `DEBUG = True` is hardcoded (not env-gated) — be aware of this when touching settings; don't introduce more hardcoded secrets, and prefer moving existing ones to env vars if asked to touch this file.

### Frontend: React + Vite, `arayuz/src/`

- Two component trees exist side by side: `src/app/` (pages, layout components, routing) and `src/components/games/` (the standalone educational game components). `src/app/routes.tsx` defines all top-level routes via `react-router`'s `createBrowserRouter` (`/`, `/login`, `/register`, `/dashboard`, `/unit/:unitId`, `/admin`, `/profile`, `/pre-survey`, `/post-survey`, `/values-bridge`) — every route except the three public ones is nested under `RequireAuth` (`src/app/routes/RequireAuth.tsx`, AŞAMA 5), which redirects an anonymous visitor to `/login` before the page component mounts. Role-specific gating (e.g. non-ADMIN on `/admin`) stays inside the page itself (it fetches `/api/me/` and redirects) — this is a UX layer only, not a security boundary; the backend enforces the real permission.
- `src/components/games/GameContainer.tsx` maps a `game_code` string (from `Content.game_code`) to a specific game component via a `switch`. **When adding a new game**, it must be registered in three places that don't share a source of truth: `GameContainer.tsx`'s switch, the Django `GAME_CHOICES` in `accounts/models.py`, and the admin UI's game picker in `AdminPanel.tsx` — check all three.
- `src/app/utils/api.ts` is the shared API client: `API_BASE_URL` (env-overridable via `VITE_API_BASE_URL`, falls back to the production Render URL), `getAuthToken()`/`authHeaders()`, and (AŞAMA 5) `apiFetch(url, options)` + `clearSession()`. `apiFetch` wraps `fetch`, auto-attaches the auth header, and on a `401` response calls `clearSession()` (clears the token + the whole `apiCache`) and hard-redirects to `/login` — this is the app's global session-expiry handler. Almost every authenticated page/component (`Dashboard.tsx`, `Profile.tsx`, `AdminPanel.tsx`, `UnitDetail.tsx`, `PreSurvey.tsx`, `PostSurvey.tsx`, `ValuesBridge.tsx`, `ChatBot.tsx`) calls through `apiFetch` instead of raw `fetch`; the one exception is `AdminPanel.tsx`'s video-file upload, which still uses `XMLHttpRequest` directly (for upload-progress events) and handles its own 401 case inline. `Login.tsx`'s `/api/login/` call and `Register.tsx`'s `/api/register/` call intentionally stay on raw `fetch` — they're unauthenticated by definition, and routing a failed-login 401 through the global handler would be a false session-expiry signal.
- `src/app/utils/apiCache.ts` is a minimal in-memory TTL cache (5 min) used to avoid redundant GETs across page views; it's cleared by `clearSession()` on every logout/401 so a second user who logs in on the same browser never sees the previous user's cached `/api/me/` data.
- **Render free-tier cold start**: the backend sleeps after inactivity. `Login.tsx` pings `/api/health/` on mount to warm the server, and retries the login request with a longer timeout (60s) if the first attempt (15s) aborts. Note this only handles normal cold-start sleep — if the backend gets stuck at boot (gunicorn logs show no "Booting worker" line after "Control socket listening"), retries won't help; the fix is a manual restart in the Render dashboard, not a frontend/backend code change.
- `UnitDetail.tsx` implements sequential content locking: content at index N is locked unless the content at index N-1 is in the student's completed-IDs list — there's no backend-enforced ordering, it's purely a frontend gate.
- Path alias `@` → `src/` is configured in `vite.config.ts`. Vercel deploy uses `arayuz/vercel.json` to rewrite all paths to `/index.html` for SPA routing (client-side routes 404 on Vercel without this).
- Game components follow a shared visual pattern for side panels (glossary/strategy content flanking the game): outer `max-w-7xl` wrapper, `flex gap-4 items-start`, `w-64 hidden lg:block sticky top-4` for left (cyan-themed) and right (amber-themed) panels, `flex-1 min-w-0` center column, with `AnimatePresence`/`framer-motion` for panel transitions keyed by scenario/stage index. When a game wraps content in `DndProvider` (react-dnd), the panel layout goes *inside* the provider.
