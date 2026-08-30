// #85 pricing, run on ANY build: far-side east retirements per summer evening, and whether a walk to the
// deck's WEST posts (116.5) or its EAST end (125.5) fits the window — the choice is counted at the retire, not by presence.
import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = new URL('../../../../courtyard.html', import.meta.url).pathname;
const br = await chromium.launch();
async function run(seed, day0, days){
  const page = await br.newPage({ viewport:{width:1200,height:720} });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}&t=0`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(([day0, days]) => {
    window.__reseed(); window.__warp(day0 * 55);
    const eq = (p, q) => Math.abs(p[0]-q[0])<1e-6 && Math.abs(p[1]-q[1])<1e-6;
    const deckPath = a => { const w = a.wp.slice(a.i); let k = w.findIndex(p => eq(p, [TOW_WALK, DECK_WALK]));
      if (k >= 0) return w.slice(0, k+1);
      if (Math.abs(a.x - TOW_WALK) < 0.3) return [[TOW_WALK, DECK_WALK]];
      k = w.findIndex(p => eq(p, [FAR_WALK, DECK_WALK])); if (k >= 0) return w.slice(0, k+1).concat([[TOW_WALK, DECK_WALK]]);
      if (Math.abs(a.x - FAR_WALK) < 0.6) return [[FAR_WALK, DECK_WALK], [TOW_WALK, DECK_WALK]];
      return null; };
    const ret = []; let lastDay = -1, bandDays = 0;
    for (let i = 0; i < days * 55 / 0.25; i++){ window.__warp(0.25);
      if (day !== lastDay){ lastDay = day; if (isBandDay()) bandDays++; }
      const rel = hourEve() - sunDown;
      for (const a of agents){ if (!a.east || a.nightRail || a.with || a.__ret) continue;
        if (a.stopped && a.state === 'walk'){ a.__ret = 1; if (a.x < RIVER_X1 - 1 || a.y > 60) continue;
          const p = deckPath(a); const o = { seed:0, rel:+rel.toFixed(2), day, band:!!a.band, kind:a.kind + (a.jetty ? '/jetty' : ''), x:+a.x.toFixed(1), y:+a.y.toFixed(1), path:!!p, wx: p ? p.slice(-1)[0][0] : null };
          if (p){ for (const [nm, px] of [['W', 116.5], ['E', 125.5]]){ const arrive = hourEve() + pathHours(a.x, a.y, p.concat([[px, DECK_Y0 + 0.5]]), a.speed);
            o['walk'+nm] = +(arrive - hourEve()).toFixed(2); o['fit'+nm] = arrive + EVE_STAND < eveEnd() && arrive >= sunDown - EVE_LEAD && eveWeather() && day >= 1; } }
          ret.push(o); } }
    }
    return { ret, bandDays };
  }, [day0, days]);
  await page.close(); return r;
}
const seeds = [1,2,3,4,5,6,7,8,9,10];
let R = [], BD = 0;
for (const seed of seeds){ const r = await run(seed, 4, 4); R.push(...r.ret.map(x => ({...x, seed}))); BD += r.bandDays; }
console.log(`summer: band days ${BD}/40; far-side retirements ${R.length}`);
for (const band of [false, true]){ const S = R.filter(r => r.band === band);
  const hist = {}; for (const r of S){ const b = Math.floor(r.rel); hist[b] = (hist[b]||0)+1; }
  console.log(`${band?'AUDIENCE':'east visitors'}: n ${S.length}  by hour rel sunDown: ` + Object.keys(hist).sort((a,b)=>a-b).map(k=>`${k}:${hist[k]}`).join(' '));
  const byK = {}; for (const r of S){ const k = r.kind + (r.path ? '' : ' NOPATH'); byK[k] = byK[k] || {n:0, fitW:0, fitE:0, wE:[]}; byK[k].n++; if (r.fitW) byK[k].fitW++; if (r.fitE) byK[k].fitE++; if (r.walkE!=null) byK[k].wE.push(r.walkE); }
  for (const k in byK){ const w = byK[k].wE; console.log(`   ${k}: n ${byK[k].n} fitW ${byK[k].fitW} fitE ${byK[k].fitE} walkE h ${w.length? Math.min(...w).toFixed(1)+'..'+Math.max(...w).toFixed(1):'-'}`); }
  const perEv = {}; for (const r of S.filter(r=>r.fitE)){ const k = r.seed+':'+r.day; perEv[k]=(perEv[k]||0)+1; }
  console.log(`   evenings with >=1 fitE: ${Object.keys(perEv).length}/40; >=2: ${Object.values(perEv).filter(v=>v>=2).length}`);
}
const perEv = {}; for (const r of R.filter(r=>r.fitE)){ const k = r.seed+':'+r.day; perEv[k]=(perEv[k]||0)+1; }
console.log(`ALL: evenings with >=1 fitE: ${Object.keys(perEv).length}/40; >=2: ${Object.values(perEv).filter(v=>v>=2).length}`);
const nop = R.filter(r => !r.path); console.log('no path sample:', nop.slice(0,8).map(r => `${r.kind}@${r.x},${r.y}`).join('  '));
await br.close();
