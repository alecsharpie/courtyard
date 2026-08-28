#!/usr/bin/env node
/* pop-brief.mjs — hand the next brief to a worker iteration.
 *
 *   node pop-brief.mjs             claim the next brief -> current-brief.json
 *   node pop-brief.mjs --peek      report queue depth only, change nothing
 *   node pop-brief.mjs --done      mark the current brief finished
 *   node pop-brief.mjs --reject "…" the town already has this; say so with evidence
 *
 * Exit 0 = a brief is ready in current-brief.json.
 * Exit 2 = the queue is empty. The runner reads this as "fire the manager".
 *
 * The RUNNER pops, not the worker. That keeps one decision — "is there work?" —
 * in the shell where the manager can be scheduled in response to it, and it means
 * an iteration killed mid-flight leaves its brief `active` so the next attempt
 * picks up the same work instead of silently losing it.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLAN = join(HERE, 'plan.json');
const CUR = join(HERE, 'current-brief.json');
const RUNLOG = join(HERE, 'RUNLOG.jsonl');

const argv = process.argv.slice(2);
const peek = argv.includes('--peek');

const plan = existsSync(PLAN) ? JSON.parse(readFileSync(PLAN, 'utf8')) : { queue: [], consumed: [] };
const cur = existsSync(CUR) ? JSON.parse(readFileSync(CUR, 'utf8')) : null;

if (argv.includes('--done')) {
  if (!cur) process.exit(0);
  cur.status = 'done';
  writeFileSync(CUR, JSON.stringify(cur, null, 2) + '\n');
  console.log(`pop-brief: ${cur.id} marked done.`);
  process.exit(0);
}

/* A brief the town already satisfies. Recording WHY is the point: a rejection is
 * a fact about the plan, and two of them in a row is a stall signal that sends the
 * manager back to re-read the inventory rather than the worker back to guessing. */
if (argv.includes('--reject')) {
  if (!cur) { console.error('pop-brief: no active brief to reject.'); process.exit(1); }
  const reason = process.argv.slice(process.argv.indexOf('--reject') + 1).join(' ').trim();
  if (!reason) { console.error('usage: --reject "the lane already has awnings — courtyard.html:2110"'); process.exit(1); }
  cur.status = 'done'; cur.briefRejected = reason;
  writeFileSync(CUR, JSON.stringify(cur, null, 2) + '\n');
  console.log(`pop-brief: ${cur.id} rejected — ${reason}`);
  process.exit(0);
}

function nextIter() {
  if (!existsSync(RUNLOG)) return 1;
  const lines = readFileSync(RUNLOG, 'utf8').trim().split('\n').filter(Boolean);
  let max = 0;
  /* A launch failure (the CLI died before a worker read the brief) is not an
   * iteration, so it does not consume a number: the re-issued brief keeps it. */
  for (const l of lines) { try { const r = JSON.parse(l); if (r.kind !== 'launch-failed') max = Math.max(max, r.iter || 0); } catch { /* skip */ } }
  return max + 1;
}

if (peek) {
  const active = cur && cur.status === 'active' ? 1 : 0;
  console.log(`queue=${plan.queue.length} active=${active} nextIter=${nextIter()}`);
  process.exit(plan.queue.length === 0 && !active ? 2 : 0);
}

/* An iteration that died before committing leaves its brief active — retry it
 * rather than skipping to the next. The work it wanted done still wants doing. */
if (cur && cur.status === 'active') {
  cur.attempts = (cur.attempts || 1) + 1;
  cur.nextIter = nextIter();
  delete cur.retry;   // runlog.mjs's "re-issued once" note; the count now lives in attempts
  writeFileSync(CUR, JSON.stringify(cur, null, 2) + '\n');
  console.log(`pop-brief: re-issuing ${cur.id} (attempt ${cur.attempts}) — the previous try left it unfinished.`);
  process.exit(0);
}

if (!plan.queue.length) {
  console.log('pop-brief: queue empty — the manager needs to plan.');
  process.exit(2);
}

const brief = plan.queue.shift();
(plan.consumed ||= []).push({ id: brief.id, at: new Date().toISOString() });
if (plan.consumed.length > 40) plan.consumed = plan.consumed.slice(-40);
writeFileSync(PLAN, JSON.stringify(plan, null, 2) + '\n');

const out = { ...brief, status: 'active', attempts: 1, nextIter: nextIter(), issued: new Date().toISOString(), fromPlan: plan.generated || null };
writeFileSync(CUR, JSON.stringify(out, null, 2) + '\n');
console.log(`pop-brief: ${brief.id} — ${brief.domain} x ${brief.kind} (iteration ${out.nextIter}). ${plan.queue.length} left in queue.`);
