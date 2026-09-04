#!/usr/bin/env node
/* #186 — is the covered walk USED?
 *
 * Two populations, counted at the edge each one is made on, never by presence:
 *   STROLL   a lawn set-out whose place is a bay        (kind chosen in spawnLawnAgent)
 *   SHELTER  a lawn stay ended by rain that took the walk instead of the gate
 * plus the refusals of the shelter offer, clause by clause in evaluation order, and the
 * PRESENCE under the walk sampled per tick while it is raining — which is the thing the
 * brief actually asks for a screenshot of. Every reading is against a CONTROL: the same
 * seeds and days run on the pre-arcade file, whose only comparable number is how many
 * lawn stays the rain ended.
 */
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
const tot = { byKind:{}, stoppedWet:0, spawnStroll:0, spawnLawn:0, offers:0, refGard:0, refComp:0, refKid:0, refFull:0, refFar:0, took:0,
              stood:0, rainTicks:0, underRain:0, rainLeavers:0, maxUnder:0, sayStroll:0 };
for (const seed of SEEDS){
  const page = await b.newPage({ viewport: { width: 1280, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(SRC).href + `?seed=${seed}&pause&t=2`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(`(() => {
    __reseed();
    const t = { byKind:{}, stoppedWet:0, spawnStroll:0, spawnLawn:0, offers:0, refGard:0, refComp:0, refKid:0, refFull:0, refFar:0,
                took:0, stood:0, rainTicks:0, underRain:0, rainLeavers:0, maxUnder:0 };
    const hasArc = typeof ARCADE_BAYS !== 'undefined';
    // the set-out counter is OUTSIDE the hasArc fork on purpose: it is the denominator
    // the stroll share is quoted against, and a control that cannot report it cannot say
    // whether a new kind GREW the lawn or was taken out of the kinds already there
    const SL = spawnLawnAgent;
    spawnLawnAgent = function(w){ const n = agents.length; const v = SL(w);
      if (agents.length > n){ t.spawnLawn++;
        const k = agents[agents.length-1].kind; t.byKind[k] = (t.byKind[k]||0) + 1;
        if (k === 'stroll') t.spawnStroll++; }
      return v; };
    if (hasArc){
      const AS = arcShelter;
      arcShelter = function(a){
        t.offers++;
        const gard = a.kind === 'gardener', comp = !!a.with, kid = !!a.small;
        const free = (gard||comp||kid) ? [] : arcFree(a);
        const v = AS(a);
        if (v) t.took++;
        else if (gard) t.refGard++;
        else if (comp) t.refComp++;
        else if (kid) t.refKid++;
        else if (!free.length) t.refFull++;
        else t.refFar++;
        return v; };
    }
    while (day < 1) __warp(1);
    const d0 = day;
    const stoodSeen = new Set();
    while (day < d0 + ${DAYS}){
      __warp(0.25);
      if (raining){
        t.rainTicks++;
        // the number the whole vector is FOR, and it reads on both files: people whose
        // visit is the GARDEN, stopped somewhere in it, while it is raining. At HEAD the
        // courtyard's one answer to a shower is the gate, so this is structurally zero.
        for (const a of agents) if (a.lawn && !a.lawnOut && a.state !== 'walk') t.stoppedWet++;
        // people who WERE in the garden and are now walking out because of it
        for (const a of agents) if (a.lawn && a.lawnOut) t.rainLeavers++;
        if (hasArc){
          let n = 0;
          for (const a of agents) if (a.arc && a.state !== 'walk') n++;
          t.underRain += n; if (n > t.maxUnder) t.maxUnder = n;
        }
      }
      if (hasArc) for (const a of agents) if (a.arc && a.state === 'stand' && !stoodSeen.has(a)){ stoodSeen.add(a); t.stood++; }
    }
    return t;
  })()`);
  if (errs.length) console.error('seed ' + seed + ' page error: ' + errs[0]);
  for (const k of Object.keys(r)) if (k === 'byKind'){ for (const j of Object.keys(r.byKind)) tot.byKind[j] = (tot.byKind[j]||0) + r.byKind[j]; }
  else if (k in tot) tot[k] = k === 'maxUnder' ? Math.max(tot[k], r[k]) : tot[k] + r[k];
  await page.close();
}
await b.close();
const f = (n) => String(n).padStart(7);
console.log(`file ${SRC.split('/').pop()}  ${SEEDS.length} seeds x ${DAYS} days`);
console.log(`  lawn set-outs                 ${f(tot.spawnLawn)}`);
console.log(`  …by kind                      ${Object.entries(tot.byKind).sort((p,q)=>q[1]-p[1]).map(([k,v])=>k+' '+v).join('  ')}`);
console.log(`  shelter offered (rain, in)    ${f(tot.offers)}`);
console.log(`    refused: gardener at a bed  ${f(tot.refGard)}`);
console.log(`    refused: a companion        ${f(tot.refComp)}`);
console.log(`    refused: a child on a run   ${f(tot.refKid)}`);
console.log(`    refused: every bay held     ${f(tot.refFull)}`);
console.log(`    refused: too far to run     ${f(tot.refFar)}`);
console.log(`    TOOK the walk               ${f(tot.took)}`);
console.log(`  distinct people STANDING under${f(tot.stood)}`);
console.log(`  rain ticks (0.25 s)           ${f(tot.rainTicks)}`);
console.log(`  people under the walk / tick  ${(tot.underRain/(tot.rainTicks||1)).toFixed(3)}   max ${tot.maxUnder}`);
console.log(`  lawn-leaver ticks in rain     ${f(tot.rainLeavers)}`);
console.log(`  STOPPED in the garden in rain ${(tot.stoppedWet/(tot.rainTicks||1)).toFixed(3)}  per tick  (${tot.stoppedWet} tick-people)`);
