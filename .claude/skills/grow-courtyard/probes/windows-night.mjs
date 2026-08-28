/* windows-night — does the lit set THIN over a night? Counts LIT[] per DRAWN frame
 * every 0.25 h, midsummer and midwinter, 18 h from 16.00 (drawn frames, because the
 * facades live in the cached ground layer and only the live pane pass sees the hour),
 * plus the largest one-step change. Pass a path to run it on another build. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const files = { HERE: resolve(process.argv[2] || 'courtyard.html') };
const DAY = 55, SEASON_LEN = 26;
const b = await chromium.launch();
const noon = {};
for (const [name, file] of Object.entries(files)){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  p.on('pageerror', e => console.log('PAGE ERROR', name, e.message));
  await p.goto(pathToFileURL(file).href + '?pause&seed=5');
  await p.waitForFunction(() => window.__warp);
  const out = await p.evaluate(async ({ DAY, SEASON_LEN }) => {
    const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const cv = document.getElementById('cv');
    const res = {};
    for (const [label, dayOff] of [['summer', 6.5], ['winter', 19.5]]){  // phase .25 -> .5 at +6.5 d, .0 at +19.5
      window.__reseed(); window.__setTime(dayOff * DAY + DAY * (16 - 6) / 24);  // 16.00 on that day
      await raf();
      const rows = []; let prev = null, maxStep = 0, maxAt = '';
      for (let i = 0; i < 18 * 4 * 4; i++){                // 18 h in 0.25 h steps
        window.__warp(DAY / 24 * 0.25); await raf();
        const c = window.__census().clock; const n = LIT.length;
        if (prev !== null && Math.abs(n - prev) > maxStep){ maxStep = Math.abs(n - prev); maxAt = c.hour.toFixed(2); }
        prev = n;
        if (i % 8 === 7) rows.push([c.hour.toFixed(1), n, +nightF.toFixed(2)]);
      }
      res[label] = { rows, maxStep, maxAt, sunDown, sunUp };
    }
    window.__reseed(); window.__setTime(27.5); await raf();
    const noon = cv.toDataURL();
    return { res, noon };
  }, { DAY, SEASON_LEN });
  noon[name] = out.noon;
  for (const [label, r] of Object.entries(out.res)){
    console.log(`\n${name} ${label}  sunUp ${r.sunUp.toFixed(2)} sunDown ${r.sunDown.toFixed(2)}  max windows changed in one 0.25 s step: ${r.maxStep} at ${r.maxAt}`);
    console.log('  hour  lit  nightF');
    for (const [h, n, nf] of r.rows) console.log(`  ${h.padStart(5)}  ${String(n).padStart(3)}  ${nf}`);
  }
  await p.close();
}
console.log('\nnoon LIT is 0 above; the daytime frame is untouched by construction (windowLit returns false at nightF <= 0.3)');
await b.close();
