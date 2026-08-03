#!/usr/bin/env node
/* stall.mjs — is the loop still getting anywhere?
 *
 *   node stall.mjs            terse; exit 2 means "fire the manager now"
 *   node stall.mjs --report   the manager's read of the run
 *   node stall.mjs --json
 *
 * Every signal here is a shape the previous 369-iteration loop actually made
 * before it died, taken from its own run log. It had all of this data and nobody
 * looking at it during the run — the dashboard was built for humans, after the
 * fact. This script is that dashboard, wired to the throttle.
 *
 *   #326-345  revert rate 20%, a fifth of iterations naming no vector
 *   #346-360  revert rate 80% — thrash: pick, build, back out, repeat
 *   #361-369  89% no vector, 5-10 min each: nine iterations that each surveyed
 *             the town, found everything already existed, and exited
 *   throughout cost/iteration $5.45 -> $13.72 with no gain in output
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNLOG = join(HERE, 'RUNLOG.jsonl');
const PLAN = join(HERE, 'plan.json');

const argv = process.argv.slice(2);
const report = argv.includes('--report');
const asJson = argv.includes('--json');

const all = existsSync(RUNLOG)
  ? readFileSync(RUNLOG, 'utf8').trim().split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)
  : [];

/* EVERY SIGNAL BELOW IS ABOUT THE WORKER, so every signal below reads worker rows.
 * A manager pass writes a row too, and by construction it is verdict=no-ship with
 * evidence.srcChanged=false — it plans, it does not build. Run the streaks over all
 * rows and the manager is a permanent poison pill: it lands between every batch, so
 * `noShipStreak` and `srcFlat` can never exceed the length of one batch however
 * badly the loop is doing, and one manager pass on its own trips nothing while
 * looking exactly like the failure these signals were written to catch. It also
 * drags the last-10 pace and cost averages toward a run that did no building.
 * (Rows with no `kind` predate the field and were all workers.) */
const rows = all.filter(r => r.kind !== 'manager');
const managers = all.filter(r => r.kind === 'manager');

const plan = existsSync(PLAN) ? JSON.parse(readFileSync(PLAN, 'utf8')) : null;

const last = n => rows.slice(-n);
const streak = pred => { let k = 0; for (let i = rows.length - 1; i >= 0 && pred(rows[i]); i--) k++; return k; };
const median = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

const signals = [];
const add = (id, detail, rung) => signals.push({ id, detail, suggestRung: rung });

/* --- the shapes ---------------------------------------------------------- */

/* Nothing shipped twice running. The 361-369 shape: individually reasonable
 * iterations that collectively produce nothing. */
const noShip = streak(r => r.verdict === 'no-ship');
if (noShip >= 2) add('noShipStreak', `${noShip} iterations in a row landed no change`, 3);

/* Build-then-back-out. The 346-360 shape. */
const rev = streak(r => r.verdict === 'reverted');
if (rev >= 2) add('revertStreak', `${rev} reverts in a row`, 3);

const l8 = last(8).filter(r => r.verdict);
if (l8.length >= 6) {
  const rate = l8.filter(r => r.verdict === 'reverted').length / l8.length;
  if (rate > 0.4) add('revertRate', `${(rate * 100).toFixed(0)}% of the last ${l8.length} iterations reverted`, 4);
}

/* The source file itself has not moved. The hardest possible evidence of a stall:
 * whatever the ledger says happened, the town did not change. */
const flat = streak(r => !r.evidence || !r.evidence.srcChanged);
if (flat >= 2) add('srcFlat', `courtyard.html unchanged for ${flat} iterations`, 3);

/* One corner of the town getting all the attention. */
const doms = last(4).map(r => r.domain).filter(Boolean);
if (doms.length >= 3 && new Set(doms).size === 1) add('sameDomain', `${doms.length} consecutive iterations on "${doms[0]}"`, 1);

/* Cost climbing without output. Rising minutes and dollars per iteration was the
 * quiet half of the previous failure — it doubled long before the loop stalled. */
