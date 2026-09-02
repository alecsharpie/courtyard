/* b143 — the wash is a NUMBER in probe-dusk-year; this is whether it is a PICTURE.
 *
 * Mean R-B over the drawn frame is the same statistic #112 used to price DAWN_WARM, so
 * the evening is quoted on the morning's own scale. Read above sillTop() only — the sill
 * is baked in the ground cache and is not what this wash is for.
 *
 * Three guards:
 *  · a NOON control at the same day/seed, where the wash is 0 in both builds: it must
 *    come back byte-identical, or the difference below is the instrument, not the light.
 *  · a sim FINGERPRINT (hour, day, warmth, cloud, agents) carried through both sides —
 *    a ?paused page still runs rAF and two loads are not automatically the same world.
 *  · every instant solved as sunset + k at the fixed point, not as a clock hour, since
 *    that is exactly the thing under test.
 *
 *   node .../probes/dusk-frame.mjs [cand] [base]
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const CAND = process.argv[2] || 'courtyard.html';
const BASE = process.argv[3] || '/tmp/head.html';
const VW = 1600, VH = 950;
// day 19 is the year's midwinter, day 6 its midsummer (probe-dusk-year)
const CASES = [];
for (const [lbl, d] of [['midwinter d19', 19], ['midsummer d6', 6]])
  for (const k of [-1, 0, 1]) CASES.push({ lbl, d, k });
CASES.push({ lbl: 'midsummer d6', d: 6, k: null });   // the NOON control
CASES.push({ lbl: 'midwinter d19', d: 19, k: null });

const b = await chromium.launch();
async function run(file){
  const p = await b.newPage({ viewport: { width: VW, height: VH } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=42&pause');
  await p.waitForFunction('typeof __setTime === "function"');
  const out = await p.evaluate((CASES) => {
    const res = [];
    for (const c of CASES){
      let h = c.k === null ? 12.75 : 19 + c.k;
      for (let it = 0; it < 24; it++){
        __reseed();
        __setTime(c.d * DAY_LEN + ((h - DAY_ROLL) / 24) * DAY_LEN);
        if (c.k === null) break;
        const want = sunDown + c.k;
        if (Math.abs(want - h) < 1e-5) break;
        h = want;
      }
      drawScene(simT, 1 / 30);                       // pin the instant, in this evaluate
      const top = 0, bot = Math.round(sillTop());
      const im = ctx.getImageData(0, top, cv.width, Math.max(1, bot - top)).data;
      let r = 0, g = 0, bl = 0, n = 0, sum = 0, sq = 0;
      for (let i = 0; i < im.length; i += 4){
        r += im[i]; g += im[i + 1]; bl += im[i + 2]; n++;
        const L = 0.299 * im[i] + 0.587 * im[i + 1] + 0.114 * im[i + 2];
        sum += L; sq += L * L;
      }
      const mean = sum / n;
      res.push({ lbl: c.lbl, k: c.k, hour: +hour.toFixed(3), sunDown: +sunDown.toFixed(3),
        RB: +((r - bl) / n).toFixed(2), R: +(r / n).toFixed(2), B: +(bl / n).toFixed(2),
        luma: +mean.toFixed(2), sd: +Math.sqrt(Math.max(0, sq / n - mean * mean)).toFixed(2),
        px: cv.toDataURL(),
        fp: [+hour.toFixed(3), day, +warmth.toFixed(3), +cloudCover().toFixed(3), agents.length] });
    }
    return res;
  }, CASES);
  await p.close();
  if (errs.length) console.log('  PAGE ERRORS', file, errs.slice(0, 3));
  return out;
}
const A = await run(BASE), B = await run(CAND);
await b.close();

console.log('\n  case                 hour  sunDown |  HEAD R-B   CAND R-B    delta |  luma H->C   identical?');
let bad = 0;
for (let i = 0; i < A.length; i++){
  const a = A[i], c = B[i];
  if (JSON.stringify(a.fp) !== JSON.stringify(c.fp)){ console.log('  FINGERPRINT MISMATCH', a.lbl, a.fp, c.fp); bad++; }
  const same = a.px === c.px;
  const lab = (a.lbl + (a.k === null ? '  NOON ctl' : '  sunset' + (a.k >= 0 ? '+' : '') + a.k)).padEnd(24);
  console.log('  ' + lab + a.hour.toFixed(2).padStart(5) + a.sunDown.toFixed(2).padStart(9) +
    ' |' + a.RB.toFixed(2).padStart(9) + c.RB.toFixed(2).padStart(11) +
    (c.RB - a.RB >= 0 ? '  +' : '  ') + (c.RB - a.RB).toFixed(2).padStart(6) +
    ' |' + a.luma.toFixed(1).padStart(8) + ' ->' + c.luma.toFixed(1).padStart(7) +
    '   ' + (same ? 'BYTE-IDENTICAL' : 'differs'));
  if (a.k === null && !same){ console.log('    ^^ CONTROL FAILED: noon must not move'); bad++; }
}
console.log('\nVERDICT: ' + (bad ? 'CONTROLS FAILED (' + bad + ')' : 'controls clean'));
