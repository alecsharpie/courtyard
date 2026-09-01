/* roof-walk-continuity.mjs (#110) — the per-FRAME z step anything walking the near roof
 * takes, on the two axes that step for different reasons: across a light well's valley
 * (nearZ falls over three cells in x) and down the pitch (nearZ is a CONSTANT within a
 * row, so a row boundary is a cliff). A still frame and a screenshot gate cannot see
 * either; both read as a figure dropping some pixels with no change of leg.
 *
 *   node probes/roof-walk-continuity.mjs          the working tree
 *   node probes/roof-walk-continuity.mjs HEAD     the control, regenerated from git
 *
 * It prints the old per-cell read AND the bilinear one from the same walk, so a build
 * without roofWalkZ() reports the two columns equal and is its own control. */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
/* The HEAD fixture is regenerated here, from git, on every run: a checked-in copy goes
 * stale the moment HEAD moves and the control silently becomes the candidate (LAWS). */
const REPO = resolve(new URL('.', import.meta.url).pathname, '../../../..');
let page_ = process.argv[2] || 'courtyard.html';
if (page_ === 'HEAD'){
  writeFileSync(join(REPO, '.probe-head.html'), execSync('git show HEAD:courtyard.html', { cwd: REPO, maxBuffer: 64e6 }));
  page_ = '.probe-head.html';
}
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport:{width:1600,height:950}, deviceScaleFactor:1 });
const p = await ctx.newPage();
await p.goto(`${pathToFileURL(resolve(REPO, page_)).href}?seed=42&t=0&pause`, { waitUntil:'load' });
await p.waitForFunction(() => typeof window.__warp === 'function');
const r = await p.evaluate(() => {
  const STEP = 1.35 / 60;                       // one frame of the cat's walk
  const smooth = typeof roofWalkZ === 'function';
  const out = { smooth, worstOld: 0, worstOldAt: 0, worstNew: 0, worstNewAt: 0, worstPx: 0 };
  let pz = null, pn = null;
  for (let x = 16; x < 36; x += STEP){
    const y = 81.85 + Math.sin(x * 0.55) * 0.1;
    const zo = roofSurfZ(x, y);
    const zn = smooth ? roofWalkZ(x, y) : zo;
    if (pz !== null){
      if (Math.abs(zo - pz) > out.worstOld){ out.worstOld = Math.abs(zo - pz); out.worstOldAt = +x.toFixed(2); }
      if (Math.abs(zn - pn) > out.worstNew){ out.worstNew = Math.abs(zn - pn); out.worstNewAt = +x.toFixed(2); }
    }
    pz = zo; pn = zn;
  }
  // and the same, in SCREEN pixels at this framing
  const a = project(30, 81.85, 1.55)[1], b = project(30, 81.85, 1.55 - out.worstOld)[1];
  out.worstPx = +(b - a).toFixed(1);
  out.nearZ81 = [20,22,23,24,25,26,27,28,29,30].map(x => +nearZ(x, 81).toFixed(2));
  /* and the SAME walk down the pitch: the cat crosses a row boundary in one frame, and
   * within a row nearZ is a constant, so this is where a per-cell read really steps. */
  let wo = 0, woAt = 0, wn = 0; pz = null; pn = null;
  const line = (x) => (typeof catLine === 'function' ? catLine(x, 0) : 81.85);
  for (let x = 40; x < 75; x += STEP){
    const y = line(x) + Math.sin(x * 0.55) * 0.1;
    const zo = roofSurfZ(x, y), zn = smooth ? roofWalkZ(x, y) : zo;
    if (pz !== null){ if (Math.abs(zo - pz) > wo){ wo = Math.abs(zo - pz); woAt = +x.toFixed(2); }
                      if (Math.abs(zn - pn) > wn) wn = Math.abs(zn - pn); }
    pz = zo; pn = zn;
  }
  out.pitchOld = wo; out.pitchOldAt = woAt; out.pitchNew = wn;
  const c = project(60, 86, 0.93)[1], d = project(60, 86, 0.93 - wo)[1];
  out.pitchPx = +(d - c).toFixed(1);
  return out;
});
console.log(`${page_}  roofWalkZ present: ${r.smooth}`);
console.log(`  nearZ(x,81) for x 20..30: ${r.nearZ81.join(' ')}`);
console.log(`  worst one-FRAME z step on the old per-cell read: ${r.worstOld.toFixed(3)} cells at x ${r.worstOldAt}  (= ${r.worstPx} px down the screen at 1600x950)`);
console.log(`  worst one-FRAME z step actually used now:        ${r.worstNew.toFixed(3)} cells at x ${r.worstNewAt}`);
console.log(`  DOWN THE PITCH (the new wander line, x 40..75):`);
console.log(`    per-cell read steps ${r.pitchOld.toFixed(3)} cells at x ${r.pitchOldAt}  (= ${r.pitchPx} px in one frame)`);
console.log(`    bilinear read steps ${r.pitchNew.toFixed(3)} cells`);
await browser.close();
