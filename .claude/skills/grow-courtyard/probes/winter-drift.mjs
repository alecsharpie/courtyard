#!/usr/bin/env node
/* probe-winter-drift — what does the census's WINTER row do between builds? (#205)
 *
 * The winter row (census.mjs, warp 1220 x 3 seeds) got a report at #187 and no
 * collapse floor, because CORE reads only the summer nine. To cut a floor for it you
 * need the noise, and the noise that matters is not the seed spread inside ONE build
 * — it is the drift from one committed build to the next, because every iteration
 * that adds an `R()` draw reshuffles the whole seeded world.
 *
 * So: load the winter row at a list of refs and print each field's step-to-step move,
 * as a percentage. The largest DOWNWARD step a field takes across builds that did not
 * intend to touch it is the floor that field must clear.
 *
 *   node .claude/skills/grow-courtyard/probes/winter-drift.mjs [ref ...]
 *   (default: eight iteration commits, #189 -> HEAD)
 */
import { homedir } from 'node:os';
import { existsSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const REPO = process.cwd();
const SEEDS = [7, 42, 1234], WARP = 1220;
const REFS = process.argv.slice(2).length ? process.argv.slice(2)
  : ['452e23d', '4848fdd', '250e8b4', '4bc48b6', '308606d', 'ca3480e', 'd72c608', 'HEAD'];

/* the fields a winter floor could be cut on: the winter scalars, plus the two the
 * ice block holds and no scalar can see */
const pick = c => ({ ...c.scalars, frozen: c.ice.frozen, margin: c.ice.margin });

const b = await chromium.launch();
const rows = [];
for (const ref of REFS) {
  const f = `/tmp/wdrift-${ref.replace(/\W+/g, '_')}.html`;
  /* maxBuffer: courtyard.html passed node's 1 MiB default at #181 (c289) */
  if (!existsSync(f)) writeFileSync(f, execFileSync('git', ['show', `${ref}:courtyard.html`], { cwd: REPO, maxBuffer: 1 << 28 }));
  const sum = {};
  for (const seed of SEEDS) {
    const p = await b.newPage();
    let threw = null;
    p.on('pageerror', e => { threw ||= String(e); });
    await p.goto(`${pathToFileURL(f).href}?seed=${seed}&t=0&pause`);
    await p.waitForTimeout(300);
    const c = await p.evaluate(w => { window.__reseed(); window.__warp(w); return window.__census(); }, WARP);
    await p.close();
    if (threw) console.error(`  ${ref}@${seed}: PAGE ERROR ${threw.slice(0, 90)}`);
    const v = pick(c);
    for (const k in v) sum[k] = (sum[k] || 0) + v[k];
  }
  rows.push({ ref, sum });
  console.error(`  ${ref} done`);
}
await b.close();

const KEYS = Object.keys(rows[0].sum);
console.log(`\nwinter row (3 seeds x warp ${WARP}), ${rows.length} builds oldest -> newest\n`);
console.log('field'.padEnd(14) + rows.map(r => r.ref.slice(0, 7).padStart(9)).join(''));
for (const k of KEYS) console.log(k.padEnd(14) + rows.map(r => String(r.sum[k]).padStart(9)).join(''));

console.log(`\nstep-to-step move, % of the PREVIOUS build (a build that did not mean to touch winter)\n`);
console.log('field'.padEnd(14) + rows.slice(1).map(r => r.ref.slice(0, 7).padStart(9)).join('') + '   worst DROP');
for (const k of KEYS) {
  const steps = rows.slice(1).map((r, i) => {
    const a = rows[i].sum[k], b2 = r.sum[k];
    return a > 0 ? ((b2 - a) / a) * 100 : 0;
  });
  const worst = Math.min(0, ...steps);
  console.log(k.padEnd(14) + steps.map(s => (s >= 0 ? '+' : '') + s.toFixed(1) + '%').map(s => s.padStart(9)).join('')
    + `      ${worst.toFixed(1)}%`);
}
