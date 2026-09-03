#!/usr/bin/env node
/* probe-lawn-dark — b168: does the lawn empty by its own hour, or is it still walking
 * home in the dark? Samples every lawn agent every 0.25 s of sim time over a full YEAR
 * (26 days) x N seeds, and charges each visit the agent-hours it spends on the frame
 * after lawnGone(). Also records, AT THE CHOICE, what lawnFits() would have refused if
 * it priced the walk home.
 *   node lawn-dark.mjs [file] [--seeds 6] [--days 27] [--rate <LAWN_RATE override>]
 */
import { writeFileSync } from 'node:fs'; import { homedir } from 'node:os'; import { resolve, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PW = resolve(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const file = process.argv[2] && !process.argv[2].startsWith('--') ? resolve(process.argv[2]) : resolve(HERE, '../../../../courtyard.html');
const SEEDS = [3, 7, 11, 19, 23, 29, 42, 51].slice(0, +arg('--seeds', 6));
const DAYS = +arg('--days', 27);
const b = await chromium.launch(); const visits = []; const totals = [];
for (const seed of SEEDS){
  const p = await b.newPage({ viewport:{width:1200, height:720} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + `?pause&seed=${seed}`);
  await p.waitForFunction(() => window.__warp);
  const out = JSON.parse(await p.evaluate(new Function('A', `const { DAYS, RATE } = A;
    window.__reseed(); window.__setTime(55);
    if (RATE){ const k = RATE; lawnRate = function(){ return k * (0.45 + 0.55 * clamp((warmth - 0.2) / 0.5, 0, 1)); };
      if (Math.abs(lawnRate() / (0.45 + 0.55 * clamp((warmth - 0.2) / 0.5, 0, 1)) - k) > 1e-9) throw new Error('rate patch did not take'); }
    const STEP = 0.25, HPS = HOURS_PER_S, rows = []; const byPid = new Map();
    let pid = 0, fired = 0;
    const orig = spawnLawnAgent;
    spawnLawnAgent = function(want){
      const n0 = agents.length, h0 = hour, d0 = day, le = lawnEnd(), ls = lawnStart();
      fired++;
      const r = orig(want);
      for (let i = n0; i < agents.length; i++){
        const a = agents[i];
        if (!a.lawn || a.__pid) continue;
        a.__pid = ++pid;
        // the walk home this visit will actually take, priced at the place it is going to
        const dest = a.wp[a.wp.length - 1];
        const home = LAWN_WALK_MARGIN * pathHours(dest[0], dest[1], [nearDoor(dest[0], dest[1]).door], a.speed);
        const walk = LAWN_WALK_MARGIN * (a.pred || 0);
        const rec = { pid:a.__pid, kind:a.kind, lead:!!a.lawnLead, d:d0, h:+h0.toFixed(3),
                      le:+le.toFixed(3), ls:+ls.toFixed(3), walk:+walk.toFixed(3),
                      home:+home.toFixed(3), arr:+(h0 + walk).toFixed(3),
                      over:+(h0 + walk + LAWN_MIN_DWELL + home - le).toFixed(3), dark:0, darkIn:0, seen:0 };
        byPid.set(a.__pid, rec); rows.push(rec);
      }
      return r;
    };
    let darkSamples = 0, openSamples = 0, darkPop = 0, darkIn = 0, openPop = 0, grassOpen = 0, wallOpen = 0;
    for (let i = 0; i < 400000 && day < DAYS; i++){
      window.__warp(STEP);
      const gone = lawnGone();
      let n = 0, nin = 0;
      for (const a of agents){
        if (!a.lawn) continue;
        n++;
        const inside = Math.hypot(a.x - CX, a.y - CY) < 29;   // inside the wall (the doors sit at r ~28.5)
        if (inside) nin++;
        const rec = byPid.get(a.__pid);
        if (rec){ rec.seen++; if (gone){ rec.dark++; if (inside) rec.darkIn++; } }
      }
      if (gone){ darkSamples++; darkPop += n; darkIn += nin; }
      else { openSamples++; openPop += n;
             grassOpen += agents.filter(a => a.lawn && !a.lawnOut && a.state !== 'walk').length;
             wallOpen  += agents.filter(a => !a.street && !a.home).length; }
    }
    if (!fired) throw new Error('spawnLawnAgent wrapper never fired');
    return JSON.stringify({ rows, darkSamples, openSamples, darkPop, darkIn, openPop, grassOpen, wallOpen, STEP, HPS });`), { DAYS, RATE: +arg('--rate', 0) }));
  for (const r of out.rows) r.seed = seed;
  visits.push(...out.rows); totals.push({ seed, ...out });
  await p.close();
}
await b.close();
writeFileSync(arg('--out','probe-lawn-dark.json'), JSON.stringify({ visits, totals }));
const H = totals[0].STEP * totals[0].HPS;                       // sim hours per sample
const q = (a, f) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * f))] : NaN; };
const sum = a => a.reduce((s, x) => s + x, 0);
const nSeed = SEEDS.length;
const darkH = visits.map(r => r.dark * H), lateV = visits.filter(r => r.dark > 0);
console.log(`file: ${file}   ${nSeed} seeds x ${DAYS - 1} days (a year is 26)` + (+arg('--rate',0) ? `   LAWN_RATE -> ${arg('--rate',0)}` : ''));
console.log(`lawn agents spawned: ${visits.length}  (${(visits.length/nSeed).toFixed(1)}/seed-year)`);
console.log(`\n-- AFTER THE LIGHT HAS GONE (lawnGone()) --`);
console.log(`  visits with ANY dark time: ${lateV.length} / ${visits.length} = ${(100*lateV.length/visits.length).toFixed(1)}%   (${(lateV.length/nSeed).toFixed(1)}/seed-year)`);
console.log(`  agent-HOURS in the dark:   ${sum(darkH).toFixed(1)}  (${(sum(darkH)/nSeed).toFixed(2)}/seed-year)`);
console.log(`  per late visit, hours:     med ${q(lateV.map(r=>r.dark*H),.5).toFixed(2)}  p90 ${q(lateV.map(r=>r.dark*H),.9).toFixed(2)}  max ${Math.max(0,...darkH).toFixed(2)}`);
console.log(`  mean lawn people on frame while dark: ${(sum(totals.map(t=>t.darkPop))/sum(totals.map(t=>t.darkSamples))).toFixed(3)}`);
console.log(`  ...of them INSIDE THE WALL:           ${(sum(totals.map(t=>t.darkIn))/sum(totals.map(t=>t.darkSamples))).toFixed(3)}`);
console.log(`  agent-hours in the dark INSIDE the wall: ${sum(visits.map(r=>r.darkIn*H)).toFixed(1)}  (${(sum(visits.map(r=>r.darkIn*H))/nSeed).toFixed(2)}/seed-year)`);
for (const k of ['sitter','picnic','napper','kid','gardener']){
  const s = visits.filter(r => r.kind === k); if (!s.length) continue;
  const d = s.filter(r => r.dark > 0);
  console.log(`    ${k.padEnd(9)} n=${String(s.length).padStart(4)}  late ${String(d.length).padStart(4)} (${(100*d.length/s.length).toFixed(1)}%)  dark h med ${d.length?q(d.map(r=>r.dark*H),.5).toFixed(2):'-'}  max ${Math.max(0,...s.map(r=>r.dark*H)).toFixed(2)}`);
}
console.log(`\n-- AT THE CHOICE: arrival + LAWN_MIN_DWELL + walk home, against lawnEnd --`);
const over = visits.filter(r => r.over > 0);
console.log(`  set-outs that do NOT fit the return leg: ${over.length} / ${visits.length} = ${(100*over.length/visits.length).toFixed(1)}%`);
console.log(`  overrun h: med ${q(visits.map(r=>r.over),.5).toFixed(2)}  p90 ${q(visits.map(r=>r.over),.9).toFixed(2)}  max ${Math.max(...visits.map(r=>r.over)).toFixed(2)}`);
console.log(`  walk home h: med ${q(visits.map(r=>r.home),.5).toFixed(2)}  p90 ${q(visits.map(r=>r.home),.9).toFixed(2)}  max ${Math.max(...visits.map(r=>r.home)).toFixed(2)}`);
console.log(`\n-- PRESENCE (the thing not to trade away) --`);
console.log(`  mean lawn people on frame, window OPEN: ${(sum(totals.map(t=>t.openPop))/sum(totals.map(t=>t.openSamples))).toFixed(3)}`);
console.log(`  mean STOPPED on the grass, window open: ${(sum(totals.map(t=>t.grassOpen))/sum(totals.map(t=>t.openSamples))).toFixed(3)}`);
console.log(`  mean people inside the wall, open:      ${(sum(totals.map(t=>t.wallOpen))/sum(totals.map(t=>t.openSamples))).toFixed(3)}`);
