/* b101 — how full does the bridge get, and is anybody out at 03h?
 * Max simultaneous holders of the deck's FAR posts (stay:1), per evening. */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i!==-1&&process.argv[i+1]?process.argv[i+1]:d;};
const FILE = process.argv[2] && !process.argv[2].startsWith('--') ? resolve(process.argv[2]) : new URL('../../../../courtyard.html', import.meta.url).pathname;
const NDAYS=+arg('--days',4), DAY0=+arg('--day0',4);
const SEEDS=[3,7,11,19,23,29,42,51,64,77];
const br = await chromium.launch(); const eves=[], late=[];
for (const seed of SEEDS){
  const page = await br.newPage({ viewport:{width:1200,height:720} });
  page.on('pageerror', e => console.log('PAGEERROR', seed, e.message));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(([DAY0,NDAYS]) => {
    window.__reseed(); window.__warp(DAY0*55 - simT);
    const per = {}, late = [];
    let lastN = -1;
    for (let i=0; day < DAY0+NDAYS; i++){
      window.__warp(0.25);
      const he = hourEve(), k = he < 6 ? day : (he >= 24 ? day - 1 : day);
      const onFar = agents.filter(a => a.eveSpot && a.eveSpot.stay && a.state === 'stand').length;
      const onDeck = agents.filter(a => a.eveSpot && a.eveSpot.deck && a.state === 'stand').length;
      per[k] = per[k] || {far:0, deck:0, band:isBandDay()};
      per[k].far = Math.max(per[k].far, onFar); per[k].deck = Math.max(per[k].deck, onDeck);
      if (he >= 27 && he < 27.3 && lastN !== day){ lastN = day;
        late.push(agents.filter(a=>a.dusk).map(a=>`${a.stay?'stay':'gate'}@(${a.x.toFixed(0)},${a.y.toFixed(0)})`)); }
    }
    return { per, late };
  }, [DAY0,NDAYS]);
  for (const k in r.per) eves.push({seed, ...r.per[k]});
  r.late.forEach(w => late.push({seed, w}));
  await page.close();
}
await br.close();
const h = {}; for (const e of eves) h[e.far] = (h[e.far]||0)+1;
console.log(`evenings: ${eves.length}; far-post max-at-once histogram: ` + Object.keys(h).sort().map(k=>`${k}:${h[k]}`).join(' '));
console.log(`  >=2 on the far end: ${eves.filter(e=>e.far>=2).length}   ==3: ${eves.filter(e=>e.far>=3).length}`);
const bd = eves.filter(e=>e.band); console.log(`  concert evenings ${bd.length}: >=2 ${bd.filter(e=>e.far>=2).length}, ==3 ${bd.filter(e=>e.far>=3).length}`);
const hd = {}; for (const e of eves) hd[e.deck]=(hd[e.deck]||0)+1;
console.log(`  whole footbridge (5 posts) max-at-once: ` + Object.keys(hd).sort().map(k=>`${k}:${hd[k]}`).join(' '));
console.log(`03h: ${late.filter(w=>w.w.length).length}/${late.length} nights hold a dusk agent` );
for (const w of late.filter(w=>w.w.length)) console.log(`   seed ${w.seed}: ${w.w.join(' ')}`);
