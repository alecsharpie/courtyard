#!/usr/bin/env node
/* b217 — PRESENCE at the fair over the fair's own span, plus the lead per arrival and
 * the outcome AT THE CHOICE (admitted / all taken / none fits the walk).
 * Not an arrival count and not a per-instant crop: the crowd is integrated over the
 * HOLD (fairStart..fairEnd) and quoted as a mean head-count. */
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = homedir() + '/.claude/skills/screenshot-verify/node_modules/playwright/index.js';
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(arg('--file', 'courtyard.html'));
const SEEDS = arg('--seeds', '7,42,1234,555,90210,31337').split(',').map(Number);
const DAYS = +arg('--days', 26);
const b = await chromium.launch();
const days = [], leads = [], choices = [];
for (const seed of SEEDS){
  const page = await b.newPage({ viewport: { width: 1280, height: 700 } });
  await page.goto(pathToFileURL(SRC).href + `?seed=${seed}&pause&t=2`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(`(() => {
    __reseed();                                  // R is REASSIGNED here — instrument after
    const ch = [];
    const raw = spawnFairAgent;
    let fired = 0;
    spawnFairAgent = function(){
      fired++;
      const before = agents.length;
      const taken = FAIR_SLOTS.filter(s => s.taken).length;
      raw();
      const got = agents.length > before;
      if (!got){
        const anyFree = FAIR_SLOTS.some(s => !s.taken);
        ch.push({ day, hour:+hour.toFixed(2), out: anyFree ? 'nofit' : 'full', taken });
      } else ch.push({ day, hour:+hour.toFixed(2), out:'in', taken });
    };
    while (day < 2) __warp(1);
    const d0 = day, dayRows = [], arr = [];
    let cur = null;
    while (day < d0 + ${DAYS}){
      __warp(0.25);
      if (isFairDay()){
        if (!cur || cur.day !== day) dayRows.push(cur = { seed:${seed}, day, s:+fairStart().toFixed(2),
          e:+fairEnd().toFixed(2), n:0, hold:0, holdN:0, span:0, spanN:0, peak:0, rainH:0 });
        const inHold = hour >= cur.s && hour < cur.e;
        const inSpan = hour >= cur.s - FAIR_UP && hour < cur.e + FAIR_DOWN;
        let here = 0;
        for (const a of agents){
          if (!a.fair) continue;
          if (a.__t0 === undefined) a.__t0 = hour;
          if (a.stopped){
            here++;
            if (a.__t1 === undefined){ a.__t1 = hour;
              arr.push({ seed:${seed}, day, set:+a.__t0.toFixed(2), got:+hour.toFixed(2),
                         lead:+(hour - a.__t0).toFixed(2), s:cur.s, e:cur.e,
                         frac:+((hour - cur.s) / (cur.e - cur.s)).toFixed(3) }); }
          }
        }
        if (inHold){ cur.hold += here; cur.holdN++; if (raining) cur.rainH++; }
        if (inSpan){ cur.span += here; cur.spanN++; }
        cur.peak = Math.max(cur.peak, here);
      }
    }
    return { dayRows, arr, ch, fired };
  })()`);
  days.push(...r.dayRows); leads.push(...r.arr); choices.push(...r.ch);
  await page.close();
}
await b.close();
const q = (a, p) => a.length ? a.slice().sort((x,y)=>x-y)[Math.min(a.length-1, Math.floor(p*a.length))] : NaN;
const mean = a => a.reduce((s,x)=>s+x,0) / (a.length||1);

const held = days.filter(d => d.holdN > 0);
const holdMean = held.map(d => d.hold / d.holdN);
const spanMean = held.map(d => d.span / d.spanN);
console.log(`\nfair days ${held.length} over ${SEEDS.length} seeds x ${DAYS} d`);
console.log(`CROWD, mean head-count through the HOLD   ${mean(holdMean).toFixed(2)}   (per day: min ${q(holdMean,0).toFixed(2)}  med ${q(holdMean,.5).toFixed(2)}  max ${q(holdMean,.999).toFixed(2)})`);
console.log(`CROWD, mean over the whole SPAN           ${mean(spanMean).toFixed(2)}`);
console.log(`peak head-count  med ${q(days.map(d=>d.peak),.5)}  max ${Math.max(...days.map(d=>d.peak))}   zero-crowd days ${held.filter(d=>d.peak===0).length}`);
const ls = leads.map(l => l.lead);
const fairLen = mean(held.map(d => d.e - d.s));
console.log(`\nLEAD (set-out -> standing), h   n ${ls.length}  min ${q(ls,0).toFixed(2)}  p25 ${q(ls,.25).toFixed(2)}  MED ${q(ls,.5).toFixed(2)}  p75 ${q(ls,.75).toFixed(2)}  max ${q(ls,.999).toFixed(2)}`);
console.log(`   fair hold length ${fairLen.toFixed(2)} h -> median lead is ${(q(ls,.5)/fairLen*100).toFixed(0)}% of it   (target: well under 50%)`);
const fr = leads.map(l => l.frac);
console.log(`ARRIVAL as a fraction of the hold  p10 ${q(fr,.1).toFixed(2)}  med ${q(fr,.5).toFixed(2)}  p90 ${q(fr,.9).toFixed(2)}   after the close: ${fr.filter(f=>f>1).length}`);
const tot = choices.length, ins = choices.filter(c=>c.out==='in').length;
const nofit = choices.filter(c=>c.out==='nofit').length, full = choices.filter(c=>c.out==='full').length;
console.log(`\nAT THE CHOICE  ${tot} offers -> admitted ${ins} (${(100*ins/tot).toFixed(1)}%)  REFUSED-nofit ${nofit} (${(100*nofit/tot).toFixed(1)}%)  full ${full} (${(100*full/tot).toFixed(1)}%)`);
if (process.env.FAIR_JSON) console.log('JSON', JSON.stringify({ holdMean: mean(holdMean), medLead: q(ls,.5), n: ls.length }));
