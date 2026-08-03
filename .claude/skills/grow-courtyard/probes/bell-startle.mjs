#!/usr/bin/env node
/* bell-startle — does the world still answer the bell?
 *
 *   node .claude/skills/grow-courtyard/probes/bell-startle.mjs     (from the repo root)
 *
 * strikeClock() writes bellUntil; simStep() reads it on the rising edge and calls
 * bellStartle(), which puts the belfry roost up and stops ~45% of the walkers.
 * Neither effect is visible to the census (birds and people are already counted)
 * and both last ~2 s, so a still frame cannot see them either. This samples the
 * state at EVERY strike over a seeded 400 s run and reports the two rates.
 *
 * Expect: ~45% of walkers listening, ~5 pigeons up per strike. A listener rate of
 * 0 means the bellUntil read is dead again; 0 pigeons means the roost never refills.
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch(); const p = await b.newPage();
await p.goto(pathToFileURL(resolve('courtyard.html')).href + '?seed=42&t=0&pause');
await p.waitForFunction(() => typeof window.__warp === 'function');
const r = await p.evaluate(() => {
  const rows = [];
  let seen = -1;
  for (let k = 0; k < 6000; k++){
    window.__warp(1/15);
    if (bellSeen !== seen){ seen = bellSeen;
      rows.push({ listen: agents.filter(a=>a.listen>0).length,
                  walking: agents.filter(a=>a.state==='walk').length,
                  up: birds.filter(x=>x.state==='wheel').length, roost: +belfryRoost.toFixed(1) }); }
  }
  return rows;
});
const L = r.reduce((s,x)=>s+x.listen,0), W = r.reduce((s,x)=>s+x.walking,0), U = r.reduce((s,x)=>s+x.up,0);
console.log(`${r.length} strikes · listeners ${L}/${W} walking = ${(100*L/W).toFixed(0)}% · pigeons up per strike ${(U/r.length).toFixed(1)}`);
console.log('first 10:', r.slice(0,10).map(x=>`${x.listen}/${x.walking} up${x.up}`).join('  '));
console.log('last 10:', r.slice(-10).map(x=>`${x.listen}/${x.walking} up${x.up}`).join('  '));
await b.close();
