/**
 * server.js
 * Entry point — loads environment variables, connects to DB, starts the server.
 *
 * Execution order:
 * 1. Load .env (must be FIRST before any other imports that use process.env)
 * 2. Import app (which loads routes and middleware)
 * 3. Connect to MongoDB
 * 4. Start listening on the configured port
 *
 * Why not put this in app.js?
 * Separating startup allows app.js to be cleanly imported in unit tests
 * without triggering a real DB connection or port binding.
 */

require('dotenv').config(); // Step 1: Must load env vars before anything else

const app = require('./app');
const connectDB = require('./src/config/db');
const { startAutoSyncJob } = require('./src/jobs/autoSyncJob');
const { startScoringEngine } = require('./src/jobs/scoringEngineProcess');
const { startScoreBackfillJob } = require('./src/jobs/scoreBackfillJob');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Step 2: Connect to MongoDB first.
  // If this fails, connectDB calls process.exit(1) — server won't start.
  await connectDB();

  // Step 3: Start the Python scoring-engine microservice (no-op if already running).
  // Without this, aiScore silently never gets computed unless someone remembers to
  // start it manually in a separate terminal.
  await startScoringEngine();

  // Step 4: Start the recurring live-listings sync (once daily).
  startAutoSyncJob();

  // Step 4b: Start the scoring backfill safety net (hourly + once shortly after boot),
  // so properties that missed scoring (e.g. engine was briefly down) get retried.
  startScoreBackfillJob();

  // Step 5: Start the HTTP server.
  app.listen(PORT, () => {
    console.log(`\n🚀 SmartSite Server running in [${process.env.NODE_ENV}] mode`);
    console.log(`📡 Listening on: http://localhost:${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
  });
};

startServer();
