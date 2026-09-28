// AŞAMA 5 E2E — Playwright's webServer spawns this via a plain shell command,
// which resolves "python" from PATH. On a local Windows dev machine that
// hits the system Python (no Django installed) instead of this project's
// ./venv — this script picks the right interpreter itself so the config
// doesn't have to guess: prefer the repo's venv if it exists (local dev),
// otherwise fall back to python3/python from PATH (CI, where deps are
// installed straight into the runner's Python — see .github/workflows/ci.yml).
const { existsSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..");

function resolveInterpreter() {
  const windowsVenvPython = path.join(REPO_ROOT, "venv", "Scripts", "python.exe");
  const posixVenvPython = path.join(REPO_ROOT, "venv", "bin", "python");
  if (existsSync(windowsVenvPython)) return windowsVenvPython;
  if (existsSync(posixVenvPython)) return posixVenvPython;
  return process.platform === "win32" ? "python" : "python3";
}

const python = resolveInterpreter();
const result = spawnSync(python, [path.join(__dirname, "backend_server.py")], {
  stdio: "inherit",
  cwd: REPO_ROOT,
});

process.exit(result.status ?? 1);
