#!/usr/bin/env node
/* probes/swan-pair.mjs — the pair: mean separation, share of the day in each state, and
 * whether a thirty-second look at the river usually sees one of them doing something.
 * Ten seeds × one day, stepped inside ONE evaluate at a pinned seed. */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const html = readFileSync(new URL('../../../../courtyard.html', import.meta.url));
const srv = createServer((_, res) => { res.writeHead(200, {'Content-Type':'text/html'}); res.end(html); }).listen(0);
const port = srv.address().port;
const SEEDS = [1, 2, 3, 5, 7, 11, 13, 42, 99, 123];
const STEP = 0.25, SPAN = 55;
const browser = await chromium.launch();
let sepSum = 0, n = 0, acts = {}, looks = 0, looksBusy = 0, minSep = 1e9, maxSep = 0, oob = 0, holds = [];
for (const seed of SEEDS){
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/?seed=${seed}&pause&t=55`);   // day 1: swans exist
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(({ STEP, SPAN }) => {
    __reseed();
    let sep = 0, n = 0, minSep = 1e9, maxSep = 0, oob = 0; const acts = {}; const windows = []; let win = 0, winBusy = 0;
    const holds = []; const cur = {};
    for (let t = 0; t < SPAN; t += STEP){
      __warp(STEP);
      const sw = __entities().filter(e => e.kind === 'swan');
      if (sw.length !== 2) continue;
      const d = Math.hypot(sw[0].x - sw[1].x, sw[0].y - sw[1].y);
      sep += d; n++; minSep = Math.min(minSep, d); maxSep = Math.max(maxSep, d);
      for (const s of sw){
        const a = s.act || 'none'; acts[a] = (acts[a] || 0) + 1;
        if (s.x < 115.5 || s.x > 125.5 || s.y < 4.9 || s.y > 58.1) oob++;
        if (cur[s.id] && cur[s.id].a === a) cur[s.id].n++;
        else { if (cur[s.id] && cur[s.id].a !== 'swim' && cur[s.id].a !== 'none') holds.push([cur[s.id].a, cur[s.id].n * STEP]); cur[s.id] = {a, n:1}; }
      }
      const busy = sw.some(s => s.act && s.act !== 'swim');
      win++; if (busy) winBusy++;
      if (win * STEP >= 30){ windows.push(winBusy > 0); win = 0; winBusy = 0; }
    }
    return { sep, n, minSep, maxSep, acts, windows, oob, holds };
  }, { STEP, SPAN });
  sepSum += r.sep; n += r.n; minSep = Math.min(minSep, r.minSep); maxSep = Math.max(maxSep, r.maxSep); oob += r.oob;
  for (const k in r.acts) acts[k] = (acts[k] || 0) + r.acts[k];
  looks += r.windows.length; looksBusy += r.windows.filter(Boolean).length;
  holds.push(...r.holds);
  await page.close();
}
await browser.close(); srv.close();
const tot = Object.values(acts).reduce((a, b) => a + b, 0);
console.log(`swans — ${SEEDS.length} seeds × ${SPAN}s, step ${STEP}`);
console.log(`  pair separation  mean ${(sepSum / n).toFixed(2)} cells  (min ${minSep.toFixed(2)}, max ${maxSep.toFixed(2)})`);
for (const k in acts) console.log(`  share ${k.padEnd(7)} ${(100 * acts[k] / tot).toFixed(1)}%`);
const hb = {}; for (const [a, l] of holds){ (hb[a] = hb[a] || []).push(l); }
for (const a in hb) console.log(`  ${a} bouts ${hb[a].length}, length ${Math.min(...hb[a]).toFixed(2)}–${Math.max(...hb[a]).toFixed(2)} s`);
console.log(`  30 s looks with something happening  ${looksBusy}/${looks}`);
console.log(`  samples outside the channel  ${oob}`);
