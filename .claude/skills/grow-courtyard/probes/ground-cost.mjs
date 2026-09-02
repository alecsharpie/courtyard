/* perf.mjs is vsync-locked at 16.70 ms and blind to a pass that runs only when the
 * ground cache rebuilds. #135 adds ~1,500 cells of setts to that pass, so time the
 * FUNCTION: drawGround() called directly, interleaved A/B in one browser session,
 * at three framings and on a wet day as well as a dry one. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const files = { HEAD: process.argv[2] || '/tmp/head.html', cand: process.argv[3] || 'courtyard.html' };
const browser = await chromium.launch();
const N = 40;
async function timeIt(file, w, h, t){
  const ctx = await browser.newContext({ viewport:{ width:w, height:h }, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  await p.goto(pathToFileURL(resolve(process.cwd(), file)).href + `?seed=7&t=${t}&pause`, { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate(({ N }) => {
    __reseed(); drawScene(simT, 1/30);
    const ts = [];
    for (let i = 0; i < N; i++){ const t0 = performance.now(); drawGround(); ts.push(performance.now() - t0); }
    ts.sort((a, b) => a - b);
    return { med:+ts[N >> 1].toFixed(2), p10:+ts[(N*0.1)|0].toFixed(2), wet:+wetF().toFixed(2), hour:+hour.toFixed(2) };
  }, { N });
  await ctx.close();
  return r;
}
for (const [w, h] of [[1600, 950], [1280, 700], [390, 844]]){
  for (const t of [175.08, 1210]){
    const out = {};
    for (const rep of [0, 1]) for (const k of ['HEAD', 'cand']) {
      const r = await timeIt(files[k], w, h, t);
      (out[k] = out[k] || []).push(r.med); out.at = `wet ${r.wet} hour ${r.hour}`;
    }
    const m = a => Math.min(...a);
    console.log(`${w}x${h}  t=${t} (${out.at})  drawGround  HEAD ${m(out.HEAD).toFixed(2)}ms  cand ${m(out.cand).toFixed(2)}ms` +
                `  ${(100*(m(out.cand)-m(out.HEAD))/m(out.HEAD)).toFixed(1)}%`);
  }
}
await browser.close();
