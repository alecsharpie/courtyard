#!/usr/bin/env node
/* runlog.mjs — append ONE structured row per iteration to RUNLOG.jsonl.
 *
 *   node runlog.mjs --repo <path> --elapsed <s> --pre-blob <hash> [--raw <stream.jsonl>] [--rc <n>]
 *
 * THE VERDICT IS DERIVED FROM EVIDENCE, NOT FROM THE WORKER'S SELF-REPORT.
 *
 * The previous loop read its verdict out of prose the worker had written about its
 * own iteration. Its final nine runs are logged `SHIPPED` while their own ledger
 * entries say `NO SHIP` in the title — nobody lied, the parser simply believed the
 * author. Twenty-five iterations of nothing therefore looked like twenty-five
 * iterations of shipping, and the stall was invisible in the very log built to
 * catch it. So here:
 *
 *   verdict     = what the diff proves   (shipped / reverted / no-ship / failed)
 *   selfVerdict = what the worker claimed (recorded, never trusted)
 *
 * and the gap between the two is itself a tracked stall signal.
 *
 * JSONL, not a markdown table. The old log was regex-parsed out of prose by three
 * different scripts with three slightly different patterns; rows the loop wrote
 * fell out of the dashboard silently.
 */
import { readFileSync, existsSync, appendFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };

const REPO = arg('--repo', join(HERE, '../../..'));
const ELAPSED = parseInt(arg('--elapsed', '0'), 10) || 0;
const PRE_BLOB = arg('--pre-blob', '');
const RAW = arg('--raw', null);
const RC = parseInt(arg('--rc', '0'), 10) || 0;
const KIND = arg('--kind', 'worker');            // worker | manager

const RUNLOG = join(HERE, 'RUNLOG.jsonl');
const CUR = join(HERE, 'current-brief.json');
const HIST = join(HERE, 'census-history.jsonl');

