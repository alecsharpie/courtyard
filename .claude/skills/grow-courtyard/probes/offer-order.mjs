// probe-offer-order.mjs — real-time each OFFER surfaces on a fresh, untouched page,
// HEAD vs HERE, wide and narrow. Also: clockPressed retires the clock offer.
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
const pages = { HEAD: pathToFileURL('/tmp/courtyard-head.html').href, HERE: pathToFileURL('/Users/alec/me/courtyard/courtyard.html').href };
const watch = async (url, vp, secs, clickClockAt) => {
  const p = await b.newPage({ viewport: vp });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${url}?seed=7`);
  await p.waitForFunction('typeof window.__census === "function"');
  const t0 = Date.now(); const first = {}; let clicked = false;
  while (Date.now() - t0 < secs * 1000) {
    const t = (Date.now() - t0) / 1000;
    if (clickClockAt != null && !clicked && t > clickClockAt) { await p.click('#daytime'); clicked = true; }
    const r = await p.evaluate(() => {
      const txt = tickerEl.textContent;
      const id = OFFERS.find(o => txt === o.wide || txt === o.narrow)?.id;
      const sill = document.getElementById('sill');
      const dt = document.getElementById('daytime').getBoundingClientRect();
      const ct = document.getElementById('ctrl')?.getBoundingClientRect();
      return { id, offerN, atClock: sill.classList.contains('at-clock'), dtShown: dt.width > 0, dtY: dt.y, ctY: ct?.y, clockPressed };
    });
    if (r.id && first[r.id] == null) first[r.id] = { t: +t.toFixed(1), atClock: r.atClock, dtShown: r.dtShown, sameRow: r.ctY != null && Math.abs(r.dtY - r.ctY) < 8 };
    await new Promise(r => setTimeout(r, 200));
  }
  const end = await p.evaluate(() => ({ offerN, clockPressed }));
  await p.close();
  return { first, end, errs };
};
for (const vp of [{ width: 1400, height: 860 }, { width: 390, height: 844 }]) {
  for (const [tag, url] of Object.entries(pages)) {
    const r = await watch(url, vp, 48);
    console.log(`${vp.width}px ${tag}:`, JSON.stringify(r.first), 'end', JSON.stringify(r.end), r.errs.length ? r.errs : '');
  }
}
// retire: press the clock at 3 s (before any offer); the clock offer must never be spoken
const r = await watch(pages.HERE, { width: 1400, height: 860 }, 34, 3);
console.log('HERE clock pressed @3s:', JSON.stringify(r.first), 'end', JSON.stringify(r.end));
if (r.first.clock) { console.log('FAIL: clock offered after it was pressed'); process.exit(1); }
if (!r.end.clockPressed) { console.log('FAIL: clockPressed never set'); process.exit(1); }
await b.close();
