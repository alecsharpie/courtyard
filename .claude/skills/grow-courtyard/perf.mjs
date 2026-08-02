#!/usr/bin/env node
/* perf.mjs — frame-time gate, judged against an INTERLEAVED same-session control.
 *
 *   node perf.mjs                 current working tree vs courtyard.html at HEAD
 *   node perf.mjs --ref <sha>     ...vs that revision
 *   node perf.mjs --reps 4
 *
 * Why interleaved A/B/A/B and not a stored baseline: this machine swings ±30% with
 * whatever else is running, so a baseline captured yesterday measures yesterday's
 * load, not today's code. The previous loop spent seven iterations rediscovering
 * that. The control is checked out beside the candidate and both are measured in
 * the same minute, alternating.
 *
 * Neither census nor screenshots can see frame-time drift, so a per-frame pass
 * added without this gate is invisible until the diorama is visibly stuttering.
 */
import { homedir, tmpdir } from 'node:os';
import { writeFileSync, mkdtempSync, existsSync, copyFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const REF = arg('--ref', 'HEAD');
const REPS = +arg('--reps', '3');
const SECONDS = +arg('--seconds', '5');

const tmp = mkdtempSync(join(tmpdir(), 'courtyard-perf-'));
const candidate = join(tmp, 'candidate.html');
const control = join(tmp, 'control.html');
copyFileSync(join(REPO, 'courtyard.html'), candidate);
try {
  writeFileSync(control, execFileSync('git', ['-C', REPO, 'show', `${REF}:courtyard.html`], { encoding: 'utf8', maxBuffer: 1 << 28 }));
} catch {
  console.error(`perf: could not read courtyard.html at ${REF} — is this a git checkout with a commit?`);
  process.exit(1);
}

/* Two scenes, because the night pass does markedly more work than the day pass. */
const SCENES = [{ name: 'day', t: 175 }, { name: 'night', t: 1230 }];

async function measure(browser, file, t) {
  const p = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  await p.goto(`${pathToFileURL(file).href}?seed=42&t=${t}`);
  await p.waitForTimeout(1200);                       // let it settle before timing
  const ms = await p.evaluate(async secs => {
    const d = [];
    let prev = performance.now();
    await new Promise(done => {
      const tick = now => { d.push(now - prev); prev = now; if (now - start < secs * 1000) requestAnimationFrame(tick); else done(); };
      const start = performance.now();
      requestAnimationFrame(tick);
    });
    d.sort((a, b) => a - b);
    return { n: d.length, median: d[d.length >> 1], p95: d[Math.floor(d.length * 0.95)] };
  }, SECONDS);
  await p.close();
  return ms;
}

const b = await chromium.launch();
const runs = { candidate: {}, control: {} };
for (const s of SCENES) { runs.candidate[s.name] = []; runs.control[s.name] = []; }

for (let r = 0; r < REPS; r++) {
  for (const s of SCENES) {
    /* A/B then B/A, so a machine that is warming up or cooling down biases both
     * variants equally rather than whichever one happened to go first. */
    const order = r % 2 ? ['control', 'candidate'] : ['candidate', 'control'];
    for (const which of order) {
      const m = await measure(b, which === 'candidate' ? candidate : control, s.t);
      runs[which][s.name].push(m.median);
    }
  }
  process.stdout.write(`  rep ${r + 1}/${REPS} done\n`);
}
await b.close();
rmSync(tmp, { recursive: true, force: true });

const best = a => Math.min(...a);   // the least-disturbed reading of each variant
let worst = 0;
console.log(`\nperf: candidate (working tree) vs control (${REF}) — ${REPS} interleaved reps, median frame ms, best rep\n`);
for (const s of SCENES) {
  const c = best(runs.candidate[s.name]), k = best(runs.control[s.name]);
  const pct = ((c - k) / k) * 100;
  worst = Math.max(worst, pct);
  console.log(`  ${s.name.padEnd(6)} candidate ${c.toFixed(2)}ms   control ${k.toFixed(2)}ms   ${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`);
}
console.log();
if (worst > 15) { console.error(`VERDICT: FAIL — ${worst.toFixed(1)}% slower than the control. Fix or justify in the ledger.`); process.exit(1); }
if (worst > 6) console.log(`VERDICT: PASS (watch) — ${worst.toFixed(1)}% slower; note it in the ledger.`);
else console.log('VERDICT: PASS — no meaningful frame-time regression.');
