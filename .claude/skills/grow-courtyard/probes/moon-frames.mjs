/* b203 — what did the new gate change, PIXEL for PIXEL, and where?
 *
 * The gate moved is a DRAW gate, so the census cannot see it and a pair of pictures looked
 * at in turn is not evidence. This warps both builds to the SAME instants in the SAME
 * world and diffs the two canvases per pixel. Three claims to separate:
 *
 *   DAY    nightF = 0, so moonShows() is false in both builds and the frame must be
 *          IDENTICAL — 0 px off. That is the control: it differs from the dusk frame in
 *          exactly one way, the hour.
 *   DUSK   inside the measured hole (the 1.4 h before sunset, moon up, sky dark): HEAD
 *          draws no disc, the build must. The diff is where the moon is.
 *   NIGHT  deep night, the disc drawn in both: the frame must be unchanged there too, or
 *          the change has leaked out of the window it was aimed at.
 *
 * The read is in the SAME evaluate as a dt-PINNED drawScene(simT, 0), because a ?paused
 * page still runs rAF and a pass given a dt advances what it draws.
 *
 * The BASE defaults to the candidate itself, which is the same-code control and the only
 * honest floor: it must read 0 px at every instant, and it does. Point it at a ref cut
 * from a commit (`git show <rev>:courtyard.html > /tmp/ref.html`) to diff two builds.
 * Env: VW/VH the viewport, ONLY=DUSK,NIGHT one instant at a time (nothing earlier is
 * drawn, so a frame cannot inherit another frame's bake), SWEEP=20.5,21.0 its own hours,
 * MOON_START to hold the day and move the phase.
 *
 *   node .../probes/moon-frames.mjs [cand] [base] [seeds...]
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const CAND = process.argv[2] || 'courtyard.html';
const BASE = process.argv[3] || CAND;      // same-code control unless a ref is named
const SEEDS = process.argv.slice(4).map(Number);
const USE = SEEDS.length ? SEEDS : [42, 7];
const VP = { width: +(process.env.VW || 1000), height: +(process.env.VH || 640) };
const PHASE = process.env.MOON_START ? Number(process.env.MOON_START) : null;   // hold the day, move the phase

/* midsummer is seasonPhase 0.5; SEASON_START 0.25 and SEASON_LEN 26 days, so day 6.5 is
 * midsummer. The three instants are hours of that day; DAY_ROLL 6 means hour h on day d
 * is simT = d*DAY_LEN + ((h - 6 + 24) % 24) / 24 * DAY_LEN. */
const WHEN = process.env.SWEEP
  ? process.env.SWEEP.split(',').map(h => ['h' + h, 6, +h])
  : [['DAY', 6, 13.0], ['DUSK', 6, 20.75], ['LATE', 6, 21.5], ['NIGHT', 6, 0.5], ['DAWN', 6, 4.2]];

const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;   // isolate an instant: no earlier frame is drawn
const WHEN2 = ONLY ? WHEN.filter(w => ONLY.includes(w[0])) : WHEN;

const b = await chromium.launch();
async function frames(file, seed){
  const p = await b.newPage({ viewport: VP });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=' + seed + '&pause&t=0');
  await p.waitForFunction('typeof __warp === "function" && typeof drawScene === "function"');
  const out = await p.evaluate(([W, START]) => {
    __reseed();
    if (START !== null) MOON_START = START;   // `let` since #196: hold the DAY and move the PHASE
    const enc = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 8192)
      s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); };
    const res = [];
    for (const [name, d, h] of W){
      const target = (d + ((h - 6 + 24) % 24) / 24) * DAY_LEN;   // DAY_ROLL 6: hour h on day d
      const step = DAY_LEN / 480;
      let guard = 0;
      while (simT < target - step / 2 && guard++ < 40000) __warp(Math.min(step, target - simT));
      drawScene(simT, 0);                            // dt PINNED
      const c = document.getElementById('cv'), g = c.getContext('2d');
      const px = g.getImageData(0, 0, c.width, c.height);
      const md = (typeof moonDisc === 'function') ? moonDisc() : null;
      res.push({ name, w: c.width, h: c.height, hour: +hour.toFixed(2), nf: +nightF.toFixed(3),
                 dl: +daylight.toFixed(3), alt: +moonAlt().toFixed(3), lit: +moonLit().toFixed(3),
                 ml: +moonLight().toFixed(4), cc: +cloudCover().toFixed(3),
                 disc: md ? md.map(v => Math.round(v)) : null,
                 sun: (typeof sunDisc === 'function' && sunDisc()) ? 1 : 0,
                 b64: enc(new Uint8Array(px.data.buffer)) });
    }
    return res;
  }, [WHEN2, PHASE]);
  if (errs.length) console.log('  PAGE ERRORS ' + file + ' seed ' + seed + ':', errs.slice(0, 3));
  await p.close();
  return out;
}

