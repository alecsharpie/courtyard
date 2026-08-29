/* a tap made on a day with weather ON it: cover/wind/wet continuity where they are non-zero,
 * plus tapOpen/lamps at landing, and after-tap screenshots (wide + phone). */
import { homedir } from 'node:os'; import { join, resolve, dirname } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const { chromium } = (await import(pathToFileURL(join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js')).href)).default;
const PAGE = pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)), '../../../..', 'courtyard.html')).href; const DAY = 55;
const b = await chromium.launch(); let bad = 0;
const ok = (c, s) => { console.log((c ? '  ok   ' : '  FAIL ') + s); if (!c) bad++; };
// find a noon with a front on it: scan days at seed 3
const sc = await b.newPage({ viewport: { width: 1400, height: 900 } });
await sc.goto(PAGE + '?pause&seed=3'); await sc.waitForFunction(() => !!window.__warp);
const found = await sc.evaluate(DAY => { window.__reseed(); const out = [];
  for (let d = 0; d < 20; d++){ window.__setTime(d * DAY + DAY * 6 / 24); window.__warp(DAY * 6 / 24 - 0.01);
    out.push({ d, t: +simT.toFixed(2), cloud: +cloud.toFixed(2), wind: +wind.toFixed(2), wet: +wetness.toFixed(2), raining: !!raining }); }
  return out; }, DAY);
const pick = found.find(f => f.cloud > 0.45 && !f.raining && f.wet > 0) || found.find(f => f.cloud > 0.45) || found.reduce((a, f) => f.cloud > a.cloud ? f : a);
console.log('  candidate noons (seed 3):', found.filter(f => f.cloud > 0.4).map(f => `d${f.d} c${f.cloud} w${f.wind} wet${f.wet}${f.raining?' RAIN':''}`).join(' | '));
console.log('  picked day', pick.d, JSON.stringify(pick));
await sc.close();
// a LIVE page, warped in place (same world the tap will run in), hunting a noon with cover on it
const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(PAGE + '?seed=3');
await p.waitForFunction(() => !!window.__census && window.__census().life.people > 2);
const at = await p.evaluate(DAY => { for (let d = 1; d < 26; d++){ window.__warp(d * DAY + DAY * 5.5 / 24 - simT);
    if (cloud > 0.4 && !raining) return { d, cloud: +cloud.toFixed(3), wind: +wind.toFixed(3), wet: +wetness.toFixed(3), hour: +hour.toFixed(2) }; } return null; }, DAY);
console.log('  live page warped to', JSON.stringify(at));
const rows = await p.evaluate(() => new Promise(res => {
  const el = document.getElementById('daytime'), rows = [];
  const tick = () => { rows.push({ simT, hour, cloud, wind, wet: wetness, rain: !!raining, snow: snowCover, people: window.__entities().length, off: el.disabled });
    if (rows.length > 3 && !el.disabled) return res(rows); if (rows.length > 900) return res(rows); requestAnimationFrame(tick); };
  el.click(); requestAnimationFrame(tick); }));
const f0 = rows[0], f1 = rows[rows.length - 1];
console.log(`  from hour ${f0.hour.toFixed(2)} cloud ${f0.cloud.toFixed(3)} wind ${f0.wind.toFixed(3)} wet ${f0.wet.toFixed(3)} → hour ${f1.hour.toFixed(2)} cloud ${f1.cloud.toFixed(3)} wind ${f1.wind.toFixed(3)} wet ${f1.wet.toFixed(3)} rain ${f1.rain}`);
let up = 0, down = 0, wmax = 0, wetmax = 0, n = 0, dTmax = 0, cloudRange = [1, 0], windRange = [1, 0];
for (let i = 1; i < rows.length; i++){ const dT = rows[i].simT - rows[i-1].simT; dTmax = Math.max(dTmax, dT);
  cloudRange = [Math.min(cloudRange[0], rows[i].cloud), Math.max(cloudRange[1], rows[i].cloud)];
  windRange = [Math.min(windRange[0], rows[i].wind), Math.max(windRange[1], rows[i].wind)];
  if (dT >= 0.1){ n++; const r = (rows[i].cloud - rows[i-1].cloud) / dT; up = Math.max(up, r); down = Math.min(down, r);
    wmax = Math.max(wmax, Math.abs(rows[i].wind - rows[i-1].wind) / dT * DAY / 24); wetmax = Math.max(wetmax, Math.abs(rows[i].wet - rows[i-1].wet) / dT); } }
console.log(`  ${rows.length} frames, max frame step ${dTmax.toFixed(3)} sim s (SKIP_SUB 0.25 splits each); cloud ranged ${cloudRange[0].toFixed(3)}..${cloudRange[1].toFixed(3)}, wind ${windRange[0].toFixed(3)}..${windRange[1].toFixed(3)}`);
ok(cloudRange[1] - cloudRange[0] > 0.05 || windRange[1] - windRange[0] > 0.05, 'the test CAN be non-zero: cover or wind actually moved during this lapse');
ok(up <= 0.0206 && down >= -0.0266, `cover slope +${up.toFixed(4)} / ${down.toFixed(4)} per sim s over ${n} frames (caps +0.020 / -0.026)`);
ok(wmax <= 0.41, `wind max slope ${wmax.toFixed(3)} per sim h (cap 0.400)`);
console.log(`         wet max slope ${wetmax.toFixed(4)} per sim s`);
ok(Math.min(...rows.map(r => r.people)) > 0, 'never empties');
ok(errs.length === 0, `no page errors (${errs.length})`);
// what a visitor sees at landing
const land = await p.evaluate(() => ({ hour: +hour.toFixed(2), tapOpen: typeof tapOpen === 'function' ? tapOpen() : 'n/a', nightF: +nightF.toFixed(2), lit: LIT.length, sunDown: +sunDown.toFixed(2) }));
console.log('  at landing:', JSON.stringify(land));
await p.waitForTimeout(600);
await p.screenshot({ path: 'shots/b64-after-tap-wide.png' });
await p.close();
const ph = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await ph.goto(PAGE + '?seed=7&t=13.75'); await ph.waitForFunction(() => !!window.__census && window.__census().life.people > 2);
await ph.screenshot({ path: 'shots/b64-phone-noon.png' });
await ph.tap('#daytime'); await ph.waitForFunction(() => !document.getElementById('daytime').disabled, null, { timeout: 8000 });
await ph.waitForTimeout(500); await ph.screenshot({ path: 'shots/b64-phone-after-tap.png' });
const pl = await ph.evaluate(() => ({ hour: +hour.toFixed(2), nightF: +nightF.toFixed(2), label: document.getElementById('daytime').textContent }));
ok(pl.nightF > 0.9, `phone tap → hour ${pl.hour}, "${pl.label}"`);
await ph.close(); await b.close();
console.log(bad ? `\nFAIL — ${bad}` : '\nPASS'); process.exit(bad ? 1 : 0);
