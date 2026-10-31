const path = require('path');
const { spawn } = require('child_process');
const scoringService = require('../services/scoringService');

const SCORING_ENGINE_DIR = path.join(__dirname, '..', '..', '..', 'scoring-engine');

// Tried in order. PYTHON_EXECUTABLE lets any environment override this explicitly;
// the hardcoded Windows path is this project's dev-machine fallback (see PYTHON_SETUP.md) —
// harmless to try elsewhere since a failed spawn just moves to the next candidate.
const PYTHON_CANDIDATES = [
  process.env.PYTHON_EXECUTABLE,
  'python',
  'python3',
  'C:\\Users\\Lenovo\\AppData\\Local\\Programs\\Python\\Python312\\python.exe',
].filter(Boolean);

let child = null;

/**
 * Tries each Python executable candidate in turn until one successfully spawns
 * app.py without an immediate ENOENT (executable not found).
 */
function trySpawn(candidates) {
  if (candidates.length === 0) {
    console.warn('⚠️  ScoringEngine: no working Python executable found — aiScore/environmentScore for new properties will stay unscored until the scoring-engine is started manually. See PYTHON_SETUP.md.');
    return;
  }

  const [executable, ...rest] = candidates;
  // The child inherits our env, including the backend's own PORT, so pin it to the
  // port scoringService will actually call.
  const port = new URL(process.env.SCORING_ENGINE_URL || 'http://localhost:5001').port || '5001';
  const proc = spawn(executable, ['app.py'], { cwd: SCORING_ENGINE_DIR, env: { ...process.env, PORT: port } });

  let settled = false;

  proc.on('error', (err) => {
    if (settled) return;
    settled = true;
    if (err.code === 'ENOENT') {
      trySpawn(rest);
    } else {
      console.error(`⚠️  ScoringEngine: failed to start via "${executable}" —`, err.message);
      trySpawn(rest);
    }
  });

  proc.stdout?.on('data', (data) => {
    settled = true;
    process.stdout.write(`[ScoringEngine] ${data}`);
  });
  proc.stderr?.on('data', (data) => {
    settled = true;
    process.stderr.write(`[ScoringEngine] ${data}`);
  });

  proc.on('exit', (code) => {
    if (child === proc) {
      console.warn(`⚠️  ScoringEngine: process exited (code ${code}) — properties will stay unscored until it's restarted.`);
      child = null;
    }
  });

  child = proc;
  console.log(`🐍 ScoringEngine: starting via "${executable} app.py"...`);
}

/**
 * Starts the Python scoring-engine Flask service as a child process, unless one
 * is already reachable (e.g. started manually in a separate terminal during dev).
 * Non-fatal on failure — property creation and the auto-sync job both already
 * degrade gracefully when scoring is unavailable.
 */
async function startScoringEngine() {
  const alreadyRunning = await scoringService.healthCheck();
  if (alreadyRunning) {
    console.log('🐍 ScoringEngine: already running, using existing instance.');
    return;
  }

  trySpawn(PYTHON_CANDIDATES);
}

function stopScoringEngine() {
  if (child) {
    child.kill();
    child = null;
  }
}

module.exports = { startScoringEngine, stopScoringEngine };