const L = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
for (const seed of USE){
  const C = await frames(CAND, seed), B = await frames(BASE, seed);
  console.log('\n=== seed ' + seed + '  (' + C[0].w + 'x' + C[0].h + ' = ' + (C[0].w * C[0].h) + ' px)');
  for (let k = 0; k < C.length; k++){
    const c = Buffer.from(C[k].b64, 'base64'), h = Buffer.from(B[k].b64, 'base64');
    const W = C[k].w;
    let any = 0, big = 0, sum = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
    for (let i = 0, p = 0; i < c.length; i += 4, p++){
      if (c[i] === h[i] && c[i + 1] === h[i + 1] && c[i + 2] === h[i + 2]) continue;
      any++;
      const dl = Math.abs(L(c, i) - L(h, i));
      sum += dl;
      if (dl > 4){ big++;
        const x = p % W, y = (p / W) | 0;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    const r = C[k], q = B[k];
    // ...and the DISC's own pixels, so an occluded moon cannot pass as a drawn one
    let dn = 0, dmx = 0, dsum = 0, dtot = 0;
    if (r.disc){
      const [mx, my, mr] = r.disc;
      for (let y = Math.max(0, my - mr); y <= Math.min(C[k].h - 1, my + mr); y++)
        for (let x = Math.max(0, mx - mr); x <= Math.min(W - 1, mx + mr); x++){
          if ((x - mx) ** 2 + (y - my) ** 2 > mr * mr) continue;
          const i = (y * W + x) * 4; dtot++;
          const dl = Math.abs(L(c, i) - L(h, i));
          dsum += dl; if (dl > 4) dn++; if (dl > dmx) dmx = dl;
        }
    }
    console.log('  ' + r.name.padEnd(6) + 'h ' + r.hour.toFixed(2) + '  nightF ' + r.nf.toFixed(3) +
                '  daylight ' + r.dl.toFixed(3) + '  moonAlt ' + r.alt.toFixed(3) + ' lit ' + r.lit.toFixed(2) +
                '  cloud ' + r.cc.toFixed(2));
    console.log('        disc  build ' + (r.disc ? '[' + r.disc + ']' : 'NONE') +
                '   HEAD ' + (q.disc ? '[' + q.disc + ']' : 'NONE') +
                '   sun drawn ' + r.sun + '   moonLight ' + r.ml.toFixed(4) + ' v ' + q.ml.toFixed(4));
    console.log('        px off HEAD ' + any + ' of ' + (c.length / 4) +
                (any ? '  (|dLuma|>4: ' + big + ', mean |dLuma| over changed ' + (sum / any).toFixed(2) +
                       (big ? ', bbox x ' + x0 + '-' + x1 + ' y ' + y0 + '-' + y1 : '') + ')' : ''));
    if (r.disc) console.log('        ON THE DISC: ' + dtot + ' px, |dLuma| mean ' + (dsum / dtot).toFixed(1) +
                            ' max ' + dmx.toFixed(1) + ', over 4: ' + dn);
  }
}
await b.close();
