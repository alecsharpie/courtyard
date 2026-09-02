// Does dawn happen ONE LAMP AT A TIME, or does the town blink out together?
// #112's dawn edge (nightF <= 0.3) is a hard gate on every pane, so the risk of pulling
// it back to first light is that windows which used to burn past it now all go dark in
// the same frame. Steps the clock in 0.02 h from sunUp-1.5 to sunUp+0.8 with __setTime
// (windowLit is a pure function of hour/day/HOMES, so no warping is needed and an empty
// HOMES is the WORST case: the register only ever moves a lamp out EARLIER), and reports
// per day the largest one-step drop, the hour it happens, and the last lit hour.
//   usage: dawn-blink.mjs [file.html]        (compare against `git show HEAD:` first)
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = resolve(process.argv[2] || 'courtyard.html');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
await p.goto(pathToFileURL(file).href + '?pause&seed=1');
await p.waitForFunction(() => window.__warp);
const out = await p.evaluate(() => {
  const lit = () => { let n = 0; for (const [wx, wy, zTop, hgt, sa, sb] of WINDOWS) if (windowLit(sa, sb)) n++; return n; };
  const rows = [];
  for (let d = 0; d < 26; d++){
    window.__setTime(d * DAY_LEN + DAY_LEN * (12 - 6) / 24);          // read the day's own sun at noon
    const up = sunUp;
    let prev = null, worst = 0, worstAt = null, lastLit = null, series = [];
    for (let o = -1.5; o <= 0.8001; o += 0.02){
      window.__setTime(d * DAY_LEN + DAY_LEN * ((up + o) - 6) / 24);
      const n = lit();
      if (prev !== null && prev - n > worst){ worst = prev - n; worstAt = +o.toFixed(2); }
      if (n > 0) lastLit = +o.toFixed(2);
      series.push(n); prev = n;
    }
    rows.push({ d, up: +up.toFixed(2), worst, worstAt, lastLit, peak: Math.max(...series) });
  }
  return rows;
});
await b.close();
console.log(file.split('/').pop(), '· 26 days · 0.02 h steps across sunUp-1.5 .. +0.8\n');
console.log(' day  sunUp   peak   biggest one-step drop      last lit hour (rel sunUp)');
for (const r of out)
  console.log(String(r.d).padStart(4), String(r.up).padStart(6), String(r.peak).padStart(6),
              ('  ' + r.worst + ' panes at sunUp' + (r.worstAt >= 0 ? '+' : '') + r.worstAt).padEnd(27),
              String(r.lastLit).padStart(6));
const worst = out.reduce((a, r) => Math.max(a, r.worst), 0);
const late = out.filter(r => r.lastLit > 0.5);
console.log('\nWORST simultaneous extinction anywhere in the year: ' + worst + ' panes');
console.log('mean biggest drop: ' + (out.reduce((a, r) => a + r.worst, 0) / out.length).toFixed(2) + ' panes');
console.log('latest lamp in the year: sunUp+' + Math.max(...out.map(r => r.lastLit)).toFixed(2)
            + '  ·  days with a lamp lit after sunUp+0.5: ' + late.length + '/26');
