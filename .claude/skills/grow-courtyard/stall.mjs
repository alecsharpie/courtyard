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
import { readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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
/* `launch-failed` rows are runs where the CLI itself died before a worker read
 * the brief (0 tokens, seconds long). They are not iterations of anything. */
const rows = all.filter(r => r.kind !== 'manager' && r.kind !== 'launch-failed');
const launchFails = all.filter(r => r.kind === 'launch-failed');
const managers = all.filter(r => r.kind === 'manager');

const plan = existsSync(PLAN) ? JSON.parse(readFileSync(PLAN, 'utf8')) : null;

const last = n => rows.slice(-n);
const streak = pred => { let k = 0; for (let i = rows.length - 1; i >= 0 && pred(rows[i]); i--) k++; return k; };
const median = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

const signals = [];
/* `trigger: false` marks an ADVISORY signal: it is the manager's business at its
 * next pass (it must climb — see SKILL.md) but it does not fire the manager early,
 * because it describes a chronic condition that would otherwise re-fire the
 * manager every MANAGER_GAP iterations until the town's whole shape changed. */
const add = (id, detail, rung, trigger = true) => signals.push({ id, detail, suggestRung: rung, trigger });

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

/* --- the shapes THIS run made (found at #67, not in Solvista's log) --------
 * Everything above catches a loop that fails loudly. This loop failed quietly:
 * 100% ship rate, 0 reverts, cost FALLING — and diffs shrinking from a mean of
 * +93 lines (#2–33) to +49 (#37–67) while every structural census scalar sat at
 * its #2 value. A loop that ships something tiny every time trips nothing above. */

/* Diffs shrinking. Median source lines over the last 5 iterations that moved the
 * source at all; rows that predate srcLines (all 0) are skipped. */
const sized = rows.filter(r => r.evidence && r.evidence.srcChanged && r.evidence.srcLines > 0);
const l5 = sized.slice(-5).map(r => r.evidence.srcLines);
if (l5.length >= 5) {
  const med = median(l5);
  if (med < 40) add('smallDiff', `median diff over the last 5 shipped iterations is ${med} lines (${l5.join('/')}); the loop is shipping polish`, 4, false);
}

/* The map itself has not changed. These census scalars only move when ground,
 * water, buildings, passages or the species/tile catalogue change — i.e. when the
 * town gains SPACE, not behaviour. Rung-4 work that only ever picks time (a year,
 * an evening, snow) leaves every one of them where the loop found it. */
const STRUCT = ['developed', 'green', 'water', 'passages', 'structures', 'tileKinds', 'speciesKinds'];
const censused = rows.filter(r => r.census && r.census.scalars);
if (censused.length >= 15) {
  const key = r => STRUCT.map(k => r.census.scalars[k]).join('/');
  const now = key(censused[censused.length - 1]);
  let flatMap = 0;
  for (let i = censused.length - 1; i >= 0 && key(censused[i]) === now; i--) flatMap++;
  if (flatMap >= 15) add('mapFlat', `the map's shape (${STRUCT.join(', ')}) is unchanged for ${flatMap} iterations — nothing spatial has been built`, 4, false);
}

/* The manager has held the same low rung for three passes running. Success is
 * also a reason to climb: the ladder was written to be climbed on failure, and a
 * clean run therefore never left rung 2 (#47–#67: five passes, all rung 2). */
const MLOG = join(HERE, 'MANAGER-LOG.md');
const rungs = existsSync(MLOG)
  ? [...readFileSync(MLOG, 'utf8').matchAll(/^- .*planned from #\d+, rung (\d)/gm)].map(m => +m[1])
  : [];
const lastRungs = rungs.slice(-3);
if (lastRungs.length === 3 && lastRungs.every(r => r <= 2)) add('rungHeld', `the last 3 manager passes all sat on rung ${lastRungs.join('/')}; the next pass must climb`, 4, false);

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

/* --- the loop's own memory ------------------------------------------------
 * #149 built the append quota, #153 gave it a caller, and the result now lands on
 * the row as `quota {rc, over[]}`. Nothing READ it — so a worker could breach the
 * read budget on every iteration and never appear in the report the manager plans
 * from. That is not a loud failure; it is exactly the quiet one the previous loop
 * died of, paying more rent on its own memory every open while output fell.
 *
 * Two absences, deliberately distinguishable (runlog.mjs): no `quota` key at all
 * predates #153 and is skipped the way srcLines is, while `quota === null` is the
 * field PRESENT and NOT MEASURED — which reads exactly like a clean row to anything
 * that only counts breaches. Both are counted here, and only one of them is silence. */
const measured = r => r.quota != null;
const breach = r => measured(r) && (r.quota.rc !== 0 || (r.quota.over && r.quota.over.length > 0));

/* Name the surface in context-budget.mjs's OWN words: `over[]` holds its `fails`
 * strings verbatim, so this classifies what was recorded rather than re-deriving it. */
const SURFACES = [[/ledger entr/i, 'ledger'], [/inventory line/i, 'inventory'], [/cue note|cues raised/i, 'cue']];
const surfacesOf = r => [...new Set((((r.quota || {}).over) || []).map(t => (SURFACES.find(([re]) => re.test(t)) || [null, 'unnamed'])[1]))];

const qStreak = streak(breach);
if (qStreak >= 2) {
  const hit = rows.slice(-qStreak);
  const tally = {};
  for (const r of hit) for (const s of surfacesOf(r)) tally[s] = (tally[s] || 0) + 1;
  const worst = hit[hit.length - 1];
  const named = Object.entries(tally).map(([k, v]) => `${k} x${v}`).join(', ') || 'surface unnamed';
  add('quotaBreach', `${qStreak} iterations in a row appended over the memory quota (${named}) — #${worst.iter}: ${((worst.quota.over || [])[0] || 'no offender recorded').slice(0, 88)}`, 2);
}

/* And the gate at a rate of zero — the shape #149 found in the quota itself. A field
 * that is never FILLED cannot be told from a clean one by anything counting breaches,
 * so the silence above has to be EARNED: if the recent rows all say NOT MEASURED, step
 * 4 of run-loop.sh is not reaching the row and a breach could not show here whatever
 * the worker did. The likeliest cause is the one #153 logged against itself — bash
 * parses the runner's whole `while` loop once, so a live runner keeps the OLD script
 * text until it is restarted. */
const unmeasured = streak(r => 'quota' in r && r.quota == null);
if (unmeasured >= 3) add('quotaUnmeasured', `the memory quota has measured nothing for ${unmeasured} iterations — run-loop.sh step 4 is not reaching the row, so a breach could not show here (restart the runner: a live loop keeps the old script text)`, 2, false);

/* A plan written long ago is planning for a town that no longer exists. */
if (plan && plan.byIteration != null && rows.length) {
  const age = (rows[rows.length - 1].iter || 0) - plan.byIteration;
  if (age >= 8) add('planStale', `the current plan was written ${age} iterations ago`, 2);
}

/* --- what the loop weighs on disk -----------------------------------------
 * context-budget.mjs bounds what a WORKER re-reads on every open, and #153 gave that
 * bound a caller. These four are the other half of the same problem: nothing caps
 * them, no worker reads them, and the MANAGER reads all four at every pass. They are
 * the loop's remaining unbounded growth, so the report carries the SLOPE — the point
 * of a line is to see it bend before it matters, and by the time the size is worth
 * noticing in a file listing the reading has already been paid for many times.
 *
 * state.json is the fourth because it belongs with them: the brief that asked for
 * this named the other three, and `closedCues` alone is most of this file — a list
 * that only ever grows, sitting in the file the manager opens first. */
const GROW = [
  ['LEDGER-archive.md', 'every entry rotated out of LEDGER.md'],
  ['RUNLOG.jsonl', 'one row per iteration'],
  ['state.json', 'the town’s state'],
  ['MANAGER-LOG.md', 'one line per manager pass'],
];

const git = args => { try { return execFileSync('git', args, { cwd: HERE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; } };

/* Sizes come off disk (that is what a read costs NOW); the slope comes from git,
 * between two ITERATION commits, so it is per iteration and not per commit — the
 * runner lands a stats refresh after every one of them. No git, no slope: this runs
 * from a staged temp directory in its own probe, and a missing repo must degrade to
 * the sizes rather than take the report down with it. */
function onDisk(span = 20) {
  const out = GROW.map(([file, why]) => ({ file, why, bytes: existsSync(join(HERE, file)) ? statSync(join(HERE, file)).size : 0, perIter: null }));
  const st = out.find(o => o.file === 'state.json');
  if (st && st.bytes) {
    try {
      const closed = JSON.parse(readFileSync(join(HERE, 'state.json'), 'utf8')).closedCues || [];
      st.why = `${closed.length} closed cues, ${(Buffer.byteLength(JSON.stringify(closed)) / 1024).toFixed(0)} KB of it`;
    } catch { /* leave the plain label */ }
  }

  const log = git(['log', '--format=%H%x09%s', '--', '.']);
  const iters = [];
  for (const line of (log || '').split('\n')) {
    const tab = line.indexOf('\t');
    const m = tab === -1 ? null : /^Iter (\d+):/.exec(line.slice(tab + 1));
    if (m) iters.push({ sha: line.slice(0, tab), iter: +m[1] });
  }
  if (iters.length < 2) return { files: out, from: null, to: null, iters: 0 };
  const to = iters[0], from = iters.find(i => i.iter <= to.iter - span) || iters[iters.length - 1];
  const n = to.iter - from.iter;
  if (n < 1) return { files: out, from: null, to: null, iters: 0 };
  for (const o of out) {
    const a = git(['cat-file', '-s', `${from.sha}:./${o.file}`]), b = git(['cat-file', '-s', `${to.sha}:./${o.file}`]);
    if (a != null && b != null) o.perIter = (parseInt(b, 10) - parseInt(a, 10)) / n;
  }
  return { files: out, from: from.iter, to: to.iter, iters: n };
}

/* --- output --------------------------------------------------------------- */

const verdictCounts = {};
for (const r of last(20)) if (r.verdict) verdictCounts[r.verdict] = (verdictCounts[r.verdict] || 0) + 1;

if (report) {
  console.log(`stall: ${rows.length} worker iterations logged (+ ${managers.length} manager passes and ${launchFails.length} launch failures, excluded from everything below).`);
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
  const qAll = rows.filter(r => 'quota' in r);
  const qOK = qAll.filter(measured);
  console.log(`\n  memory quota: ${qOK.length}/${qAll.length} rows measured, ${qOK.filter(breach).length} over${qAll.length && !qOK.length ? '  — the field is on the row and nothing has ever filled it' : ''}`);
  const disk = onDisk();
  console.log(`  the loop on disk — nothing caps these, and the manager reads all of them${disk.iters ? `  (slope over #${disk.from} → #${disk.to})` : ''}:`);
  for (const d of disk.files) {
    const rate = d.perIter == null ? '—' : `${d.perIter >= 0 ? '+' : '-'}${(Math.abs(d.perIter) / 1024).toFixed(2)} KB/iter`;
    console.log(`    ${d.file.padEnd(18)} ${(d.bytes / 1024).toFixed(1).padStart(7)} KB  ${rate.padStart(14)}   ${d.why}`);
  }
  const slope = disk.files.reduce((a, d) => a + (d.perIter || 0), 0);
  if (slope) console.log(`    ${' '.repeat(18)} ${(disk.files.reduce((a, d) => a + d.bytes, 0) / 1024).toFixed(1).padStart(7)} KB  ${`+${(slope * 20 / 1024).toFixed(0)} KB/20 it`.padStart(14)}   at this rate`);
  console.log(`\n  plan: ${plan ? `${(plan.queue || []).length} briefs queued, written at #${plan.byIteration} (rung ${plan.rung ?? '?'})` : 'none'}`);
  console.log(signals.length ? '\nSIGNALS FIRING' : '\nNo stall signals.');
  for (const s of signals) console.log(`  ${s.trigger ? '!' : '~'} ${s.id.padEnd(14)} ${s.detail}   → ${s.trigger ? 'consider' : 'REQUIRED:'} ladder rung ${s.suggestRung}+`);
  if (signals.length) {
    console.log('\n  A firing signal means the CURRENT RUNG IS SPENT. Climb the ladder;');
    console.log('  do not re-plan the same rung with different words.');
    if (signals.some(s => !s.trigger)) console.log('  (~ = advisory: did not wake the manager early, but binds THIS pass — see the ladder rules.)');
  }
} else if (asJson) {
  const qAll = rows.filter(r => 'quota' in r), qOK = qAll.filter(measured);
  const quota = { rows: qAll.length, measured: qOK.length, over: qOK.filter(breach).length, breachStreak: qStreak, unmeasuredStreak: unmeasured };
  console.log(JSON.stringify({ iterations: rows.length, managerPasses: managers.length, launchFailures: launchFails.length, signals, verdictCounts, quota, disk: onDisk() }, null, 1));
} else {
  const firing = signals.filter(s => s.trigger);
  console.log(firing.length ? firing.map(s => s.id).join(',') : 'ok');
}

process.exit(signals.some(s => s.trigger) ? 2 : 0);
