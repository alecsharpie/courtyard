#!/usr/bin/env node
/* Do the cast shadows read the lid?  The census is blind to a draw-only vector and a
 * screenshot is an opinion, so this walks ONE pinned instant up a cover ladder and
 * diffs the frame against the same instant in an older build.
 *
 * The measurement is a DIFFERENCE IMAGE against the ref, not a statistic of the
 * frame.  Cover already recolours the whole sky and ground on HEAD, so any absolute
 * metric moves for reasons that are not mine; every pixel that differs from the ref
 * at the same cover, by construction, is my change and nothing else.  Reported per
 * level as: how much of the frame moved, and which way it moved (a shadow being
 * lifted is a POSITIVE luminance change).
 *
 * Two canvases, because they answer different questions and only one is stable:
 *   ground (gcv)  the CACHED layer, redrawn from world state alone — deterministic,
 *                 so equality here is byte-identity.  Holds drawShadows(), the tile
 *                 shadow off every wall and eave in town.
 *   main (cv)     the live frame.  Holds the tree, bandstand, shed, person, balloon
 *                 and bridge shadows, but also water streaks and sway on a real-time
 *                 clock, so it has a noise floor — which is why the run below
 *                 measures that floor (ref against ITSELF, two loads) and prints it.
 *
 * Neutrality is asserted at the instant rather than inferred from the pixels: the
 * three multipliers are read out of the page and must be EXACTLY 1 below SH_KNEE.
 *
 * `cloud`/`cloudTgt`/`groundDirty` are script-scope `let`s, so a probe can pin them
 * by name from evaluate — no debug hook, which is what lets this run unmodified
 * against an old build.  Pin the TARGET too or stepClouds slews straight back off it.
 *
 *   node shadow-cover.mjs [ref]        default ref HEAD; a git rev or a path
 */
import { homedir, tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const HERE = join(REPO, 'courtyard.html');
const REF = process.argv[2] || 'HEAD';
let refFile = resolve(REF);
if (!existsSync(refFile)){
  refFile = join(tmpdir(), `courtyard-${REF.replace(/\W/g, '_')}.html`);
  writeFileSync(refFile, execFileSync('git', ['show', `${REF}:courtyard.html`], { cwd: REPO }));
}

const SEED = 42, T0 = 175;                       // day 4 mid-morning: shoot.mjs's own instant
const LADDER = [0.10, 0.25, 0.32, 0.45, 0.60, 0.75, 0.88, 0.95, 1.00];
const STRIDE = 4;

async function run(file){
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  p.on('pageerror', e => console.log('PAGE ERROR', file, e.message));
  await p.goto(pathToFileURL(file).href + `?seed=${SEED}&t=0&pause`);
  await p.waitForFunction(() => window.__warp);
  await p.evaluate(t => { window.__reseed(); window.__warp(t); }, T0);
  const out = [];
  for (const c of LADDER){
    await p.evaluate(v => { cloud = cloudTgt = v; groundDirty = true; }, c);
    await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    out.push(await p.evaluate(s => {
      const grab = (cnv, c2) => {                              // luma, every s-th pixel
        const d = c2.getImageData(0, 0, cnv.width, cnv.height).data, g = [];
        for (let y = 0; y < cnv.height; y += s) for (let x = 0; x < cnv.width; x += s){
          const i = (y * cnv.width + x) * 4;
          g.push(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
        }
        return g;
      };
      return { ground: grab(gcv, gtx), main: grab(cv, ctx),
               f: typeof shadowF === 'function' ? [+shadowF().toFixed(6), +shSpread().toFixed(6), +shOffset().toFixed(6)] : null };
    }, STRIDE));
  }
  await b.close();
  return out;
}

const cmp = (a, b) => {                          // b relative to a
  let moved = 0, sum = 0, max = 0;
  for (let i = 0; i < a.length; i++){
    const d = b[i] - a[i];
    if (Math.abs(d) > 0.5){ moved++; sum += d; if (Math.abs(d) > Math.abs(max)) max = d; }
  }
  return { pct: moved / a.length * 100, mean: moved ? sum / moved : 0, max };
};

const ref = await run(refFile), noise = await run(refFile), here = await run(HERE);

console.log(`\nseed ${SEED} · t=${T0}s (day 4, mid-morning) · ref ${REF} · every ${STRIDE}th pixel`);
console.log('"moved" = share of sampled pixels differing from the ref by >0.5 luma; +Δ = lifted.\n');
console.log('cover   shadowF  spread  offset |    GROUND (cached, tile shadows)   |    MAIN (trees, people, shed…)     | main noise');
console.log('                                | moved%    meanΔ    maxΔ  identical | moved%    meanΔ    maxΔ           |     moved%');
for (let i = 0; i < LADDER.length; i++){
  const g = cmp(ref[i].ground, here[i].ground), m = cmp(ref[i].main, here[i].main), nz = cmp(ref[i].main, noise[i].main);
  const f = here[i].f || [NaN, NaN, NaN];
  console.log(
    `${LADDER[i].toFixed(2).padStart(5)}  ${f[0].toFixed(3).padStart(7)} ${f[1].toFixed(3).padStart(7)} ${f[2].toFixed(3).padStart(7)} |` +
    `${g.pct.toFixed(2).padStart(7)} ${(g.mean >= 0 ? '+' : '') + g.mean.toFixed(2)}`.padStart(9) +
    `${(g.max >= 0 ? '+' : '') + g.max.toFixed(1)}`.padStart(8) +
    `${g.pct === 0 ? '       YES' : '        no'} |` +
    `${m.pct.toFixed(2).padStart(7)} ${(m.mean >= 0 ? '+' : '') + m.mean.toFixed(2)}`.padStart(9) +
    `${(m.max >= 0 ? '+' : '') + m.max.toFixed(1)}`.padStart(8) + '           |' +
    `${nz.pct.toFixed(2).padStart(11)}`);
}
const neutral = LADDER.filter((c, i) => here[i].f && here[i].f.every(v => v === 1));
const identical = LADDER.filter((c, i) => cmp(ref[i].ground, here[i].ground).pct === 0);
console.log(`\nmultipliers exactly 1 at cover: ${neutral.map(c => c.toFixed(2)).join(', ') || 'NOWHERE'}`);
console.log(`ground layer identical to ${REF} at cover: ${identical.map(c => c.toFixed(2)).join(', ') || 'NOWHERE'}`);
