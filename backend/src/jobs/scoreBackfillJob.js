/**
 * scoreBackfillJob.js
 * Safety net for the scoring pipeline.
 *
 * `scoringPropertyAsync` (propertyService.js) only ever gets one shot at
 * scoring a property, right when it's created/synced. If the Python scoring
 * engine is down or unreachable at that exact moment, the property is left
 * with `aiScore.overall === null` forever — nothing else ever retries it.
 * This job periodically finds those stuck properties and gives them another
 * shot.
 *
 * It also catches properties that DO have a score but are missing
 * `aiScore.breakdown` (the per-factor reasoning the AI explainer chatbot
 * needs) — this covers every property scored before that field existed on
 * the schema, without a separate one-off migration script.
 */

const cron = require('node-cron');
const Property = require('../models/Property');
const { scoringPropertyAsync } = require('../services/propertyService');

let isRunning = false;

/**
 * Scores every property currently missing an aiScore, one at a time
 * (sequential, not parallel) so we don't overwhelm the scoring engine or
 * the OpenWeatherMap rate limit in one burst.
 */
async function runScoreBackfillPass() {
  if (isRunning) {
    console.warn('⏭️  ScoreBackfillJob: previous pass still running, skipping this tick.');
    return;
  }

  isRunning = true;
  try {
    const unscored = await Property.find({
      $or: [{ 'aiScore.overall': null }, { 'aiScore.breakdown': null }],
    }).select('_id');
    if (unscored.length === 0) {
      console.log('✅ ScoreBackfillJob: no unscored/incomplete properties found.');
      return;
    }

    console.log(`🔁 ScoreBackfillJob: found ${unscored.length} unscored/incomplete properties — retrying...`);
    let succeeded = 0;

    for (const { _id } of unscored) {
      const property = await Property.findById(_id);
      if (!property) continue;

      await scoringPropertyAsync(property);

      const rescored = await Property.findById(_id).select('aiScore.overall aiScore.breakdown');
      if (rescored?.aiScore?.overall != null && rescored?.aiScore?.breakdown != null) succeeded += 1;
    }

    console.log(`✅ ScoreBackfillJob: finished — ${succeeded}/${unscored.length} properties now scored.`);
  } catch (err) {
    console.error('🔁 ScoreBackfillJob: unhandled error —', err.message);
  } finally {
    isRunning = false;
  }
}

/**
 * Registers the recurring backfill job (hourly) and kicks off one pass shortly
 * after startup — by then the scoring engine child process has had time to
 * come up, so anything left unscored from a previous run gets picked up
 * without waiting for the next full hour.
 */
function startScoreBackfillJob() {
  cron.schedule('0 * * * *', () => {
    runScoreBackfillPass().catch((err) => console.error('🔁 ScoreBackfillJob: unhandled error —', err.message));
  });
  console.log('🔁 ScoreBackfillJob: scheduled to run hourly, retrying any unscored properties.');

  setTimeout(() => {
    runScoreBackfillPass().catch((err) => console.error('🔁 ScoreBackfillJob: unhandled error —', err.message));
  }, 30_000);
}

module.exports = { startScoreBackfillJob, runScoreBackfillPass };
