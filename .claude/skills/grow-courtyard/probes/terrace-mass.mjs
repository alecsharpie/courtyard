#!/usr/bin/env node
/* #201 — the shipping-size look gate for the terrace fabric: a DIFFERENCE IMAGE and a
 * number, at 1600x950 and at 390x844, with a same-code floor.
 *
 * The control is the candidate's OWN source with drawLeadsFabric()'s body returned early
 * — one way of differing, and not one R() spent differently, so the two are the same
 * world at the same instant. The fabric is CACHED and the cords, the hatch lids and the
 * tenants are all painted over it, so what this counts is the mass that SURVIVES the
 * compositing rather than the mass it laid down.
 *
 * Every changed pixel is attributed through the page's own unproject(): TERRACE (a lead
 * cell of a bay, rows 86-87), NEARROOF (the rest of our own block) or ELSEWHERE — which
 * is the containment claim, and must sit at the floor.
 *   node .claude/skills/grow-courtyard/probes/terrace-mass.mjs                     the change
 *   node .claude/skills/grow-courtyard/probes/terrace-mass.mjs --floor             the same code twice: every bucket 0 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname } from 'node:path'; import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const argv = process.argv.slice(2); const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const CAND = resolve(ROOT, arg('--cand', 'courtyard.html'));
const TS = arg('--t', '175,715,1058').split(',').map(Number);
const SEED = arg('--seed', '42');
const FLOOR = argv.includes('--floor');
mkdirSync(join(ROOT, 'shots'), { recursive: true });
const src = readFileSync(CAND, 'utf8');
const M = 'function drawLeadsFabric(g){';
if (src.indexOf(M) < 0) throw new Error('no drawLeadsFabric in ' + CAND);
const REF = '/tmp/terrace-off.html';
writeFileSync(REF, FLOOR ? src : src.replace(M, M + ' if (1) return;'));
const PIN = `(t) => { __setTime(t); __reseed(); drawScene(t, 0); }`;

async function frame(b, file, w, h, t){
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(pathToFileURL(resolve(file)).href + `?pause&seed=${SEED}&t=${t}`);
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const url = await p.evaluate(([t2, pin]) => { eval('(' + pin + ')')(t2); return cv.toDataURL(); }, [t, PIN]);
  await p.close(); return url;
}
const ANALYSE = `(refUrl, pin, t) => new Promise(res => {
  eval('(' + pin + ')')(t);
  const bay = new Set();
  for (const b of LEADS_BAYS) for (let x = b.x0; x < b.x1; x++) for (let y = LEADS_Y0; y < WH; y++) bay.add(y * GW + x);
  const im = new Image();
  im.onload = () => {
    const oc = document.createElement('canvas'); oc.width = cv.width; oc.height = cv.height;
    const og = oc.getContext('2d'); og.drawImage(im, 0, 0);
    const A = og.getImageData(0,0,cv.width,cv.height).data;
    const B = cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
    const sx = cv.width / W, sy = cv.height / H;
    const HIT = {terrace:0, nearroof:0, elsewhere:0}, SUM = {terrace:0, nearroof:0, elsewhere:0};
    const out = new Uint8ClampedArray(cv.width * cv.height * 4);
    for (let py = 0; py < cv.height; py++) for (let px = 0; px < cv.width; px++){
      const i4 = (py * cv.width + px) * 4;
      const d = (Math.abs(A[i4]-B[i4]) + Math.abs(A[i4+1]-B[i4+1]) + Math.abs(A[i4+2]-B[i4+2])) / 3;
      const v = Math.min(255, d * 8); out[i4]=v; out[i4+1]=v; out[i4+2]=v; out[i4+3]=255;
      if (d <= 2) continue;
      const [wx, wy] = unproject(px / sx, py / sy);
      const gx = wx|0, gy = wy|0;
      const k = (gx >= 0 && gy >= 0 && gx < GW && gy < WH && bay.has(gy*GW+gx)) ? 'terrace'
              : (wy >= LN_WALK_S ? 'nearroof' : 'elsewhere');
      HIT[k]++; SUM[k] += d;
    }
    const o2 = document.createElement('canvas'); o2.width = cv.width; o2.height = cv.height;
    o2.getContext('2d').putImageData(new ImageData(out, cv.width, cv.height), 0, 0);
    res({HIT, SUM, png: o2.toDataURL(), season:+seasonPhase.toFixed(3), hour:+hour.toFixed(1),
         tip:+chairTip().toFixed(2), kitN:leadsKitN()});
  };
  im.src = refUrl;
})`;
const b = await chromium.launch();
console.log(FLOOR ? 'FLOOR — the same code twice' : 'CANDIDATE vs the same build with drawLeadsFabric() off');
console.log('framing        t   phase  hour   tip     TERRACE px  mean|d|   NEARROOF   ELSEWHERE');
for (const [w, h] of [[1600, 950], [390, 844]]){
  for (const t of TS){
    const ref = await frame(b, REF, w, h, t);
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto(pathToFileURL(CAND).href + `?pause&seed=${SEED}&t=${t}`);
    await p.waitForFunction(() => typeof window.__warp === 'function');
    const r = await p.evaluate(([u, pin, t2, a]) => eval('(' + a + ')')(u, pin, t2), [ref, PIN, t, ANALYSE]);
    const mean = r.HIT.terrace ? (r.SUM.terrace / r.HIT.terrace).toFixed(1) : '0';
    console.log(`${w}x${h}`.padEnd(11) + String(t).padStart(5) + String(r.season).padStart(8)
      + String(r.hour).padStart(6) + String(r.tip).padStart(6)
      + String(r.HIT.terrace).padStart(14) + String(mean).padStart(9)
      + String(r.HIT.nearroof).padStart(11) + String(r.HIT.elsewhere).padStart(12));
    if (!FLOOR) writeFileSync(join(ROOT, `shots/terrace-diff-${w}-${t}.png`), Buffer.from(r.png.split(',')[1], 'base64'));
    await p.close();
  }
}
await b.close();
