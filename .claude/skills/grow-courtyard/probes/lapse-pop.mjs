/* b161 premise: "the morning lapse lands with the sweeper, the cart and nobody else."
 * Counts PEOPLE present at the two clock-button destinations, once per day, over a
 * whole year (SEASON_LEN 26) x seeds. Morning = sunUp + DAWN_AFTER_H (0.5); evening =
 * sunDown + EVE_AFTER_H (1.0) — the two hours eveningTarget() alternates between. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process'; import fs from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i!==-1&&process.argv[i+1]?process.argv[i+1]:d;};
const REPO = resolve(new URL('.', import.meta.url).pathname, '../../../..');
const NDAYS=+arg('--days',26), DAY0=+arg('--day0',2);
const SEEDS=arg('--seeds','3,11,23,42,77').split(',').map(Number);
const files=[];
if (arg('--head','0')==='1'){ const h=resolve(REPO,'.probe-head.html');
  fs.writeFileSync(h, execSync('git show HEAD:courtyard.html',{cwd:REPO,maxBuffer:1<<28})); files.push(['HEAD',h]); }
if (arg('--cand','1')==='1') files.push(['CAND', resolve(REPO,'courtyard.html')]);

const br = await chromium.launch();
for (const [label, FILE] of files){
  const samples = { morning: [], evening: [] };
  for (const seed of SEEDS){
    const page = await br.newPage({ viewport:{width:1200,height:720} });
    page.on('pageerror', e => console.log('PAGEERROR', seed, e.message));
    await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}`, { waitUntil:'load' });
    await page.waitForFunction(() => typeof window.__warp === 'function');
    const r = await page.evaluate(([DAY0,NDAYS]) => {
      window.__reseed(); window.__warp(DAY0*55 - simT);
      const out = [];
      // what a figure IS, for the breakdown — first match wins, positive flags first
      const role = a => a.round ? 'round' : a.kind === 'sweeper' ? 'sweeper' : a.homer ? 'homer'
        : a.dusk ? 'dusk' : a.tap ? 'tap' : a.fam ? 'family' : a.lawn ? 'lawn' : a.band ? 'band'
        : a.far ? 'far' : a.eyot ? 'eyot' : a.tend ? 'tend' : a.dig ? 'dig' : a.home ? 'home'
        : a.stay ? 'stay' : a.market ? 'market' : a.cafe ? 'cafe' : (a.kind || 'walker');
      const snap = which => {
        const on = agents.filter(a => a.x > -1 && a.x < GW + 1);
        const by = {}; for (const a of on) by[role(a)] = (by[role(a)] || 0) + 1;
        if (typeof cart !== 'undefined' && cart) by['cart'] = 1;
        out.push({ which, day, hour:+hour.toFixed(2), season:+seasonPhase.toFixed(3), warm:+warmth.toFixed(2),
                   n:on.length, cart: (typeof cart !== 'undefined' && cart) ? 1 : 0, rain: raining ? 1 : 0,
                   snow:+snowCover.toFixed(2), by });
      };
      const ph = h => ((h - 6 + 24) % 24) / 24;              // day-fraction of an hour, roll at 6
      let pPrev = (simT % 55) / 55, dPrev = day;
      while (day < DAY0 + NDAYS){
        window.__warp(0.25);
        const p = (simT % 55) / 55;
        const targets = [['morning', ph(sunUp + 0.5)], ['evening', ph(sunDown + 1.0)]];
        for (const [which, pt] of targets){
          const crossed = day === dPrev ? (pPrev < pt && p >= pt) : (pPrev < pt || p >= pt);
          if (crossed) snap(which);
        }
        pPrev = p; dPrev = day;
      }
      return out;
    }, [DAY0,NDAYS]);
    for (const s of r) samples[s.which].push({ ...s, seed });
    await page.close();
  }
  const stat = a => { const s = a.slice().sort((x,y)=>x-y); const q = f => s[Math.min(s.length-1, Math.floor(f*s.length))];
    return `n=${s.length} mean ${(a.reduce((t,v)=>t+v,0)/a.length).toFixed(2)} med ${q(.5)} min ${s[0]} max ${s[s.length-1]} p10 ${q(.1)} p90 ${q(.9)}`; };
  console.log(`\n===== ${label} =====`);
  for (const which of ['morning','evening']){
    const S = samples[which];
    console.log(`\n-- ${which} (${which==='morning'?'sunUp+0.5':'sunDown+1'}) --`);
    console.log('  people on frame: ' + stat(S.map(s=>s.n)));
    const tot = {}; for (const s of S) for (const k in s.by) tot[k] = (tot[k]||0) + s.by[k];
    console.log('  per-visit mean by role: ' + Object.entries(tot).sort((a,b)=>b[1]-a[1])
      .map(([k,v])=>`${k} ${(v/S.length).toFixed(2)}`).join('  '));
    const kinds = S.map(s=>Object.keys(s.by).filter(k=>k!=='cart').length);
    console.log('  distinct errands (roles, cart excluded): ' + stat(kinds));
    console.log('  visits with 0 people ' + S.filter(s=>s.n===0).length + '/' + S.length
      + ' · <=2 ' + S.filter(s=>s.n<=2).length + ' · >=6 ' + S.filter(s=>s.n>=6).length);
    const byWarm = [['cold w<.25',s=>s.warm<.25],['mid .25-.75',s=>s.warm>=.25&&s.warm<=.75],['warm w>.75',s=>s.warm>.75]];
    for (const [nm,f] of byWarm){ const q = S.filter(f); if (q.length) console.log(`    ${nm}: ` + stat(q.map(s=>s.n))); }
  }
}
await br.close();
