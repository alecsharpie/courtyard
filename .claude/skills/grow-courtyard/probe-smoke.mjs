#!/usr/bin/env node
/* probe-smoke — does the instrument shelf still RUN?
 *
 * The loop has accumulated ~360 probe scripts across THREE trees and has never
 * once known how many of them still execute. `probes/bonfire-year.mjs` threw on
 * every invocation for seven iterations because #178 deleted a field out from
 * under its `toFixed` and nothing ever ran it again. This is the runner that
 * would have caught it.
 *
 * It executes every probe it finds, with a per-probe timeout, and reports:
 *   PASS    exit 0
 *   THROW   non-zero exit — the instrument is broken against this build
 *   TIMEOUT killed at the deadline (may be broken, may just be a long sweep;
 *           `partial` = it had already printed, so it got as far as reporting)
 *
 * MANAGER CADENCE, NOT WORKER CADENCE. A full run is ~360 chromium launches.
 * Do not wire it into an iteration's gate path; run it when the shelf is
 * suspect, or use --tree / --filter to smoke one corner of it.
 *
 *   node .claude/skills/grow-courtyard/probe-smoke.mjs
 *   … --timeout 60 --jobs 4 --tree skill --filter bonfire --json out.json
 */
import { readdirSync, existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, resolve, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const has = k => argv.includes(k);
const TIMEOUT = +arg('--timeout', 45) * 1000;
const JOBS = +arg('--jobs', 6);
const WANT = arg('--tree', 'all');
const FILTER = arg('--filter', null);
const JSONOUT = arg('--json', null);
const QUIET = has('--quiet');

/* The three trees. `skill` is the one SKILL.md documents; `root` is a second
 * TRACKED shelf that no doc in this skill mentions; `scratch` is the gitignored
 * `/probe-*.mjs` an iteration writes at the root and usually abandons. */
const RUNNABLE = /\.(mjs|sh|py)$/;
const TREES = [
  { key: 'skill',   label: 'skill   .claude/skills/grow-courtyard/probes/', dir: join(HERE, 'probes'),  pick: f => RUNNABLE.test(f) },
  { key: 'root',    label: 'root    probes/',                               dir: join(REPO, 'probes'),  pick: f => RUNNABLE.test(f) },
  { key: 'scratch', label: 'scratch probe-*.mjs (gitignored)',              dir: REPO,                  pick: f => f.startsWith('probe-') && RUNNABLE.test(f) },
];
/* the shelf is not all node: three .sh quota gates and a .py live in it too */
const interp = f => f.endsWith('.sh') ? ['bash', [f]] : f.endsWith('.py') ? ['python3', [f]] : [process.execPath, [f]];

const jobs = [];
for (const t of TREES) {
  if (WANT !== 'all' && WANT !== t.key) continue;
  if (!existsSync(t.dir)) continue;
  for (const f of readdirSync(t.dir).sort()) {
    if (!t.pick(f)) continue;
    if (FILTER && !f.includes(FILTER)) continue;
    jobs.push({ tree: t.key, name: f, file: join(t.dir, f) });
  }
}
if (!jobs.length) { console.error('no probes matched'); process.exit(2); }

/* A probe is a measurement of a BUILD, so pin what it is measuring: the working
 * tree must be HEAD, or "X of them throw" is a claim about uncommitted edits. */
let atHead = true;
try { atHead = execSync('git diff --stat HEAD -- courtyard.html', { cwd: REPO, encoding: 'utf8' }).trim() === ''; } catch { atHead = null; }

/* probes that build an instrumented variant beside the source name it anything;
 * the only reliable rule is "an .html at the repo root that is not the artifact" */
const strays = () => new Set(readdirSync(REPO).filter(f => f.endsWith('.html') && f !== 'courtyard.html'));
const before = strays();
const srcSha = existsSync(join(REPO, 'courtyard.html')) ? readFileSync(join(REPO, 'courtyard.html'), 'utf8').length : 0;

const runOne = j => new Promise(done => {
  const t0 = Date.now();
  const [cmd, args] = interp(j.file);
  const p = spawn(cmd, args, { cwd: REPO, env: process.env });
  let out = '', err = '', killed = false;
  p.stdout.on('data', d => { out += d; if (out.length > 1 << 18) out = out.slice(-(1 << 17)); });
  p.stderr.on('data', d => { err += d; if (err.length > 1 << 18) err = err.slice(-(1 << 17)); });
  const timer = setTimeout(() => { killed = true; p.kill('SIGKILL'); }, TIMEOUT);
  p.on('error', e => { clearTimeout(timer); done({ ...j, status: 'THROW', ms: Date.now() - t0, why: String(e.message), partial: false }); });
  p.on('close', code => {
    clearTimeout(timer);
    const ms = Date.now() - t0, partial = out.trim().length > 0;
    if (killed) return done({ ...j, status: 'TIMEOUT', ms, partial, why: '' });
    if (code === 0) return done({ ...j, status: 'PASS', ms, partial, why: '' });
    /* the useful line is the throw itself, not the stack under it */
    /* the useful line is the MESSAGE — not the stack under it, not the frame
     * above it, and not the dumped property bag of a playwright error object */
    const NOISE = /^(at |\^|'|node:|file:|Node\.js v|triggerUncaughtException|Call log:|- navigating|throw |[{}\][]|\w+: *['\[{]|\w+:$)/;
    const lines = err.split('\n').map(s => s.trim()).filter(Boolean).filter(l => l.length > 3 && !NOISE.test(l));
    const hit = lines[0] || `exit ${code}`;
    done({ ...j, status: 'THROW', ms, partial, why: hit.slice(0, 140), code });
  });
});

const results = [];
let next = 0, doneN = 0;
await Promise.all(Array.from({ length: Math.min(JOBS, jobs.length) }, async () => {
  while (next < jobs.length) {
    const j = jobs[next++];
    const r = await runOne(j);
    results.push(r); doneN++;
    if (!QUIET) process.stderr.write(`\r  ${doneN}/${jobs.length}  ${r.status.padEnd(7)} ${r.name.slice(0, 36).padEnd(36)}`);
  }
}));
if (!QUIET) process.stderr.write('\r' + ' '.repeat(70) + '\r');

results.sort((a, b) => a.tree.localeCompare(b.tree) || a.name.localeCompare(b.name));
const n = s => results.filter(r => r.status === s).length;
const pad = (v, w) => String(v).padStart(w);

console.log(`\nprobe-smoke — ${jobs.length} probes, timeout ${TIMEOUT / 1000}s, ${JOBS} at a time`);
console.log(`courtyard.html: ${atHead === null ? 'git unavailable' : atHead ? 'clean at HEAD' : 'DIRTY — these numbers are about your working tree, not HEAD'}`);
console.log(`\n  tree                                              n   pass  throw  t/out`);
for (const t of TREES) {
  const R = results.filter(r => r.tree === t.key); if (!R.length) continue;
  const c = s => R.filter(r => r.status === s).length;
  console.log(`  ${t.label.padEnd(46)}${pad(R.length, 4)}${pad(c('PASS'), 7)}${pad(c('THROW'), 7)}${pad(c('TIMEOUT'), 7)}`);
}
console.log(`  ${'TOTAL'.padEnd(46)}${pad(results.length, 4)}${pad(n('PASS'), 7)}${pad(n('THROW'), 7)}${pad(n('TIMEOUT'), 7)}`);

const thr = results.filter(r => r.status === 'THROW');
if (thr.length) {
  console.log(`\nTHREW (${thr.length}) — broken against this build:`);
  for (const r of thr) console.log(`  ${r.tree.padEnd(7)} ${r.name.padEnd(30)} ${pad((r.ms / 1000).toFixed(1), 5)}s  ${r.why}`);
}
const to = results.filter(r => r.status === 'TIMEOUT');
if (to.length) {
  console.log(`\nTIMED OUT (${to.length}) at ${TIMEOUT / 1000}s — ${to.filter(r => r.partial).length} had already printed (long sweep), ${to.filter(r => !r.partial).length} silent:`);
  for (const r of to) console.log(`  ${r.tree.padEnd(7)} ${r.name.padEnd(30)} ${r.partial ? 'partial' : 'silent'}`);
}
const slow = results.filter(r => r.status === 'PASS').sort((a, b) => b.ms - a.ms).slice(0, 5);
if (slow.length) console.log(`\nslowest passing: ${slow.map(r => `${r.name} ${(r.ms / 1000).toFixed(0)}s`).join(' · ')}`);

/* probes that build an instrumented variant beside the source leak it when killed */
const leaked = [...strays()].filter(f => !before.has(f));
if (leaked.length) console.log(`\nleaked temp files at the repo root (killed probes): ${leaked.join(' ')}`);
if (readFileSync(join(REPO, 'courtyard.html'), 'utf8').length !== srcSha) console.log(`\n!! courtyard.html CHANGED SIZE during the run — a probe wrote to the source.`);

if (JSONOUT) writeFileSync(resolve(REPO, JSONOUT), JSON.stringify({ at: new Date().toISOString(), timeout: TIMEOUT, atHead, results }, null, 1));
process.exit(0);
