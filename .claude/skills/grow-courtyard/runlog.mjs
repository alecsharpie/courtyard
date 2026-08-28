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
 *
 * CALLING THIS TWICE FOR ONE ITERATION IS NORMAL AND EXPECTED. The worker records
 * itself (it is the only thing that knows the ledger and the census); run-loop.sh
 * records it again afterwards (it is the only thing that knows wall time, cost,
 * turns and the true pre-blob). The second call MERGES into the first row in
 * place, field by field, keeping whichever value is informative — it does not
 * append a duplicate, and it does not refuse. It used to refuse, and the loop
 * therefore threw away the only call carrying real numbers, so the one metric this
 * whole harness exists to catch — cost per iteration rising while output stays
 * flat — read $0.00 / 0m / 0 turns on every worker row for ten iterations.
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
const KIND_ARG = arg('--kind', 'worker');        // worker | manager

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

/* --- did a worker even start? --------------------------------------------
 * On 2026-08-28 the CLI failed to launch three times in a row (1-2 s, 0 tokens,
 * model '<synthetic>', rc=1). Each was logged as an ordinary failed worker
 * iteration AND retired its brief, so three planned briefs were destroyed without
 * a worker ever reading them. A launch failure is a fact about the machine, not
 * about the brief: it gets its own `kind`, the brief stays `active` so the next
 * pop re-issues it, and stall.mjs / build-stats.mjs exclude the row the way they
 * already exclude manager rows. */
const tokenSum = tokens ? tokens.in + tokens.out + tokens.cacheRead + tokens.cacheWrite : 0;
const launchFailed = KIND_ARG === 'worker' && RC !== 0 && (tokenSum === 0 || ELAPSED < 30);
const KIND = launchFailed ? 'launch-failed' : KIND_ARG;


const RUNLOG = join(HERE, 'RUNLOG.jsonl');
const CUR = join(HERE, 'current-brief.json');
const HIST = join(HERE, 'census-history.jsonl');

