#!/usr/bin/env node
/* #134 supplement — how many pools the cull actually drops (a saving is only evidence if
 * the test fires), and the same byte-identity proof at the SHIPPING mobile framing. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url'; import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const H='/tmp/head134cull2.html';
writeFileSync(H, execSync('git show HEAD:courtyard.html',{maxBuffer:1<<28}).toString());
const b = await chromium.launch();
async function run(file, vp, q, warp){
  const p = await b.newPage({ viewport: vp });
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=7&pause');
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(([q, warp]) => {
    __reseed(); __warp(warp);
    raining = false; wetness = 0.75; wetPainted = 0.75;
    whereN = q; viewSnap(); groundDirty = true;
    drawScene(simT, 1/30);
    // count what the cull sees, using the SAME expression the draw path uses
    let wet = 0, culled = 0, edge = 0;
    for (const pp of PUDDLES){
      const d = pudDepth(pp); if (d <= 0.03) continue; wet++;
      const [sx, sy] = project(pp.cx, pp.cy, 0);
      const rx = pp.rx * cellW * (0.72 + 0.28*d), ry = pp.ry * cellH * (0.72 + 0.28*d);
      const inBox = sx + rx >= 0 && sx - rx <= W && sy + ry >= 0 && sy - ry <= H;
      const inPt  = sx >= 0 && sx <= W && sy >= 0 && sy <= H;   // the naive centre test
      if (!inBox) culled++; else if (!inPt) edge++;             // edge = kept ONLY by the margin
    }
    wetness = 0.75; wetPainted = 0.75; drawScene(simT, 1/30);
    const url = cv.toDataURL();
    let h = 2166136261 >>> 0;
    for (let i = 0; i < url.length; i++){ h ^= url.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    const fp = [simT.toFixed(4), hour.toFixed(4), wetness.toFixed(4), windF().toFixed(4),
                nightF.toFixed(4), agents.length, viewS.toFixed(4), originX.toFixed(3)].join('|');
    return { wet, culled, edge, W, H, hash:h.toString(16).padStart(8,'0'), fp, len:url.length };
  }, [q, warp]);
  await p.close(); if (errs.length) console.log('  PAGE ERROR', errs[0]);
  return r;
}
const NAMES=['Wide','Courtyard','Street','Plaza','Far bank'];
console.log('--- what the cull drops, and what only the MARGIN keeps (wet 0.75, seed 7) ---');
for (const [lbl,vp] of [['1600x950',{width:1600,height:950}],['1280x700',{width:1280,height:700}],['390x844',{width:390,height:844}]]){
  for (let q=0;q<5;q++){
    const t = await run('courtyard.html', vp, q, 337);
    console.log(`${lbl.padEnd(9)} ${NAMES[q].padEnd(10)} wet ${String(t.wet).padStart(3)}  culled ${String(t.culled).padStart(3)}` +
                ` (${(100*t.culled/t.wet).toFixed(0)}%)  kept ONLY by the rx/ry margin: ${t.edge}`);
  }
}
console.log('\n--- byte identity, three viewports x three instants x Wide+Courtyard ---');
let bad=0, fpBad=0, n=0;
for (const [lbl,vp] of [['1600x950',{width:1600,height:950}],['1280x700',{width:1280,height:700}],['390x844',{width:390,height:844}]])
for (const warp of [337, 344, 351]) for (const q of [0,1]){
  const h = await run(H, vp, q, warp), t = await run('courtyard.html', vp, q, warp);
  const same = h.hash===t.hash && h.len===t.len, fpSame = h.fp===t.fp;
  if(!same) bad++; if(!fpSame) fpBad++; n++;
  console.log(`${lbl.padEnd(9)} warp ${warp} ${NAMES[q].padEnd(10)} ${h.hash} / ${t.hash} ${same?'IDENTICAL':'*** DIFFERS ***'} fp ${fpSame?'NONE':'*** DRIFT ***'}`);
}
console.log(`\n${bad} of ${n} differ · ${fpBad} fingerprint drifts`);
await b.close(); unlinkSync(H);
