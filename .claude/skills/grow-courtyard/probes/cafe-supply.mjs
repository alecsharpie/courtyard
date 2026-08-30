// cafe supply at the CHOICE: 10 seeds × 5 days from day 5. Per day: cafe/kiosk/market
// spawns (counted as new agents by kind), cafe table-hours, and at each day's 12:00 —
// clear or not — whether anyone sits at a cafe table. Also lane peak.
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
const SEEDS = [3, 7, 11, 19, 42, 63, 101, 1234, 5, 77];
const FILES = process.argv.slice(2).length ? process.argv.slice(2) : ['/tmp/head.html', 'courtyard.html'];
async function run(file, seed){
  const p = await b.newPage({ viewport:{width:1280, height:760} });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(pathToFileURL(resolve(file)).href + `?seed=${seed}&t=0&pause`); await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(() => {
    window.__reseed(); window.__warp(275); const H = 55 / 24, DT = 0.05;
    const seen = new WeakSet(); for (const a of agents) seen.add(a);
    const sp = { cafe:0, kiosk:0, market:0, cafeCo:0 }; let tblH = 0, noonSat = 0, noonClear = 0, noonClearSat = 0, days = 0, lanePk = 0, refused = 0;
    let lastDay = day, noonDone = -1;
    const seenStop = new WeakSet();
    for (let i = 0; i < 5 * 55 / DT; i++){
      window.__warp(DT);
      for (const a of agents){
        if (!seen.has(a)){ seen.add(a);
          if (a.kind === 'cafe' && !a.with) sp.cafe++;
          if (a.kind === 'cafe' && a.with) sp.cafeCo++;
          if (a.kind === 'browser' && a.stop && a.stop.say !== undefined && a.wp.length && a.stop.x < KIOSK.x) sp.kiosk++;
          if (a.kind === 'browser' && a.stop && a.stop.x > KIOSK.x) sp.market++;
        }
        if (a.kind === 'cafe' && !a.with && a.stopped && !seenStop.has(a)){ seenStop.add(a); if (a.state !== 'sit') refused++; }
      }
      const sat = agents.filter(a => a.cup && a.state === 'sit' && a.tableRef).length;
      tblH += sat * DT / H;
      lanePk = Math.max(lanePk, agents.filter(a => a.street && !a.east && !a.band && !a.tap && !a.homer).length);
      if (day !== noonDone && Math.abs(hour - 12) < 0.03){ noonDone = day; days++;
        if (sat) noonSat++; const clr = !raining && weatherComing() < 0.3; if (clr){ noonClear++; if (sat) noonClearSat++; } }
    }
    return { ...sp, tblH:+tblH.toFixed(1), days, noonSat, noonClear, noonClearSat, lanePk, refused };
  });
  await p.close(); return { ...r, errs };
}
const tot = {};
for (const s of SEEDS){
  const rs = await Promise.all(FILES.map(f => run(f, s)));
  console.log(`seed ${s}: ` + rs.map((r, k) => `${FILES[k].split('/').pop()} cafe ${r.cafe}(+${r.cafeCo} co, ${r.refused} ref) kiosk ${r.kiosk} mkt ${r.market} tblH ${r.tblH} noonSat ${r.noonSat}/${r.days} clearSat ${r.noonClearSat}/${r.noonClear} lanePk ${r.lanePk}${r.errs.length ? ' ERR ' + r.errs : ''}`).join(' | '));
  rs.forEach((r, k) => { const t = tot[k] ??= {}; for (const [kk, v] of Object.entries(r)) if (typeof v === 'number') t[kk] = (t[kk] || 0) + v; });
}
for (const k in tot){ const t = tot[k]; console.log(`TOTAL ${FILES[k]}: cafe ${t.cafe} (+${t.cafeCo} co, ${t.refused} refused) kiosk ${t.kiosk} market ${t.market} table-h ${t.tblH.toFixed(1)} noonSat ${t.noonSat}/${t.days} clearNoonSat ${t.noonClearSat}/${t.noonClear} lanePk-sum ${t.lanePk}`); }
await b.close();
