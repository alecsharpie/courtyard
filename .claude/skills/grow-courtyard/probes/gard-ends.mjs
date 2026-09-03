#!/usr/bin/env node
/* probe-gard-ends — b157: is a gardener's visit priced at BOTH ends, or only at the
 * landing? Wraps spawnLawnAgent(), records every gardener that actually set out over a
 * whole GROWING SEASON (phase .25->.75 = days 1..13) x N seeds, and reports which branch
 * of gardenFits() governed it.
 *   node probe-gard-ends.mjs [file] [--seeds 12]
 */
import { writeFileSync } from 'node:fs'; import { homedir } from 'node:os'; import { resolve, join, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const file = process.argv[2] && !process.argv[2].startsWith('--') ? resolve(process.argv[2]) : resolve(HERE, '../../../../courtyard.html');
const SEEDS = [3, 7, 11, 19, 23, 29, 42, 51, 64, 77, 88, 91].slice(0, +arg('--seeds', 12));
const b = await chromium.launch(); const all = [];
for (const seed of SEEDS){
  const p = await b.newPage({ viewport:{width:1200, height:720} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + `?pause&seed=${seed}`);
  await p.waitForFunction(() => window.__warp);
  const rows = JSON.parse(await p.evaluate(new Function(`
    window.__reseed(); window.__setTime(55);
    const log = []; let fired = 0;
    const orig = spawnLawnAgent;
    spawnLawnAgent = function(want){
      const n0 = agents.length, h0 = hour, d0 = day, su = sunUp, ls = lawnStart(), le = lawnEnd(),
            gs = growSeason(), dh = dayHours, sd = sunDown, wm = warmth;
      fired++;
      const r = orig(want);
      for (let i = n0; i < agents.length; i++){
        const a = agents[i];
        if (a.kind !== 'gardener' || !a.lawnLead) continue;
        const walk = LAWN_WALK_MARGIN * a.pred;
        log.push({ seed:0, d:d0, h:+h0.toFixed(3), su:+su.toFixed(3), ls:+ls.toFixed(3),
                   le:+le.toFixed(3), dh:+dh.toFixed(2), walk:+walk.toFixed(3),
                   arr:+(h0 + walk).toFixed(3), dawn:!!a.dawnWalk, sched:!!want, grow:gs,
                   sd:+sd.toFixed(3), wm:+wm.toFixed(3), spd:+a.speed.toFixed(2), door:a.exit.name,
                   bx:+a.kneelAt[0].toFixed(1), by:+a.kneelAt[1].toFixed(1) });
      }
      return r;
    };
    for (let i = 0; i < 60000 && day < 14; i++) window.__warp(0.5);
    if (!fired) throw new Error('spawnLawnAgent wrapper never fired');
    return JSON.stringify(log);`)));
  for (const r of rows) r.seed = seed;
  all.push(...rows);
  await p.close();
}
await b.close();
writeFileSync(arg('--out','probe-gard-ends.json'), JSON.stringify(all));
const q = (a, f) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * f))] : NaN; };
const stat = (a, n) => a.length ? `${n} n=${a.length} med ${q(a,.5).toFixed(2)} p90 ${q(a,.9).toFixed(2)} max ${Math.max(...a).toFixed(2)}` : `${n} n=0`;
const grow = all.filter(r => r.grow);
const pre = grow.filter(r => r.h <= r.su), post = grow.filter(r => r.h > r.su);
console.log(`file: ${file}   seeds ${SEEDS.length} x growing season (days 1..13)`);
console.log(`gardener set-outs: ${all.length} total, ${grow.length} in the growing season`);
console.log(`  PRE-sunrise  (gardenFits' GARD_LAND branch — priced at BOTH ends): ${pre.length}  (${(100*pre.length/grow.length).toFixed(1)}%)`);
console.log(`  POST-sunrise (returns true — landing bound is lawnEnd only):      ${post.length}  (${(100*post.length/grow.length).toFixed(1)}%)`);
console.log(`  scheduled ${grow.filter(r=>r.sched).length} / lottery ${grow.filter(r=>!r.sched).length};  a.dawnWalk set on ${grow.filter(r=>r.dawn).length}`);
for (const [n, s] of [['pre ', pre], ['post', post]]){
  if (!s.length) continue;
  console.log(`  ${n}: ${stat(s.map(r=>r.walk), 'walk h')}`);
  console.log(`        ${stat(s.map(r=>r.arr - r.ls), 'arrival - lawnStart h')}`);
  console.log(`        ${stat(s.map(r=>r.le - 1.5 - r.arr), 'slack to the ONLY upper bound (lawnEnd-1.5-arrival) h')}`);
  console.log(`        set-out hour med ${q(s.map(r=>r.h),.5).toFixed(2)}  arrival med ${q(s.map(r=>r.arr),.5).toFixed(2)}  lawnStart med ${q(s.map(r=>r.ls),.5).toFixed(2)}`);
}
