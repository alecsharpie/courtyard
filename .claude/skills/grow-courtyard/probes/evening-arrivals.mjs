import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = process.argv[2] === 'head' ? '/tmp/courtyard-head.html' : new URL('../../../../courtyard.html', import.meta.url).pathname;
const br = await chromium.launch();
async function run(seed, day0, days){
  const page = await br.newPage({ viewport:{width:1200,height:720} });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}&t=0`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(([day0, days]) => {
    window.__reseed(); window.__warp(day0 * 55);
    const seen = new Set(); const pres = {}; let walks = [], arrivals = 0, pairs = 0, late = 0, open = 0, wentHome = 0, evenings = [];
    const where = {deck:0, quay:0, far:0, other:0}; let evOpenDays = 0, lastDay = -1, dayOpen = false, warm = [];
    for (let i = 0; i < days * 55 / 0.25; i++){ window.__warp(0.25);
      if (day !== lastDay){ if (dayOpen) evOpenDays++; lastDay = day; dayOpen = false; warm.push(+warmth.toFixed(2)); }
      if (typeof eveOpen === 'function' && eveOpen()) dayOpen = true;
      const rel = hourEve() - sunDown;   // hours past sunset
      const ev = agents.filter(a => a.dusk);
      for (const a of ev){ if (!seen.has(a)){ seen.add(a); arrivals++; a.__t0 = simT; if (a.with) pairs++; } if (a.home) a.__home = 1;
        if (!a.with && !a.__t1 && a.state !== 'walk'){ a.__t1 = simT; walks.push([+((a.__t1 - a.__t0) * 24 / 55).toFixed(2), +a.pred.toFixed(2)]); } }
      if (rel > 3.5 && rel < 6) late += ev.length;
      const b = Math.round(rel * 2) / 2;
      if (rel > -1 && rel < 5){ pres[b] = (pres[b] || 0) + ev.length; }
      for (const a of ev) if (a.state !== 'walk'){ if (a.y < 33 && a.x > 114 && a.x < 128) where.deck++; else if (a.x < 114) where.quay++; else if (a.x >= 128) where.far++; else where.other++; }
    }
    for (const a of seen) if (a.__home) wentHome++;
    return { walks, arrivals, pairs, wentHome, late, evOpenDays, pres, where, warm };
  }, [day0, days]);
  await page.close(); return r;
}
const seeds = [1,2,3,4,5,6,7,8,9,10];
for (const [label, day0] of [['summer d4-7', 4], ['winter d18-21', 18]]){
  let WK = [], A = 0, P = 0, H = 0, L = 0, OD = 0, PRES = {}, W = {deck:0,quay:0,far:0,other:0}, warm;
  for (const seed of seeds){ const r = await run(seed, day0, 4); A += r.arrivals; WK.push(...r.walks); P += r.pairs; H += r.wentHome; L += r.late; OD += r.evOpenDays; warm = r.warm;
    for (const k in r.pres) PRES[k] = (PRES[k] || 0) + r.pres[k]; for (const k in W) W[k] += r.where[k]; }
  const n = seeds.length * 4;
  console.log(`${label} warmth ${warm}: evenings open ${OD}/${n}, arrivals ${A} (${(A/n).toFixed(2)}/evening, ${P} companions), wentHome ${H}, samples after sunDown+3.5h: ${L}`);
  console.log('  mean presence by h past sunset:', Object.keys(PRES).sort((a,b)=>a-b).map(k => `${k}:${(PRES[k] / n / 2).toFixed(1)}`).join(' '));
  console.log('  stopped samples by place:', W);
  if (WK.length){ const ratio = WK.map(([a,p]) => a/p); console.log(`  walk actual/pred: n ${WK.length} mean ${(ratio.reduce((x,y)=>x+y,0)/ratio.length).toFixed(2)} min ${Math.min(...ratio).toFixed(2)} max ${Math.max(...ratio).toFixed(2)}; actual h min ${Math.min(...WK.map(w=>w[0]))} max ${Math.max(...WK.map(w=>w[0]))}`); }
}
await br.close();
