#!/usr/bin/env node
/* #173 — WHO is crowded in the plaza. town-caps says raising FAM_CAP buys presence and
 * buys crowding with it; this says which pair-type the crowding IS, so the fix can be
 * aimed. Pairs of unrelated people closer than PAIR_MIN, in the plaza box, tagged by
 * role and by whether each is stopped or walking. */
import { homedir } from 'node:os';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = homedir() + '/.claude/skills/screenshot-verify/node_modules/playwright/index.js';
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(arg('--file', 'courtyard.html'));
const SEEDS = arg('--seeds', '7,42,1234,555,90210,31337').split(',').map(Number);
const DAYS = +arg('--days', 12);
const FAM = arg('--fam', null);

let FILE = SRC;
if (FAM){
  let src = readFileSync(SRC, 'utf8');
  const re = /const FAM_CAP = \d+/;
  if (!re.test(src)){ console.error('no FAM_CAP'); process.exit(2); }
  src = src.replace(re, `const FAM_CAP = ${FAM}`);
  FILE = join(dirname(SRC), `.crowd-probe-${process.pid}.html`);
  writeFileSync(FILE, src);
}
const b = await chromium.launch();
const rows = [];
for (const seed of SEEDS){
  const page = await b.newPage({ viewport: { width: 1280, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(FILE).href + `?seed=${seed}&pause`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(`(() => {
    __reseed();
    const inPlaza = a => a.y < LN_WALK_N && Math.max(Math.abs(a.x - CX), Math.abs(a.y - CY)) >= 27.5
                      && a.x >= DIV_X0 && a.x < QUAY_X0;
    const tag = a => a.famKid ? 'kid' : a.fam ? 'parent' : a.kind === 'quay' ? 'quay'
              : a.east ? 'east' : a.lane ? 'lane' : (a.kind || 'other');
    const st = a => (a.stopped && a.state !== 'walk') ? 'sit' : 'walk';
    const pairs = {}, roleN = {}, ringHist = {};
    let n = 0, samples = 0, plazaN = 0;
    while (day < 1) __warp(1);
    const d0 = day;
    while (day < d0 + ${DAYS}){
      __warp(1);
      if (!(daylight > 0.25) || raining) continue;
      samples++;
      const p = agents.filter(a => a.kind !== 'sweeper' && inPlaza(a));
      plazaN += p.length;
      for (const a of p) roleN[tag(a)] = (roleN[tag(a)] || 0) + 1;
      for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++){
        const a = p[i], c = p[j];
        if (a.with === c || c.with === a) continue;
        if (Math.hypot(a.x - c.x, a.y - c.y) >= PAIR_MIN) continue;
        n++;
        const k = [tag(a) + ':' + st(a), tag(c) + ':' + st(c)].sort().join(' + ');
        pairs[k] = (pairs[k] || 0) + 1;
        const rr = Math.hypot((a.x + c.x) / 2 - FOUNTAIN.x, (a.y + c.y) / 2 - FOUNTAIN.y);
        const bin = rr < 2.6 ? 'basin<2.6' : rr < 4.2 ? 'stands 2.6-4.2' : rr < 5.4 ? 'crumbs 4.2-5.4'
                  : rr < 7.0 ? 'ring 5.4-7' : 'outer >7';
        ringHist[bin] = (ringHist[bin] || 0) + 1;
        const mx = (a.x + c.x) / 2, my = (a.y + c.y) / 2;
        let nd = 99; for (const nn of [0,1,2,3].map(i => ringNode(i, 0.5))) nd = Math.min(nd, Math.hypot(nn[0] - mx, nn[1] - my));
        ringHist['@node<1.2 ' + (nd < 1.2)] = (ringHist['@node<1.2 ' + (nd < 1.2)] || 0) + 1;
        const th = Math.round((((Math.atan2(my - FOUNTAIN.y, mx - FOUNTAIN.x) * 180 / Math.PI) % 360 + 360) % 360) / 30) % 12;
        ringHist['th' + String(th * 30).padStart(3, '0')] = (ringHist['th' + String(th * 30).padStart(3, '0')] || 0) + 1;
      }
    }
    return { pairs, roleN, ringHist, n, samples, plazaN };
  })()`);
  if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
  rows.push({ seed, ...r });
  await page.close();
}
await b.close();
if (FILE !== SRC) unlinkSync(FILE);
const agg = k => { const o = {}; for (const r of rows) for (const [a, v] of Object.entries(r[k])) o[a] = (o[a] || 0) + v; return o; };
const P = agg('pairs'), R2 = agg('roleN'), RH = agg('ringHist');
const N = rows.reduce((s, r) => s + r.n, 0), S = rows.reduce((s, r) => s + r.samples, 0);
const PN = rows.reduce((s, r) => s + r.plazaN, 0);
console.log(`\n=== plaza-crowd [FAM_CAP ${FAM || 'HEAD'}] ${SEEDS.length} seeds x ${DAYS} days, ${S} daylight-dry samples ===`);
console.log(`  plaza presence ${(PN / S).toFixed(2)}   crowded pairs ${(N / S).toFixed(2)}   per person ${(N / PN).toFixed(3)}`);
console.log('\n-- who is in the plaza (mean per sample) --');
for (const [k, v] of Object.entries(R2).sort((a, c) => c[1] - a[1])) console.log(`  ${k.padEnd(12)} ${(v / S).toFixed(2)}`);
console.log('\n-- crowded PAIRS by role+state (share of all) --');
for (const [k, v] of Object.entries(P).sort((a, c) => c[1] - a[1]).slice(0, 14))
  console.log(`  ${k.padEnd(34)} ${(v / S).toFixed(3)}/sample  ${(100 * v / N).toFixed(1)}%`);
console.log('\n-- where, by radius from the fountain --');
for (const [k, v] of Object.entries(RH).sort((a, c) => c[1] - a[1])) console.log(`  ${k.padEnd(16)} ${(100 * v / N).toFixed(1)}%`);
