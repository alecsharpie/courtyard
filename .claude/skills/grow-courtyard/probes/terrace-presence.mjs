#!/usr/bin/env node
/* #201 — the premise. Nobody has ever counted how often somebody is actually UP on the
 * leads. Step 6 seeds through a year at a fixed 0.5 s and, at every DAYLIGHT sample
 * (sunUp..sunDown, which is the only span the terrace is looked at), count the tenants
 * alive, the tenants VISIBLE at the shipping framing — nearHidden() is the build's own
 * test and it is asked here on the same feet drawPerson asks it on — and which BAY each
 * one is on. Also reports, per bay, the share of daylight samples it holds somebody.
 *
 * The second half is the FABRIC's own gate: for every LEADS_BAYS bay it prints the depth
 * band each drawn piece occupies, so a piece that would paint over the slates above the
 * terrace (depth < 84.93) or fall out of the terrace's own two rows (> 86.64) is named
 * rather than eyeballed. On HEAD that is the hatch and the cord alone. */
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const PW = homedir() + '/.claude/skills/screenshot-verify/node_modules/playwright/index.js';
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(ROOT, arg('--file', 'courtyard.html'));
const SEEDS = arg('--seeds', '7,42,1234,555,90210,31337').split(',').map(Number);
const DAYS = +arg('--days', 26);
const STEP = +arg('--step', 0.5);
const VW = +arg('--w', 1600), VH = +arg('--h', 950);
const b = await chromium.launch();
const all = [];
for (const seed of SEEDS){
  const page = await b.newPage({ viewport: { width: VW, height: VH } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(SRC).href + `?seed=${seed}&pause&t=2`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(`(() => {
    __reseed();
    while (day < 2) __warp(1);
    const d0 = day;
    const bays = LEADS_BAYS.map(b => ({house:b.house, x0:b.x0, x1:b.x1}));
    let samples = 0, dl = 0, alive = 0, vis = 0, withAny = 0, withVis = 0;
    const perBay = new Map(), acts = {};
    let kits = null;
    if (typeof LEADS_KIT === 'object' && LEADS_BAYS.length && LEADS_BAYS[0].kit)
      kits = LEADS_BAYS.map(b => ({house:b.house, kit:JSON.parse(JSON.stringify(b.kit))}));
    while (day < d0 + ${DAYS}){
      __warp(${STEP});
      samples++;
      if (!(hour > sunUp && hour < sunDown)) continue;
      dl++;
      let n = 0, v = 0;
      for (const a of agents){
        if (!a.tenant) continue;
        n++;
        const [, sy] = project(a.x, a.y, a.z);
        if (!nearHidden(a.y, sy)) v++;
        const h = a.bay ? a.bay.house : -1;
        perBay.set(h, (perBay.get(h) || 0) + 1);
        acts[a.act || a.stops?.[a.i]?.act || 'walk'] = (acts[a.act || 'walk'] || 0) + 1;
      }
      alive += n; vis += v;
      if (n) withAny++;
      if (v) withVis++;
    }
    /* the FABRIC's own bound, solved with the draws' own arithmetic rather than eyeballed:
       depth is y - z*LIFT and every piece's NORTHMOST drawn point is its north face at its
       full height. Anything under LEADS_DN is drawn on the SLATES above the terrace. */
    const pieces = [];
    if (LEADS_BAYS.length && LEADS_BAYS[0].kit){
      const D = (y, z) => +(y - z * LIFT).toFixed(3);
      for (const b of LEADS_BAYS){
        const k = b.kit;
        for (const p of k.pots){
          const zr = roofWalkZ(p.x, p.y) + LEADS_POT.h * (p.r / LEADS_POT.r);
          pieces.push({h:b.house, kind:'pot', n:D(p.y - 0.02, zr + LEADS_POT.lf * 1.04),
                       s:D(p.y + p.r * 0.70, roofWalkZ(p.x, p.y))});
        }
        if (k.crate){ const z = roofWalkZ(k.crate.x, k.crate.y) + k.crate.n * LEADS_CRATE.h;
          pieces.push({h:b.house, kind:'crate', n:D(k.crate.y - LEADS_CRATE.d, z),
                       s:D(k.crate.y + LEADS_CRATE.d, roofWalkZ(k.crate.x, k.crate.y))}); }
        if (k.chair){ const z0 = roofWalkZ(k.chair.x, k.chair.y);
          // the fold's two extremes: back up at tip 0, seat vertical at tip 1
          pieces.push({h:b.house, kind:'chair',
            n:Math.min(D(k.chair.y - LEADS_CHAIR.d, z0 + LEADS_CHAIR.seat + LEADS_CHAIR.back),
                       D(k.chair.y - LEADS_CHAIR.d - LEADS_CHAIR.back * 0.85, z0 + LEADS_CHAIR.seat * 0.70 + LEADS_CHAIR.back * 0.12)),
            s:D(k.chair.y + LEADS_CHAIR.d, z0 + LEADS_CHAIR.d * 2)}); }
        if (k.mat) pieces.push({h:b.house, kind:'mat', n:D(k.mat.y - LEADS_MAT.d, roofWalkZ(k.mat.x, k.mat.y)),
                                s:D(k.mat.y + LEADS_MAT.d, roofWalkZ(k.mat.x, k.mat.y))});
      }
    }
    const kitSum = LEADS_BAYS.length && LEADS_BAYS[0].kit
      ? LEADS_BAYS.map(b => ({house:b.house, wash:b.kit.wash, tidy:+b.kit.tidy.toFixed(2),
          pots:b.kit.pots.map(p => p.sp ? 'bay' : 'ger').join('+') || '-',
          crate:b.kit.crate ? b.kit.crate.n : 0, chair:!!b.kit.chair, mat:!!b.kit.mat})) : null;
    return {bays, samples, dl, alive, vis, withAny, withVis, pieces, kitSum,
            dn: typeof LEADS_DN !== 'undefined' ? LEADS_DN : null,
            perBay:[...perBay], acts, kits, nBays: LEADS_BAYS.length};
  })()`);
  if (errs.length) console.log('SEED', seed, 'ERRORS', errs.slice(0, 3));
  all.push({ seed, ...r });
  await page.close();
}
await b.close();
const S = k => all.reduce((n, s) => n + s[k], 0);
console.log(`\nTENANT PRESENCE — ${SEEDS.length} seeds x ${DAYS} days, ${VW}x${VH}, step ${STEP}s`);
console.log(`bays per seed: ${all.map(s => s.nBays).join(' ')}`);
console.log(`daylight samples ${S('dl')} of ${S('samples')}`);
console.log(`  tenants alive   / daylight sample : ${(S('alive') / S('dl')).toFixed(4)}`);
console.log(`  tenants VISIBLE / daylight sample : ${(S('vis') / S('dl')).toFixed(4)}`);
console.log(`  samples with ANY tenant           : ${(100 * S('withAny') / S('dl')).toFixed(2)}%`);
console.log(`  samples with a VISIBLE tenant     : ${(100 * S('withVis') / S('dl')).toFixed(2)}%`);
for (const s of all){
  const per = new Map(s.perBay);
  const line = s.bays.map(b => `h${b.house}:${(100 * (per.get(b.house) || 0) / s.dl).toFixed(2)}%`).join('  ');
  console.log(`  seed ${String(s.seed).padStart(5)}  ${(100 * s.withAny / s.dl).toFixed(2)}% any | ${line}`);
}
const p0 = all[0];
if (p0.kitSum){
  console.log('\nFABRIC per bay — hash(house), so the same six terraces in every world:');
  for (const k of p0.kitSum)
    console.log(`  house ${String(k.house).padStart(2)}  line ${['never','every day','some days'][k.wash]}`.padEnd(34)
      + `swept ${k.tidy.toFixed(2)}  pots ${k.pots.padEnd(11)} crates ${k.crate}  chair ${k.chair ? 'y' : 'n'}  mat ${k.mat ? 'y' : 'n'}`);
  const bad = p0.pieces.filter(q => q.n < p0.dn);
  const nMin = Math.min(...p0.pieces.map(q => q.n)), sMax = Math.max(...p0.pieces.map(q => q.s));
  console.log(`\n  ${p0.pieces.length} pieces  ·  northmost drawn depth ${nMin.toFixed(2)} (bound ${p0.dn})  ·  deepest ${sMax.toFixed(2)}`);
  console.log(`  pieces drawn on the slates above the terrace: ${bad.length}` +
    (bad.length ? '  ' + bad.map(q => q.kind + '@h' + q.h + ':' + q.n).join(' ') : '   <- the claim'));
}
