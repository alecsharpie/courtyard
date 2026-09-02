#!/usr/bin/env node
/* is the evening stand ON the island? the whole eyot stay, sampled: the fraction of
 * samples where a rider or their companion stands on water rather than turf, and the
 * closest either of them comes to the moored punt (the 0.9-cell law).  Run on both. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (k, d) => { const i = process.argv.indexOf(k); return i < 0 ? d : process.argv[i+1]; };
const SRC = resolve(arg('--file', 'courtyard.html'));
const browser = await chromium.launch();
const out = [];
for (const seed of arg('--seeds','7,42,1234,5,99,404,777,2024,31337,8').split(',')){
  const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(SRC).href + `?seed=${seed}&pause`);
  await page.waitForFunction('typeof __warp === "function"');
  out.push(await page.evaluate(`(async () => {
    __reseed();
    const st = { day:{n:0,wet:0,minBoat:99}, night:{n:0,wet:0,minBoat:99} };
    while (day < 1) __warp(1);
    const d0 = day;
    while (day < d0 + 14){
      __warp(0.25);
      if (punt.leg !== 3) continue;
      const k = punt.night ? 'night' : 'day';
      for (const o of [punt.rider, punt.mate]){
        if (!o || o.done || o.aboard) continue;
        if (o.state === 'walk') continue;   // the walk up from the landing crosses the water's edge on BOTH builds; the question is where they STAND
        st[k].n++;
        if (!onEyot(o.x, o.y)){ st[k].wet++; st[k].who = st[k].who || []; if (st[k].who.length < 12) st[k].who.push({m: o === punt.mate, x:+o.x.toFixed(2), y:+o.y.toFixed(2), s:o.state}); }
        const d = Math.hypot(o.x - punt.x, o.y - punt.y);
        if (d < st[k].minBoat) st[k].minBoat = d;
      }
    }
    return st;
  })()`));
  if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
  await page.close();
}
await browser.close();
for (const k of ['day','night']){
  const n = out.reduce((s,o)=>s+o[k].n,0), w = out.reduce((s,o)=>s+o[k].wet,0);
  const m = Math.min(...out.map(o=>o[k].minBoat));
  const who = out.flatMap(o=>o[k].who||[]);
  if (who.length) console.log('   offenders: ' + who.slice(0,8).map(w=>(w.m?'mate':'rider')+' '+w.x+','+w.y+' '+w.s).join(' · '));
  console.log(`  ${k.padEnd(5)} ashore samples ${String(n).padStart(5)}  off the turf ${w} (${n?(100*w/n).toFixed(1):'0.0'}%)  closest to the hull ${m===99?'—':m.toFixed(2)} cells`);
}