const git = (...a) => { try { return execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' }).trim(); } catch { return ''; } };

const brief = existsSync(CUR) ? JSON.parse(readFileSync(CUR, 'utf8')) : null;
const rows = existsSync(RUNLOG)
  ? readFileSync(RUNLOG, 'utf8').trim().split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)
  : [];

/* The runner assigned the iteration number when it popped the brief, so a run that
 * committed nothing still gets a row. An iteration that produced NOTHING is the
 * single most important thing this log can record. */
const iter = (brief && brief.nextIter) || (rows.length ? rows[rows.length - 1].iter + 1 : 1);
if (rows.some(r => r.iter === iter && r.kind === KIND)) {
  console.log(`runlog: iteration ${iter} already recorded — nothing to append.`);
  process.exit(0);
}

const sha = git('rev-parse', '--short', 'HEAD');
const subject = git('log', '-1', '--format=%s');

/* --- evidence ------------------------------------------------------------- */
/* Compare the artifact's blob hash now against the hash the runner took just
 * before the iteration started. This survives multi-commit iterations, amended
 * commits and uncommitted leftovers — all of which broke a HEAD~1 diff. */
let postBlob = '';
try { postBlob = execFileSync('git', ['-C', REPO, 'hash-object', 'courtyard.html'], { encoding: 'utf8' }).trim(); } catch { /* ignore */ }
const srcChanged = !!(PRE_BLOB && postBlob && PRE_BLOB !== postBlob);

let srcLines = 0;
if (srcChanged) {
  const stat = git('diff', '--numstat', `${PRE_BLOB}`, `${postBlob}`, '--', 'courtyard.html');
  const m = stat.match(/^(\d+)\s+(\d+)/);
  if (m) srcLines = +m[1] + +m[2];
  if (!srcLines) {
    const alt = git('diff', '--numstat', 'HEAD~1', 'HEAD', '--', 'courtyard.html').match(/^(\d+)\s+(\d+)/);
    if (alt) srcLines = +alt[1] + +alt[2];
  }
}

const committed = new RegExp(`^Iter ${iter}\\b`).test(subject) || (KIND === 'manager' && /^Manager:/.test(subject));
const revertMark = /explored\s*->\s*reverted|\(reverted\)/i.test(subject);

/* Did the ledger gain an entry for this iteration? A run that built nothing but
 * recorded a real negative result is worth distinguishing from one that vanished. */
const ledger = existsSync(join(HERE, 'LEDGER.md')) ? readFileSync(join(HERE, 'LEDGER.md'), 'utf8') : '';
const entryRe = new RegExp(`^## +(?:Iteration )?${iter}\\b.*$`, 'm');
const entryLine = (ledger.match(entryRe) || [])[0] || null;
const logged = !!entryLine;

/* What the worker called it. Recorded, never believed. */
let selfVerdict = null;
if (entryLine) {
  const start = ledger.indexOf(entryLine);
  const rest = ledger.slice(start, start + 4000);
  const v = rest.match(/\*\*Verdict:?\*\*[:\s]*([A-Za-z -]+)/);
  selfVerdict = v ? v[1].trim().toLowerCase() : (entryLine.match(/\b(shipped|reverted|no.?ship|fixed|deepened|rejected)\b/i) || [])[1] || null;
  if (selfVerdict) selfVerdict = selfVerdict.toLowerCase().replace(/\s+/g, '-');
}

/* --- the verdict ---------------------------------------------------------- */
let verdict;
if (brief && brief.briefRejected) verdict = 'rejected-brief';
else if (RC !== 0) verdict = 'failed';
else if (srcChanged && revertMark) verdict = 'reverted';
else if (srcChanged) verdict = 'shipped';
else verdict = 'no-ship';

/* --- cost, from the raw stream -------------------------------------------- */
let costUsd = 0, turns = 0, tokens = null, model = null;
if (RAW && existsSync(RAW)) {
  for (const line of readFileSync(RAW, 'utf8').split('\n')) {
    if (!line.startsWith('{')) continue;
    let j; try { j = JSON.parse(line); } catch { continue; }
    if (j.type === 'result') {
      costUsd = j.total_cost_usd || costUsd;
      turns = j.num_turns || turns;
      if (j.usage) tokens = {
        in: j.usage.input_tokens || 0, out: j.usage.output_tokens || 0,
        cacheRead: j.usage.cache_read_input_tokens || 0, cacheWrite: j.usage.cache_creation_input_tokens || 0,
      };
    }
    if (j.type === 'assistant' && j.message && j.message.model) model = j.message.model;
  }
}

/* --- census position ------------------------------------------------------ */
let census = null, censusDelta = null;
if (existsSync(HIST)) {
  const hl = readFileSync(HIST, 'utf8').trim().split('\n').filter(Boolean);
  if (hl.length) {
    try { census = JSON.parse(hl[hl.length - 1]); } catch { /* ignore */ }
    const prev = [...rows].reverse().find(r => r.census && r.census.scalars);
    if (census && prev) {
      censusDelta = {};
      for (const k in census.scalars) {
        const d = (census.scalars[k] || 0) - (prev.census.scalars[k] || 0);
        if (d) censusDelta[k] = d;
      }
    }
  }
}

const row = {
  iter, kind: KIND,
  when: new Date().toISOString(),
  brief: brief ? brief.id : null,
  domain: brief ? brief.domain : null,
  changeKind: brief ? brief.kind : null,
  rung: brief ? brief.rung ?? null : null,
  attempts: brief ? brief.attempts || 1 : 1,
  verdict, selfVerdict,
  briefRejected: brief ? brief.briefRejected || null : null,
  secs: ELAPSED, costUsd: +costUsd.toFixed(4), turns, tokens, model,
  evidence: { srcChanged, srcLines, committed, logged, sha, subject: subject.slice(0, 120), preBlob: PRE_BLOB.slice(0, 12), postBlob: postBlob.slice(0, 12) },
  census: census ? { when: census.when, pageerrors: census.pageerrors, scalars: census.scalars } : null,
  censusDelta,
};

appendFileSync(RUNLOG, JSON.stringify(row) + '\n');

/* Retire the brief so the next pop takes fresh work. */
if (brief && brief.status === 'active') { brief.status = 'done'; writeFileSync(CUR, JSON.stringify(brief, null, 2) + '\n'); }

const mm = String(Math.floor(ELAPSED / 60)), ss = String(ELAPSED % 60).padStart(2, '0');
const mark = { shipped: '✔', reverted: '↩', 'no-ship': '○', failed: '✗', 'rejected-brief': '⊘' }[verdict] || '?';
const claim = selfVerdict && selfVerdict.replace(/[^a-z]/g, '') !== verdict.replace(/[^a-z]/g, '') ? `  (claimed: ${selfVerdict})` : '';
console.log(`${mark} Iter ${String(iter).padEnd(4)} ${String((row.domain || '—') + ' x ' + (row.changeKind || '—')).padEnd(34)} ${verdict.padEnd(15)} ${mm}m${ss}s  $${costUsd.toFixed(2)}  ${srcLines ? `${srcLines}L` : '0L'}  ${sha}${claim}`);
