#!/usr/bin/env node
/* sky-name.mjs — does the sky answer the pointer? (#188)
 *
 *   node .claude/skills/grow-courtyard/probes/sky-name.mjs <page> [seed]
 *
 * Two questions the census is blind to and a screenshot cannot ask:
 *   COVERAGE  sweep a grid of pixels over the whole band above the horizon at four hours
 *             of the day and count how many come back with nothing. HEAD's answer is
 *             "all of them except the roosting flock's box".
 *   TRUTH     the sun's own disc, the moon's, the two towers and the balloon, asked at
 *             the pixel the DRAW put them at — and the same sky asked under four
 *             different weathers, to show the words move with it rather than being one
 *             constant string.
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(resolve(process.argv[2] || 'courtyard.html')).href;
const seed = +(process.argv[3] || 42);
const b = await chromium.launch();
const p = await b.newPage();
await p.setViewportSize({ width: 1200, height: 700 });
const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto(`${PAGE}?seed=${seed}&t=0&pause`);
await p.waitForTimeout(300);

const out = await p.evaluate(() => {
  const R = [];
  const hz = () => (typeof skyHz === 'function' ? skyHz() : topPad - 3.4 * cellH);
  const sweep = () => {                       // every pixel of the band above the horizon
    let n = 0, blank = 0; const seen = {};
    for (let x = 8; x < W; x += 16) for (let y = 4; y < hz(); y += 8){
      const s = lookAt([x, y]); n++;
      if (!s) blank++; else seen[s.split(',')[0]] = (seen[s.split(',')[0]] || 0) + 1;
    }
    return { n, blank, seen };
  };
  const at = h => { __reseed(); __setTime(0); __warp(h, 1 / 30); };
  for (const [label, warp] of [['morning', 6.9], ['noon', 15.5], ['evening', 29.8], ['night', 43.5]]){
    at(warp);
    const s = sweep();
    R.push({ label, hour: +hour.toFixed(2), sunArc: +sunArc.toFixed(2), night: +nightF.toFixed(2),
             cloud: +cloudCover().toFixed(2), n: s.n, blank: s.blank, seen: s.seen });
  }
  // the bodies, asked at the pixel the draw put them at
  const bodies = [];
  at(15.5);
  { const d = typeof sunDisc === 'function' ? sunDisc() : null; bodies.push(['sun@noon', d ? lookAt([d[0], d[1]]) : 'n/a']); }
  at(43.5);
  { const d = typeof moonDisc === 'function' ? moonDisc() : null;
    bodies.push(['moon@night', d ? lookAt([d[0], d[1]]) : 'n/a',
                 typeof moonPhase === 'function' ? 'phase ' + moonPhase().toFixed(2) + ' lit ' + moonLit().toFixed(2) : '']); }
  at(15.5);
  for (const t of SH_TOWERS){
    const a = project(t.ax, t.ay, t.top + t.rise * 0.5);
    bodies.push(['tower x' + t.x0, lookAt([a[0], a[1]])]);
  }
  // ...and the balloon, forced up where one would be
  __reseed(); __setTime(0); __warp(6.9, 1 / 30);
  let bres = 'never spawned';
  for (let k = 0; k < 4000 && !balloon; k++) __warp(0.25, 1 / 30);
  if (balloon){
    const air = typeof balloonAir === 'function' ? balloonAir() : [34 + Math.sin(balloon.ph) * 1.4, 1];
    const s = project(balloon.x, balloon.y, air[0]);
    bres = lookAt([s[0], s[1]]) || '(nothing)';
  }
  bodies.push(['balloon', bres]);
  // the sky's own words, under four skies, at the same pixel
  const skies = [];
  for (const [lab, warp] of [['clear day', 15.5], ['night', 43.5], ['thick', 15.5], ['rain', 15.5]]){
    at(warp);
    if (lab === 'thick'){ cloud = 0.8; }
    if (lab === 'rain'){ cloud = 0.95; raining = true; rainLeft = 5; }
    skies.push([lab + ' c' + cloudCover().toFixed(2), lookAt([W * 0.35, hz() * 0.45]) || '(nothing)']);
    raining = false;
  }
  // a month of moons
  const moons = [];
  if (typeof moonPhase === 'function') for (let d = 0; d < 30; d += 3){
    __reseed(); __setTime(0); __warp(43.5 + d * 55, 1 / 30);
    moons.push(`d${String(d).padStart(2)} ${moonPhase().toFixed(2)} lit ${moonLit().toFixed(2)}  ${typeof moonName === 'function' ? moonName() : ''}`);
  }
  return { R, bodies, skies, moons, hz: hz(), topPad, W, H };
});
if (errs.length) console.log('PAGE ERRORS:', errs.slice(0, 3));
console.log(`\ncanvas ${out.W}x${out.H}  horizon y=${out.hz.toFixed(1)}  topPad ${out.topPad.toFixed(1)}\n`);
console.log('COVERAGE of the band above the horizon');
for (const r of out.R){
  console.log(` ${r.label.padEnd(8)} hour ${String(r.hour).padStart(5)} sunArc ${r.sunArc} night ${r.night} cloud ${r.cloud}` +
              `  ->  ${r.n - r.blank}/${r.n} answered  (${(100 * (r.n - r.blank) / r.n).toFixed(0)}%)`);
  for (const k of Object.keys(r.seen)) console.log(`      ${String(r.seen[k]).padStart(4)}  ${k}`);
}
console.log('\nBODIES');
for (const b of out.bodies) console.log('  ' + b[0].padEnd(12) + ' -> ' + b.slice(1).join('   '));
console.log('\nTHE SKY UNDER FOUR SKIES');
for (const s of out.skies) console.log('  ' + s[0].padEnd(16) + ' -> ' + s[1]);
console.log('\nA MONTH OF MOONS');
for (const m of out.moons) console.log('  ' + m);
await b.close();
