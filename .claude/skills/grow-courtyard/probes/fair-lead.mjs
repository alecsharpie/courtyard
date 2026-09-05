#!/usr/bin/env node
/* b217 — the PRICED walk (what fairFits computes) against the walk actually taken. */
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = homedir() + '/.claude/skills/screenshot-verify/node_modules/playwright/index.js';
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const SRC = resolve(process.argv[2] || 'courtyard.html');
const b = await chromium.launch();
const rows = [];
for (const seed of [7, 42, 1234]){
  const page = await b.newPage({ viewport: { width: 1280, height: 700 } });
  await page.goto(pathToFileURL(SRC).href + `?seed=${seed}&pause&t=2`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(`(() => {
    __reseed();
    const raw = spawnFairAgent, out = [];
    spawnFairAgent = function(){
      const n = agents.length; raw();
      if (agents.length > n){
        const a = agents[agents.length - 1];
        const g = alleyGate(a.slot, a.plane), L = fairLead(a.slot, a.plane);
        a.__priced = pathHours(g[0], g[1], L.concat([[a.slot.x, a.slot.y]]), a.speed);
        a.__t0 = hour; a.__th = FAIR_TH[FAIR_SLOTS.indexOf(a.slot)];
      }
    };
    while (day < 2) __warp(1);
    const d0 = day;
    while (day < d0 + 26){
      __warp(0.25);
      for (const a of agents){
        if (a.fair && a.stopped && a.__priced !== undefined && a.__t1 === undefined){
          a.__t1 = hour;
          out.push({ th:a.__th, priced:+a.__priced.toFixed(2), actual:+(hour - a.__t0).toFixed(2), sp:+a.speed.toFixed(2), rain: raining?1:0 });
        }
      }
    }
    return out;
  })()`);
  rows.push(...r); await page.close();
}
await b.close();
const rat = rows.map(r => r.actual / r.priced).sort((a,b)=>a-b);
const q = (a,p) => a[Math.min(a.length-1, Math.floor(p*a.length))];
console.log(`n ${rows.length}   actual/priced  min ${q(rat,0).toFixed(2)}  p25 ${q(rat,.25).toFixed(2)}  med ${q(rat,.5).toFixed(2)}  p75 ${q(rat,.75).toFixed(2)}  max ${q(rat,.999).toFixed(2)}`);
const by = {};
for (const r of rows){ (by[r.th] ||= []).push(r); }
for (const th of Object.keys(by).map(Number).sort((a,b)=>a-b)){
  const g = by[th];
  const m = a => (a.reduce((s,x)=>s+x,0)/a.length).toFixed(2);
  console.log(`th ${String(th).padStart(3)}  n ${String(g.length).padStart(3)}  priced ${m(g.map(x=>x.priced))}  actual ${m(g.map(x=>x.actual))}`);
}