const costs = rows.filter(r => r.costUsd > 0).map(r => r.costUsd);
if (costs.length >= 12) {
  const recent = mean(costs.slice(-3)), base = median(costs.slice(-18, -3));
  if (base > 0 && recent > base * 2) add('costSpike', `last 3 iterations averaged $${recent.toFixed(2)} vs a $${base.toFixed(2)} median`, 2);
}

/* The worker's self-report drifting from what the diff says. Not dishonesty —
 * the previous loop's last nine iterations were logged SHIPPED while their own
 * entries said NO SHIP, because the verdict was parsed from the worker's prose. */
const l6 = last(6).filter(r => r.selfVerdict && r.verdict);
const over = l6.filter(r => r.selfVerdict.toLowerCase().replace(/[^a-z]/g, '') !== r.verdict.replace(/[^a-z]/g, ''));
if (l6.length >= 4 && over.length >= 3) add('overclaim', `${over.length}/${l6.length} recent iterations claimed more than the diff shows`, 2);

/* The worker keeps finding the brief already built — the plan is out of touch
 * with the town. */
const rejected = last(5).filter(r => r.briefRejected).length;
if (rejected >= 2) add('briefRejected', `${rejected} of the last 5 briefs described something the town already had`, 3);

/* A plan written long ago is planning for a town that no longer exists. */
if (plan && plan.byIteration != null && rows.length) {
  const age = (rows[rows.length - 1].iter || 0) - plan.byIteration;
  if (age >= 8) add('planStale', `the current plan was written ${age} iterations ago`, 2);
}

/* --- output --------------------------------------------------------------- */

const verdictCounts = {};
for (const r of last(20)) if (r.verdict) verdictCounts[r.verdict] = (verdictCounts[r.verdict] || 0) + 1;

if (report) {
  console.log(`stall: ${rows.length} worker iterations logged (+ ${managers.length} manager passes, excluded from everything below).`);
  if (!rows.length) { console.log('  (no runs yet — plan the opening batch)'); }
  else {
    const l = rows[rows.length - 1];
    console.log(`  last: #${l.iter} ${l.domain || '—'} x ${l.changeKind || '—'} -> ${l.verdict} (self: ${l.selfVerdict || '—'}) ${Math.round((l.secs || 0) / 60)}m $${(l.costUsd || 0).toFixed(2)}`);
    console.log(`  last 20 verdicts: ${Object.entries(verdictCounts).map(([k, v]) => `${k}=${v}`).join('  ') || '—'}`);
    const l10 = last(10);
    console.log(`  last 10: avg ${Math.round(mean(l10.map(r => r.secs || 0)) / 60)}m  $${mean(l10.map(r => r.costUsd || 0)).toFixed(2)}/iter  src moved ${l10.filter(r => r.evidence && r.evidence.srcChanged).length}/${l10.length}`);
    const touched = {};
    for (const r of last(12)) if (r.domain) touched[r.domain] = (touched[r.domain] || 0) + 1;
    console.log(`  last 12 by domain: ${Object.entries(touched).map(([k, v]) => `${k}=${v}`).join('  ') || '—'}`);
  }
  console.log(`\n  plan: ${plan ? `${(plan.queue || []).length} briefs queued, written at #${plan.byIteration} (rung ${plan.rung ?? '?'})` : 'none'}`);
  console.log(signals.length ? '\nSIGNALS FIRING' : '\nNo stall signals.');
  for (const s of signals) console.log(`  ! ${s.id.padEnd(14)} ${s.detail}   → consider ladder rung ${s.suggestRung}+`);
  if (signals.length) {
    console.log('\n  A firing signal means the CURRENT RUNG IS SPENT. Climb the ladder;');
    console.log('  do not re-plan the same rung with different words.');
  }
} else if (asJson) {
  console.log(JSON.stringify({ iterations: rows.length, managerPasses: managers.length, signals, verdictCounts }, null, 1));
} else {
  console.log(signals.length ? signals.map(s => s.id).join(',') : 'ok');
}

process.exit(signals.length ? 2 : 0);
