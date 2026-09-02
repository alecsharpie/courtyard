#!/usr/bin/env node
/* #134 — the puddle frame cull. Two questions, one session:
 *   COST   drawPuddles alone, wet, at every camera, HEAD vs tree, interleaved.
 *   PROOF  the canvas byte-identical at pinned instants at every camera.
 * The canvas is read inside the SAME evaluate as the draw (a ?pause'd page still runs
 * rAF), and a SIM FINGERPRINT rides along: if it differs the hash comparison is void.
 *   node probe-pool-cull.mjs [--wet 0.75] [--reps 3] [--n 400]
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url'; import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg=(k,d)=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1];};
const WET=+arg('--wet',0.75), REPS=+arg('--reps',3), N=+arg('--n',400);
const VP={width:1600,height:950};
const H='/tmp/head134cull.html';
writeFileSync(H, execSync('git show HEAD:courtyard.html',{maxBuffer:1<<28}).toString());
const b = await chromium.launch();

async function run(file, q, night, n){
  const p = await b.newPage({ viewport: VP });
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=7&pause');
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(([wet, n, night, q]) => {
    __reseed(); __warp(330); while (hour < (night ? 21 : 15)) __warp(0.25);
    raining = false; wetness = wet; wetPainted = wet;
    whereN = q; viewSnap(); groundDirty = true;          // land the camera, no ease
    drawScene(simT, 1/30);                               // warm the ground cache at this view
    let drawn = 0, seen = 0;
    for (const pp of PUDDLES){ const d = pudDepth(pp); if (d > 0.03) drawn++; }
    let scene = 0, pud = 0;
    for (let i = 0; i < n; i++){
      wetness = wet; wetPainted = wet;
      const a = performance.now(); drawScene(simT, 1/30); const b2 = performance.now();
      drawPuddles(); const c = performance.now();
      scene += b2 - a; pud += c - b2;
    }
    // the picture, read in this same evaluate — a screenshot taken after would race rAF
    wetness = wet; wetPainted = wet; drawScene(simT, 1/30);
    const url = cv.toDataURL();
    let h = 2166136261 >>> 0;
    for (let i = 0; i < url.length; i++){ h ^= url.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    // the fingerprint: if any of this differs the two builds are not at the same instant
    const fp = [simT.toFixed(4), hour.toFixed(4), day, wetness.toFixed(4), windF().toFixed(4),
                cloudCover().toFixed(4), nightF.toFixed(4), agents.length, viewS.toFixed(4),
                originX.toFixed(3), topPad.toFixed(3)].join('|');
    return { pools: PUDDLES.length, wetPools: drawn, scene:+(scene/n).toFixed(3),
             pud:+(pud/n).toFixed(3), hash:h.toString(16).padStart(8,'0'), fp, len:url.length };
  }, [WET, n, night, q]);
  await p.close();
  if (errs.length) { console.log('  PAGE ERROR', errs[0]); }
  return r;
}

const NAMES = ['Wide','Courtyard','Street','Plaza','Far bank'];
console.log(`wetness ${WET} · ${N} frames/rep · ${VP.width}x${VP.height} · seed 7 · interleaved HEAD/tree\n`);

console.log('--- COST: drawPuddles alone (ms/frame) ---');
for (const night of [false, true]){
  for (let q = 0; q < 5; q++){
    const row = [];
    for (let r = 0; r < REPS; r++){
      const h = await run(H, q, night, N), t = await run('courtyard.html', q, night, N);
      row.push([h, t]);
    }
    const hp = row.map(x=>x[0].pud), tp = row.map(x=>x[1].pud);
    const med = a => a.slice().sort((x,y)=>x-y)[a.length>>1];
    const hs = row.map(x=>x[0].scene), ts = row.map(x=>x[1].scene);
    console.log(`${night?'night':'day  '} ${NAMES[q].padEnd(10)} wetPools ${String(row[0][0].wetPools).padStart(4)}` +
      `  HEAD pud ${med(hp).toFixed(3)}  TREE pud ${med(tp).toFixed(3)}` +
      `  → ${((med(tp)/med(hp)-1)*100).toFixed(1)}%` +
      `   scene ${med(hs).toFixed(3)} → ${med(ts).toFixed(3)} (${((med(ts)/med(hs)-1)*100).toFixed(1)}%)` +
      `   [pud reps H ${hp.map(v=>v.toFixed(3)).join('/')} T ${tp.map(v=>v.toFixed(3)).join('/')}]`);
  }
}

console.log('\n--- PROOF: canvas hash at a pinned instant, both builds ---');
let bad = 0, fpBad = 0;
for (const night of [false, true]) for (let q = 0; q < 5; q++){
  const h = await run(H, q, night, 1), t = await run('courtyard.html', q, night, 1);
  const same = h.hash === t.hash && h.len === t.len;
  const fpSame = h.fp === t.fp;
  if (!same) bad++; if (!fpSame) fpBad++;
  console.log(`${night?'night':'day  '} ${NAMES[q].padEnd(10)} HEAD ${h.hash} TREE ${t.hash}  ` +
              `${same?'IDENTICAL':'*** DIFFERS ***'}  fingerprint ${fpSame?'NONE':'*** DRIFT ***'}`);
  if (!fpSame){ console.log('   HEAD fp', h.fp); console.log('   TREE fp', t.fp); }
}
console.log(`\n${bad} of 10 framings differ · ${fpBad} fingerprint drifts`);
await b.close(); unlinkSync(H);