const git = (...a) => { try { return execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' }).trim(); } catch { return ''; } };

const brief = existsSync(CUR) ? JSON.parse(readFileSync(CUR, 'utf8')) : null;

/* Keep the raw lines, not just the parsed rows: a merge rewrites the file, and a
 * line this version cannot parse must survive that rewrite untouched. */
const lines = existsSync(RUNLOG) ? readFileSync(RUNLOG, 'utf8').split('\n').filter(l => l.trim()) : [];
const parsed = lines.map(l => { try { return JSON.parse(l); } catch { return null; } });
const rows = parsed.filter(Boolean);

/* The runner assigned the iteration number when it popped the brief, so a run that
 * committed nothing still gets a row. An iteration that produced NOTHING is the
 * single most important thing this log can record. */
const iter = (brief && brief.nextIter) || (rows.length ? rows[rows.length - 1].iter + 1 : 1);

/* An iteration is written TWICE: once by the worker itself (which knows the ledger
 * and the census but nothing about its own wall time, cost or turns) and once by
 * run-loop.sh afterwards, which knows exactly those. This used to be a refusal —
 * "already recorded, nothing to append" — so the only call carrying real numbers
 * was the one thrown away, and every worker row in the log reads 0s / $0 / 0 turns.
 * So: a second call MERGES. Each field takes the more informative of the two
 * values, and the verdict is recomputed from the merged evidence. The row is
 * replaced in place, never duplicated. */
const priorIdx = parsed.findLastIndex(r => r && r.iter === iter && r.kind === KIND_ARG);
const prior = priorIdx === -1 ? null : parsed[priorIdx];

const sha = git('rev-parse', '--short', 'HEAD');
const subject = git('log', '-1', '--format=%s');

/* --- evidence ------------------------------------------------------------- */
/* Compare the artifact's blob hash now against the hash the runner took just
 * before the iteration started. This survives multi-commit iterations, amended
 * commits and uncommitted leftovers — all of which broke a HEAD~1 diff. */
let postBlob = '';
try { postBlob = execFileSync('git', ['-C', REPO, 'hash-object', 'courtyard.html'], { encoding: 'utf8' }).trim(); } catch { /* ignore */ }

/* Only run-loop.sh can hand over a real --pre-blob. A worker invoking this itself,
 * or a human running an iteration by hand, has none — and with no baseline every
 * such run scored `no-ship` regardless of what it shipped. Recover the baseline
 * from history instead: the newest commit that is NOT part of this iteration. That
 * is HEAD~1 for the common single-commit case, and stays right when an iteration
 * commits its source and its ledger row separately.
 *
 * Worker only. A manager pass does not touch courtyard.html, so HEAD~1 for it is
 * the previous WORKER's commit — the fallback would credit the manager with the
 * worker's diff. No baseline is the honest answer there. */
let preBlob = PRE_BLOB, preFrom = PRE_BLOB ? 'runner' : null;
if (!preBlob && KIND === 'worker') {
  const mine = new RegExp(`^Iter ${iter}\\b`);
  for (const line of git('log', '-20', '--format=%H\t%s').split('\n')) {
    const [h, ...s] = line.split('\t');
    if (!h || mine.test(s.join('\t'))) continue;
    const b = git('rev-parse', `${h}:courtyard.html`);
    if (b) { preBlob = b; preFrom = `fallback:${h.slice(0, 8)}`; }
    break;
  }
}
const srcChanged = !!(preBlob && postBlob && preBlob !== postBlob);

/* No pathspec. `git diff <blob> <blob> -- <path>` is a usage error (exit 129), not
 * a filtered diff — git() swallowed it, so this branch always returned '' and the
 * count silently came from the HEAD~1 fallback the comment above calls unreliable. */
let srcLines = 0;
if (srcChanged) {
  const m = git('diff', '--numstat', preBlob, postBlob).match(/^(\d+)\s+(\d+)/);
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
/* A pure function of the evidence, so a merge can recompute it from the MERGED
 * evidence rather than from whichever call happened to run last. */
const verdictOf = (r) => {
  if (r.kind === 'launch-failed') return 'launch-failed';
  if (r.briefRejected) return 'rejected-brief';
  if (r.evidence.rc !== 0) return 'failed';
  if (r.evidence.srcChanged && r.evidence.reverted) return 'reverted';
  if (r.evidence.srcChanged) return 'shipped';
  return 'no-ship';
};

/* --- census position ------------------------------------------------------ */
let census = null, censusDelta = null;
if (existsSync(HIST)) {
  const hl = readFileSync(HIST, 'utf8').trim().split('\n').filter(Boolean);
  if (hl.length) {
    try { census = JSON.parse(hl[hl.length - 1]); } catch { /* ignore */ }
    /* Skip this iteration's own earlier row, or a merge would diff the census
     * against itself and report every scalar as unmoved. */
    const prev = [...rows].reverse().find(r => r.census && r.census.scalars && !(r.iter === iter && r.kind === KIND));
    if (census && prev) {
      censusDelta = {};
      for (const k in census.scalars) {
        const d = (census.scalars[k] || 0) - (prev.census.scalars[k] || 0);
        if (d) censusDelta[k] = d;
      }
    }
  }
}

const now = new Date().toISOString();
let row = {
  iter, kind: KIND,
  when: now,
  brief: brief ? brief.id : null,
  domain: brief ? brief.domain : null,
  changeKind: brief ? brief.kind : null,
  rung: brief ? brief.rung ?? null : null,
  attempts: brief ? brief.attempts || 1 : 1,
  verdict: null, selfVerdict,
  briefRejected: brief ? brief.briefRejected || null : null,
  secs: ELAPSED, costUsd: +costUsd.toFixed(4), turns, tokens, model,
  evidence: { srcChanged, srcLines, committed, logged, reverted: revertMark, rc: RC, sha, subject: subject.slice(0, 120), preBlob: preBlob.slice(0, 12), preFrom, postBlob: postBlob.slice(0, 12) },
  census: census ? { when: census.when, pageerrors: census.pageerrors, scalars: census.scalars } : null,
  censusDelta,
};

/* --- merge, or append ------------------------------------------------------ */
/* Neither call sees the whole iteration. The worker's knows the ledger and the
 * census; the runner's knows the wall time, the cost, the turn count and the true
 * pre-blob. So take the more informative value field by field — an unknown must
 * never erase a known — and never write a second line for the same iter+kind. */
if (prior) {
  const known = (a, b) => (b === null || b === undefined || b === '' || b === 0 || b === false) ? a : b;
  /* Zero is this log's "not measured" — no real run costs $0, takes 0 s or uses 0
   * turns, which is exactly why ten iterations of $0.00 read as data. So if only
   * ONE side has a number, the two calls are the same run measured twice (worker
   * then runner) and the number carries over. If BOTH have one, they are separate
   * runs sharing an iteration — run-loop.sh re-runs the manager, up to MAX_FAILS
   * times, while the queue stays empty and `iter` does not advance — and the cost
   * of the second is real spend that must be added, not maxed away. Maxing there
   * would hide a $12 manager spiral as a single $2.50 pass, which is the precise
   * signal this row exists to carry. */
  const tally = (a, b) => (a && b) ? a + b : Math.max(a || 0, b || 0);
  const pe = prior.evidence || {};
  const ne = row.evidence;
  row = {
    ...prior, ...row,
    when: prior.when,                       // first sighting; `updated` carries the merge
    updated: now,
    merges: (prior.merges || 0) + 1,
    secs: tally(prior.secs, row.secs),
    costUsd: +tally(prior.costUsd, row.costUsd).toFixed(4),
    turns: tally(prior.turns, row.turns),
    tokens: known(prior.tokens, row.tokens),
    model: known(prior.model, row.model),
    selfVerdict: known(prior.selfVerdict, row.selfVerdict),
    briefRejected: known(prior.briefRejected, row.briefRejected),
    census: known(prior.census, row.census),
    censusDelta: known(prior.censusDelta, row.censusDelta),
    evidence: {
      ...pe, ...ne,
      /* Monotone: once the source moved, or a commit landed, or the ledger gained
       * an entry, a later call that cannot see it does not undo it. */
      srcChanged: !!(pe.srcChanged || ne.srcChanged),
      committed: !!(pe.committed || ne.committed),
      logged: !!(pe.logged || ne.logged),
      reverted: !!(pe.reverted || ne.reverted),
      rc: (pe.rc || 0) || ne.rc,
      srcLines: Math.max(pe.srcLines || 0, ne.srcLines || 0),
      preBlob: known(pe.preBlob, ne.preBlob),
      preFrom: known(pe.preFrom, ne.preFrom),
    },
  };
}
row.verdict = verdictOf(row);

if (prior) {
  lines[priorIdx] = JSON.stringify(row);
  writeFileSync(RUNLOG, lines.join('\n') + '\n');
} else {
  appendFileSync(RUNLOG, JSON.stringify(row) + '\n');
}

/* Retire the brief so the next pop takes fresh work — unless no worker ever read
 * it, in which case it stays claimed and pop-brief re-issues it. */
if (brief && brief.status === 'active' && !launchFailed) { brief.status = 'done'; writeFileSync(CUR, JSON.stringify(brief, null, 2) + '\n'); }

/* Report the MERGED row, not this call's slice of it. */
const verdict = row.verdict, self = row.selfVerdict, ev = row.evidence;
const mm = String(Math.floor(row.secs / 60)), ss = String(row.secs % 60).padStart(2, '0');
const mark = { shipped: '✔', reverted: '↩', 'no-ship': '○', failed: '✗', 'rejected-brief': '⊘', 'launch-failed': '⚡' }[verdict] || '?';
const claim = self && self.replace(/[^a-z]/g, '') !== verdict.replace(/[^a-z]/g, '') ? `  (claimed: ${self})` : '';
console.log(`${mark} Iter ${String(iter).padEnd(4)} ${String((row.domain || '—') + ' x ' + (row.changeKind || '—')).padEnd(34)} ${verdict.padEnd(15)} ${mm}m${ss}s  $${row.costUsd.toFixed(2)}  ${ev.srcLines ? `${ev.srcLines}L` : '0L'}  ${ev.sha}${prior ? `  [merged +${row.merges}]` : ''}${claim}${launchFailed ? `  (no worker started — brief ${brief ? brief.id : '?'} stays claimed)` : ''}`);
