#!/usr/bin/env node
/* arc-dark (#198) — not lawn-dark.mjs (#168, which charges the agent-hours a visit spends
 * on the frame after lawnGone()). This one is #95's invariant, re-measured now that rain no longer shuts the gate: nobody is
 * still HOLDING a lawn place between 22 h and 5 h, and nobody is stopped under the
 * arcade in the dark. Also the arcade's own tail: the longest a.arc stay, in hours. */
import { homedir } from 'node:os'; import { resolve } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = homedir() + '/.claude/skills/screenshot-verify/node_modules/playwright/index.js';
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(arg('--file', 'courtyard.html'));
const SEEDS = arg('--seeds', '7,42,1234,555,90210,31337').split(',').map(Number);
const DAYS = +arg('--days', 26);
const b = await chromium.launch();
let hold = 0, arcDark = 0, ticks = 0, maxArc = 0, arcTicks = 0, arcN = 0;
for (const seed of SEEDS){
  const page = await b.newPage({ viewport: { width: 1280, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(SRC).href + `?seed=${seed}&pause&t=2`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(`(() => {
    __reseed(); const t = { hold:0, arcDark:0, ticks:0, maxArc:0, arcTicks:0, arcN:0, who:[] };
    const since = new Map();
    while (day < 1) __warp(1);
    const d0 = day;
    while (day < d0 + ${DAYS}){
      __warp(0.25);
      for (const a of agents){ if (a.arc && a.state !== 'walk'){ if (!since.has(a)) since.set(a, simT); t.arcN++; }
        else if (since.has(a)){ t.maxArc = Math.max(t.maxArc, (simT - since.get(a)) * HOURS_PER_S); since.delete(a); } }
      t.arcTicks++;
      if (hour >= 22 || hour < 5){ t.ticks++;
        t.hold += agents.filter(a => lawnHolds(a) && a.state !== 'walk').length;
        for (const a of agents) if (a.arc && a.state !== 'walk'){ t.arcDark++;
          if (t.who.length < 8) t.who.push({day, hour:+hour.toFixed(2), kind:a.kind, state:a.state, timer:+(a.timer||0).toFixed(2),
            gone:!!lawnGone(), raining:!!raining, wet:+wetF().toFixed(2), out:!!a.lawnOut, sun:+daylight.toFixed(3), held:(simT-(since.get(a)||simT))*HOURS_PER_S|0}); } }
    }
    return t;
  })()`);
  if (errs.length) console.error('seed ' + seed + ': ' + errs[0]);
  if (r.who.length) console.log('  seed ' + seed + ' ' + JSON.stringify(r.who));
  hold += r.hold; arcDark += r.arcDark; ticks += r.ticks; maxArc = Math.max(maxArc, r.maxArc); arcTicks += r.arcTicks; arcN += r.arcN;
  await page.close();
}
await b.close();
console.log(`${SRC.split('/').pop()}  ${SEEDS.length} seeds x ${DAYS} days`);
console.log(`  small-hours ticks (22h-5h)          ${ticks}`);
console.log(`  …lawn holders STOPPED in them       ${hold}     (must be 0)`);
console.log(`  …people stopped under the arcade    ${arcDark}     (must be 0)`);
console.log(`  arcade stays: ${arcN} tick-people over ${arcTicks} ticks; longest single stay ${maxArc.toFixed(2)} h`);
