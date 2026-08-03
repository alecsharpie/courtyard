/* east-arrivals — is the far side actually populated at midday, and is the lane starved?
 *
 *   node .claude/skills/grow-courtyard/probes/east-arrivals.mjs [path-to-courtyard.html]
 *
 * The census reports `people` as one number, so it cannot answer the brief's actual
 * question: are the quay AND the church green occupied at the same time, at midday,
 * without taking bodies off the lane? This walks a few seeded days at 0.25 s of sim
 * time and buckets every walker by where it is standing, two sim-hours per row.
 *
 * zones: plaza 99..112 · quay 112..114 · towpath 127..130 · green 130..138
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const file = resolve(process.argv[2] || 'courtyard.html');
const SEEDS = [3, 7, 11, 19];
const b = await chromium.launch();
const acc = {};
let stuck = [], noArrive = 0, born = 0, maxLife = 0;

for (const seed of SEEDS){
  const p = await b.newPage();
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + `?pause&seed=${seed}`);
  await p.waitForFunction(() => window.__warp);
  const out = await p.evaluate(() => {
    window.__reseed();                       // a paused frame still burns PRNG draws
    const zone = a => a.x >= 99 && a.x < 112 ? 'plaza'
                    : a.x >= 112 && a.x < 114 ? 'quay'
                    : a.x >= 127 && a.x < 130 ? 'tow'
                    : a.x >= 130 ? 'green' : null;
    const bands = {};                        // hour band -> {samples, plaza, quay, tow, green, lane, both}
    const life = new WeakMap();
    let born = 0, noArrive = 0, maxLife = 0; const stuck = [];
    for (let i = 0; i < 24000; i++){         // 24000 * 0.05 = 1200 s ≈ 21 days
      window.__warp(0.05);
      for (const a of agents) if (a.east && !life.has(a)){ life.set(a, simT); born++; }
      if (i % 5) continue;                   // sample every 0.25 s
      const b0 = Math.floor(hour / 2) * 2;
      const band = String(b0).padStart(2, '0') + 'h';
      const r = bands[band] || (bands[band] = {samples:0, plaza:0, quay:0, tow:0, green:0, lane:0, east:0, both:0});
      r.samples++;
      let q = 0, g = 0;
      for (const a of agents){
        if (!a.street) continue;
        const z = zone(a);
        if (z){ r[z]++; if (z === 'quay') q++; if (z === 'green') g++; }
        if (a.east) r.east++; else if (a.x < 99) r.lane++;
        if (a.east){
          const t = simT - life.get(a);
          if (t > maxLife) maxLife = t;
          if (t > 160) stuck.push(a.kind + ' alive=' + t.toFixed(0) + ' i=' + a.i + '/' + a.wp.length);
        }
      }
      if (q && g) r.both++;
    }
    for (const a of agents) if (a.east && !a.stopped) noArrive++;
    return {bands, born, noArrive, maxLife:+maxLife.toFixed(1), stuck:stuck.slice(0, 3)};
  });
  for (const [band, r] of Object.entries(out.bands)){
    const t = acc[band] || (acc[band] = {samples:0, plaza:0, quay:0, tow:0, green:0, lane:0, east:0, both:0});
    for (const k of Object.keys(t)) t[k] += r[k];
  }
  born += out.born; noArrive += out.noArrive;
  maxLife = Math.max(maxLife, out.maxLife); stuck = stuck.concat(out.stuck);
  await p.close();
}
await b.close();

console.log(`file: ${file}   seeds: ${SEEDS.join(',')}`);
console.log('mean simultaneous walkers, by where they are standing:');
console.log('  band     plaza   quay    tow   green |  east   lane | quay+green together');
for (const [band, r] of Object.entries(acc).sort((a, b) => a[0] < b[0] ? -1 : 1)){
  const m = k => (r[k] / r.samples).toFixed(2).padStart(6);
  console.log(`  ${band.padEnd(7)}${m('plaza')}${m('quay')}${m('tow')}${m('green')} |${m('east')}${m('lane')} | ` +
              `${(100 * r.both / r.samples).toFixed(0)}% of samples`);
}
console.log(`east agents born: ${born}   never reached their stop (still en route at the end): ${noArrive}`);
console.log(`longest east lifetime: ${maxLife}s   stuck (>160s): ${stuck.length ? stuck : 'none'}`);
