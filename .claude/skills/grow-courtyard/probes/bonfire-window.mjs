/* probe: the bonfire's set-out window — per seed × shed day, the predicate components
 * (rain, wetF, windF, snowCover) at bonfireHour()..+2 h and +6 h, and how many offered
 * seed-days had a fine window at all. The weather's conversion sets BON_K (#93). */import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(resolve(REPO, 'courtyard.html')).href;
const SEEDS = [7,42,1234,99,3,11,21,77];
const browser = await chromium.launch();
let okWin = 0, okAny = 0, tot = 0;
for (const seed of SEEDS){
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
  await page.goto(`${PAGE}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const rows = await page.evaluate(() => {
    window.__reseed();
    const out = [];
    while (day < 12) window.__warp(1);
    while (day <= 18){
      window.__warp(0.25);
      const bh = bonfireHour();
      if (hour >= bh - 0.5 && hour < bh + 6){
        out.push([day, +hour.toFixed(2), +bh.toFixed(2), +leafShed().toFixed(2), hash(day, BON_SALT) < BON_K ? 1 : 0, raining ? 1 : 0, +wetF().toFixed(2), +windF().toFixed(2), +snowCover.toFixed(2), bonfireWeather() ? 1 : 0, bonfireDue() ? 1 : 0, bon.day, +sunUp.toFixed(2)]);
      }
    }
    return out;
  });
  const byDay = {};
  for (const r of rows){ (byDay[r[0]] ||= []).push(r); }
  for (const d of Object.keys(byDay)){
    const rs = byDay[d]; const inWin = rs.filter(r => r[1] >= r[2] && r[1] < r[2] + 2);
    const offered = rs[0][4]; if (!offered) continue;
    tot++;
    const wOk = inWin.some(r => r[9]); const anyOk = rs.some(r => r[9]);
    okWin += wOk; okAny += anyOk;
    const f = k => rs.map(r => r[k]);
    console.log(`seed ${String(seed).padStart(4)} d${d} sunUp ${rs[0][12]} bh ${rs[0][2]} shed ${rs[0][3]} | window ok ${wOk?'Y':'n'} (+6h ${anyOk?'Y':'n'}) set-out ${rs.some(r=>r[11]===+d)?'Y':'n'} | rain ${Math.max(...f(5))} wet ${Math.min(...f(6))}-${Math.max(...f(6))} wind ${Math.min(...f(7))}-${Math.max(...f(7))} snow ${Math.max(...f(8))}`);
  }
  await page.close();
}
console.log(`offered seed-days ${tot}: weather ok in 2h window ${okWin}, within +6h ${okAny}`);
await browser.close();
