// hourly cafe presence histogram + noon debug, 4 seeds
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
for (const seed of [3, 7, 42, 101]){
  const p = await b.newPage({ viewport:{width:1280, height:760} });
  await p.goto(pathToFileURL(resolve('courtyard.html')).href + `?seed=${seed}&t=0&pause`); await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(() => {
    window.__reseed(); window.__warp(275); const DT = 0.05; const hist = new Array(24).fill(0), n = new Array(24).fill(0), wetH = new Array(24).fill(0);
    const noons = []; let last = -1; let arr = new Array(24).fill(0); const seen = new WeakSet(); for (const a of agents) seen.add(a);
    const lane = [];
    for (let i = 0; i < 5 * 55 / DT; i++){ window.__warp(DT); const h = Math.floor(hour);
      const sat = agents.filter(a => a.cup && a.state === 'sit' && a.tableRef).length; hist[h] += sat; n[h]++; wetH[h] += wetF() > 0.5 ? 1 : 0;
      for (const a of agents) if (!seen.has(a)){ seen.add(a); if (a.cafe && !a.with) arr[h]++; }
      if (day !== last && Math.abs(hour - 12) < 0.03){ last = day; noons.push(`d${day}@${simT.toFixed(0)} sat${sat} wet${wetF().toFixed(2)} rain${raining?1:0}`); }
      if (i % 20 === 0) lane.push(agents.filter(a => a.street && !a.east && !a.band && !a.tap && !a.homer && !a.cafe).length);
    }
    return { pres: hist.map((v, i) => (v / n[i]).toFixed(2)).join(' '), arr: arr.join(' '), wet: wetH.map((v, i) => (v / n[i]).toFixed(1)).join(' '), noons, lanePk: Math.max(...lane), sunUp: sunUp.toFixed(1), sunDown: sunDown.toFixed(1) };
  });
  console.log(`seed ${seed} sun ${r.sunUp}-${r.sunDown} lanePk(excl cafe) ${r.lanePk}\n  presence/h ${r.pres}\n  arrivals/h ${r.arr}\n  wet>0.5/h  ${r.wet}\n  ${r.noons.join(' | ')}`);
  await p.close();
}
await b.close();
