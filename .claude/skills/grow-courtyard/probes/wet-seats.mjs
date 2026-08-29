// wet seats, HEAD vs tree, 10 seeds. Pin the state a shower leaves — a clear daylit morning
// with wetness forced to 1 — and count every street 'sit' stop AT the choice for 4 h after:
// taken vs refused, seated population per half hour, time of the first seat taken.
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
const SEEDS = [3, 7, 11, 19, 42, 63, 101, 1234, 5, 77];
const WET0 = +(process.env.WET0 ?? 1);
async function run(file, seed){
  const p = await b.newPage({ viewport:{width:1280, height:760} });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(pathToFileURL(resolve(file)).href + `?seed=${seed}&t=0&pause`); await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate((WET0) => {
    window.__reseed(); window.__warp(275); const H = 55 / 24;
    // first clear 10:00 from day 5 on
    let ok = false;
    for (let d = 0; d < 12 && !ok; d++){ window.__warp(0.05); while (Math.abs(hour - 10) > 0.03) window.__warp(0.05);
      if (!raining && weatherComing() < 0.3) ok = true; else window.__warp(20); }
    if (!ok) return null;
    const t0 = simT; wetness = WET0; groundDirty = true;
    const seen = new Map(); const rows = []; let firstSit = null, took = 0, refused = 0, sitH = 0;
    for (let i = 0; i < 4 * H / 0.05; i++){
      window.__warp(0.05); const hrs = (simT - t0) / H;
      for (const a of agents){
        if (!a.stop || a.stop.act !== 'sit') continue;
        if (a.stopped && !seen.get(a)){ seen.set(a, true);
          if (a.state === 'sit'){ took++; if (firstSit == null) firstSit = hrs; } else refused++; }
      }
      sitH += agents.filter(a => a.street && a.state === 'sit').length * 0.05 / H;
      if (i % Math.round(0.5 * H / 0.05) === 0) rows.push(`${hrs.toFixed(1)}:${wetness.toFixed(2)}:${agents.filter(a => a.street && a.state === 'sit').length}`);
    }
    return { t0: +t0.toFixed(1), warmth: +warmth.toFixed(2), cm: +weatherComing().toFixed(2), firstSit: firstSit == null ? null : +firstSit.toFixed(2), took, refused, sitH: +sitH.toFixed(1), rows };
  }, WET0);
  await p.close(); return r ? { ...r, errs } : null;
}
let T = { hTook: 0, hRef: 0, tTook: 0, tRef: 0, hSitH: 0, tSitH: 0, hFirst: [], tFirst: [] };
for (const s of SEEDS){
  const [h, t] = await Promise.all([run('/tmp/head.html', s), run('courtyard.html', s)]);
  if (!h || !t){ console.log(`seed ${s}: no clear morning — skipped`); continue; }
  console.log(`seed ${s}: t0 ${h.t0} warmth ${h.warmth} cm ${h.cm} | firstSit HEAD ${h.firstSit}h TREE ${t.firstSit}h | took/refused HEAD ${h.took}/${h.refused} TREE ${t.took}/${t.refused} | seat-hours HEAD ${h.sitH} TREE ${t.sitH}`);
  console.log('   h:wet:sitting HEAD ' + h.rows.join(' ')); console.log('                TREE ' + t.rows.join(' '));
  if (h.errs.length || t.errs.length) console.log('ERRS', h.errs, t.errs);
  T.hTook += h.took; T.hRef += h.refused; T.tTook += t.took; T.tRef += t.refused; T.hSitH += h.sitH; T.tSitH += t.sitH;
  if (h.firstSit != null) T.hFirst.push(h.firstSit); if (t.firstSit != null) T.tFirst.push(t.firstSit);
}
const med = a => a.length ? a.sort((x, y) => x - y)[a.length >> 1] : null;
console.log(`TOTAL wet0=${WET0}: HEAD took ${T.hTook} refused ${T.hRef} seat-h ${T.hSitH.toFixed(1)} firstSit med ${med(T.hFirst)} | TREE took ${T.tTook} refused ${T.tRef} seat-h ${T.tSitH.toFixed(1)} firstSit med ${med(T.tFirst)}`);
await b.close();
