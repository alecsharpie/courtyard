/* Who owns the ticker's surface? Count every line by CLASS at each quarter over N sim
 * days. A class is stamped where the line is BORN (inside sayAt = placed, inside the
 * ambient roll = ambient, the strike's own text = strike, its follow-on = bell), then
 * read back at showLine — the only place a line actually reaches the surface. */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(join(process.cwd(), 'courtyard.html')).href;
const days = +(process.env.DAYS || 6);
const seeds = (process.env.SEEDS || '7,42,3').split(',').map(Number);
const WHERE = (process.env.WHERE || 'Wide,Courtyard,Street,Plaza,Far bank').split(',');
const b = await chromium.launch();
const agg = {};
for (const seed of seeds){
for (const where of WHERE){
  const pg = await b.newPage({ viewport: { width: 1600, height: 950 } });
  const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(PAGE + `?pause&seed=${seed}&t=0`);
  await pg.waitForFunction('window.__census');
  const r = await pg.evaluate(async ([days, where]) => {
    window.__reseed();
    whereN = QUARTERS.findIndex(q => q.name === where); viewSnap();
    const shown = {}, tried = {}, queued = {}, refused = {}, withheld = { n: 0 }, late = [], hrs = [];
    const clsOf = new Map();
    let cls = null, lastAmb = null;
    const oSay = sayAt, oAmb = ambientLine, oAnn = announce, oShow = showLine;
    window.sayAt = function(x, y, txt, then){
      if (!inView(x, y)){ withheld.n++; return; }
      cls = 'placed'; try { return window.announce(txt, then); } finally { cls = null; }
    };
    window.ambientLine = function(){ const t = oAmb(); lastAmb = t; return t; };
    window.announce = function(txt, then, dwell, until){
      const c = cls || (/^The clock over the lane strikes/.test(txt) ? 'strike'
                     : txt === lastAmb ? 'ambient' : 'other');
      if (!clsOf.has(txt)) clsOf.set(txt, []);
      clsOf.get(txt).push({ c, at: day * 24 + hour });
      if (then){ if (!clsOf.has(then)) clsOf.set(then, []); clsOf.get(then).push({ c: 'bell', at: day * 24 + hour }); }
      tried[c] = (tried[c] || 0) + 1;
      const before = tickerQ.length, free = tickerFree();
      const r = oAnn(txt, then, dwell, until);
      if (!free && tickerQ.length === before) refused[c] = (refused[c] || 0) + 1;   // dup-suppressed
      else if (!free) queued[c] = (queued[c] || 0) + 1;
      return r;
    };
    window.showLine = function(e){ const q = clsOf.get(e.txt);
      const r = (q && q.length) ? q.shift() : { c: '?', at: day * 24 + hour };
      shown[r.c] = (shown[r.c] || 0) + 1;
      const lag = day * 24 + hour - r.at;
      const m = /^The clock over the lane strikes (\w+)\./.exec(e.txt);
      if (m){
        const w = HOUR_WORDS.indexOf(m[1]);
        const lag12 = Math.min((hour - w + 24) % 24, (hour - w - 12 + 48) % 24);
        late.push(lag12); hrs.push((hour - lag12 + 24) % 24 | 0);
      }
      return oShow(e); };
    for (let i = 0; i < days * 55 / 0.25; i++) window.__warp(0.25);
    return { shown, tried, queued, refused, withheld: withheld.n, late, hrs };
  }, [days, where]);
  await pg.close();
  if (errs.length){ console.log('PAGE ERROR ' + errs[0]); process.exit(1); }
  const k = where; agg[k] = agg[k] || { shown: {}, tried: {}, queued: {}, refused: {}, withheld: 0 };
  for (const c in r.shown) agg[k].shown[c] = (agg[k].shown[c] || 0) + r.shown[c];
  for (const c in r.tried) agg[k].tried[c] = (agg[k].tried[c] || 0) + r.tried[c];
  for (const c in r.queued) agg[k].queued[c] = (agg[k].queued[c] || 0) + r.queued[c];
  for (const c in r.refused) agg[k].refused[c] = (agg[k].refused[c] || 0) + r.refused[c];
  agg[k].withheld += r.withheld;
  (agg[k].late = agg[k].late || []).push(...r.late);
  (agg[k].hrs = agg[k].hrs || []).push(...r.hrs);
}}
await b.close();
const CL = ['strike', 'bell', 'placed', 'ambient', 'other'];
console.log(`\n${days} sim days x ${seeds.length} seeds (${seeds.join(',')}) — lines SHOWN on the surface\n`);
console.log('quarter      total  ' + CL.map(c => c.padStart(9)).join('') + '   withheld');
for (const k of WHERE){
  const s = agg[k].shown, tot = CL.reduce((a, c) => a + (s[c] || 0), 0) + (s['?'] || 0);
  const cells = CL.map(c => `${String(s[c] || 0).padStart(4)} ${((100 * (s[c] || 0) / tot) || 0).toFixed(0).padStart(3)}%`);
  console.log(k.padEnd(11) + String(tot).padStart(6) + '  ' + cells.join('') + String(agg[k].withheld).padStart(11));
}
console.log('\nWHICH HOURS the clock is heard on (of 8 strike hours x %d days x %d seeds)'.replace('%d', days).replace('%d', seeds.length));
for (const k of WHERE){
  const h = {}; for (const v of (agg[k].hrs || [])) h[v] = (h[v] || 0) + 1;
  console.log(k.padEnd(11) + [0,3,6,9,12,15,18,21].map(x => `${x}h:${String(h[x]||0).padStart(3)}`).join('  '));
}
console.log('\nSTRIKE LATENESS on the surface (sim hours between the strike and its line)');
for (const k of WHERE){
  const L = (agg[k].late || []).slice().sort((a, b) => a - b);
  const q = f => L.length ? L[Math.min(L.length - 1, Math.floor(f * L.length))].toFixed(2) : '-';
  const over = L.filter(v => v >= 1).length;
  console.log(k.padEnd(11) + `n=${String(L.length).padStart(4)}  median ${q(0.5).padStart(5)}  p90 ${q(0.9).padStart(5)}  max ${(L.length ? L[L.length - 1] : 0).toFixed(2).padStart(5)}  >=1h: ${over} (${(100 * over / (L.length || 1)).toFixed(0)}%)`);
}
for (const label of ['tried', 'queued', 'refused']){
  console.log(`\n(${label.toUpperCase()})`);
  for (const k of WHERE){
    const s = agg[k][label], tot = CL.reduce((a, c) => a + (s[c] || 0), 0);
    console.log(k.padEnd(11) + String(tot).padStart(6) + '  ' + CL.map(c => `${String(s[c] || 0).padStart(4)} ${((100 * (s[c] || 0) / tot) || 0).toFixed(0).padStart(3)}%`).join(''));
  }
}
