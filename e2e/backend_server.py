"""AŞAMA 5 E2E — local Django backend launcher for Playwright.

Playwright's webServer config shells out to this script instead of
`python manage.py runserver` directly, because the E2E backend needs two
setup steps (migrate + seed) to run first, against an isolated sqlite file
(SQLITE_NAME) so a developer's real db.sqlite3 is never touched or polluted
with test users (AŞAMA 5 madde 27, 70). Pure Python (no shell operators) so
it runs the same way on the Windows dev machine and the Linux CI runner.
"""
import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

if __name__ == "__main__":
    env = os.environ.copy()
    env["SQLITE_NAME"] = env.get("SQLITE_NAME", "e2e_db.sqlite3")

    manage_py = str(REPO_ROOT / "manage.py")

    subprocess.run([sys.executable, manage_py, "migrate", "--noinput"], cwd=REPO_ROOT, env=env, check=True)
    subprocess.run([sys.executable, manage_py, "seed_e2e"], cwd=REPO_ROOT, env=env, check=True)

    # os.execve's Windows emulation crashes here (STATUS_ACCESS_VIOLATION) in
    # this environment — a plain foreground subprocess.run works identically
    # for Playwright's purposes (it just needs a long-running process and the
    # URL to become reachable, not literal process replacement).
    subprocess.run(
        [sys.executable, manage_py, "runserver", "8000", "--noreload"],
        cwd=REPO_ROOT, env=env, check=True,
    )
