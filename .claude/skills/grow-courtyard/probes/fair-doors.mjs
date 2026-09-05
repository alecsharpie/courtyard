#!/usr/bin/env node
/* b217 — is there a NEARER DOOR? The plaza has three (the alley, the quay's north end,
 * the park gate up through the lane's mouth). This prices every fair slot from each of
 * them, on the route a walker would actually take, at the middle of the fair-goer's own
 * pace. The answer is the table: the alley wins at every slot, so the corridor the brief
 * wanted shortened is the SQUARE ITSELF and not the approach to it. */
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = homedir() + '/.claude/skills/screenshot-verify/node_modules/playwright/index.js';
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const SRC = resolve(process.argv[2] || 'courtyard.html');
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1280, height: 700 } });
await page.goto(pathToFileURL(SRC).href + '?seed=7&pause&t=2');
await page.waitForFunction('typeof __warp === "function"');
const r = await page.evaluate(`(() => {
  const sp = FAIR_STEP + FAIR_STEP_R / 2, out = [];
  for (let k = 0; k < FAIR_SLOTS.length; k++){
    const s = FAIR_SLOTS[k], row = { th: FAIR_TH[k], x:+s.x.toFixed(1), y:+s.y.toFixed(1) };
    // A — the alley cut, the door the fair has used since #203
    const gA = alleyGate(s, 0.5);
    row.A = pathHours(gA[0], gA[1], fairLead(s, 0.5).concat([[s.x, s.y]]), sp);
    // Q — off the north end of the quay, down the quay walk and in over the paving
    row.Q = pathHours(EAST_GATE_Q[0], EAST_GATE_Q[1],
      [[112.9, 7]].concat(plazaWay(112.9, 7, s, 0.5)), sp);
    // P — the park gate, west along the lane and up through the plaza's south mouth
    const mx = plazaMouth(s);
    row.P = pathHours(EAST_GATE_P[0], EAST_GATE_P[1],
      [[PARK_GATE, LANE_N_Y], [mx, LANE_N_Y], [mx, 62.2]].concat(plazaWay(mx, 62.2, s, 0.5)), sp);
    // and the part of A that is OUTSIDE the square at all (gate -> the paving's west edge)
    row.out = pathHours(gA[0], gA[1], [[99.8, alleyRow(s, 0.5)]], sp);
    out.push(row);
  }
  return { out, cross: FAIR_CROSS, open: FAIR_OPEN_MIN, cellsPerH: sp / HOURS_PER_S };
})()`);
await b.close();
console.log(`\nfair-goer's pace ${r.cellsPerH.toFixed(2)} cells / sim-hour   FAIR_CROSS ${r.cross.toFixed(2)} h   floor ${r.open}\n`);
console.log(' slot        alley    quay    park   | of the alley walk, OUTSIDE the square');
let wins = { A:0, Q:0, P:0 };
for (const s of r.out){
  const best = s.A <= s.Q && s.A <= s.P ? 'A' : s.Q <= s.P ? 'Q' : 'P';
  wins[best]++;
  console.log(`th ${String(s.th).padStart(3)} (${String(s.x).padStart(5)},${String(s.y).padStart(4)})  ` +
    [s.A, s.Q, s.P].map(v => v.toFixed(2).padStart(6)).join('  ') +
    `   |  ${s.out.toFixed(2)} h (${(100*s.out/s.A).toFixed(0)}%)   nearest: ${best}`);
}
const A = r.out.map(s => s.A).sort((a,b)=>a-b);
console.log(`\nnearest door wins: alley ${wins.A}/10, quay ${wins.Q}, park ${wins.P}`);
console.log(`alley walk  min ${A[0].toFixed(2)}  med ${A[5].toFixed(2)}  max ${A[9].toFixed(2)} h`);
