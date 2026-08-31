// #90 — lane traffic by END (W/E/N/inside) counted at spawn and despawn, never by presence, plus the window's cart trips.
// On HEAD it priced b88 false: entries W 40 / E 32 / N 13, exits W 26 / E 18 / N 19 over 10 seeds x 4 days.
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
    const end = (x, y) => x < 0 ? 'W' : x > GW ? 'E' : y < 0 ? 'N' : 'in';
    const live = new Map(); const rows = []; const cartRows = []; let cartLast = null;
    const isLane = a => a.street && !a.east && !a.tap && !a.homer && !a.cafe && !a.dusk && !a.band && !a.loader && a.kind !== 'sweeper' && a.kind !== 'allot';
    for (let i = 0; i < days * 55 / 0.25; i++){ window.__warp(0.25);
      const seen = new Set();
      for (const a of agents){ let r = live.get(a); if (!r && !isLane(a)) continue; seen.add(a);
        if (!r){ r = { kind:a.kind, inEnd:end(a.x, a.y), x0:+a.x.toFixed(1), stopX: a.stop ? +a.stop.x.toFixed(1) : null, day, hour:+hour.toFixed(1) }; live.set(a, r); }
        r.lx = a.x; r.ly = a.y; r.kind = a.kind; if (a.stop) r.stopX = +a.stop.x.toFixed(1);
        r.flags = (a.tap?'tap ':'')+(a.home?'home ':'')+(a.dusk?'dusk ':'')+(a.with?'with ':'')+(a.done?'done ':''); }
      for (const [a, r] of live) if (!seen.has(a)){ r.outEnd = end(r.lx, r.ly); r.lx = +r.lx.toFixed(1); rows.push(r); live.delete(a); }
      if (cart){ cartLast = { x:cart.x, y:cart.y, out:cart.out, day, mkt:(cartLast&&cartLast.mkt)||marketActive(), reached:(cartLast&&cartLast.reached)||cart.at==='market' }; }
      else if (cartLast){ cartRows.push({ ...cartLast, end:end(cartLast.x, cartLast.y) }); cartLast = null; }
    }
    return { rows, cartRows };
  }, [day0, days]);
  await page.close(); return r;
}
const seeds = [1,2,3,4,5,6,7,8,9,10]; let R = [], C = [];
for (const seed of seeds){ const r = await run(seed, 4, 4); R.push(...r.rows.map(x => ({...x, seed}))); C.push(...r.cartRows.map(x => ({...x, seed}))); }
await br.close();
const cnt = (arr, f) => { const h = {}; for (const r of arr){ const k = f(r); h[k] = (h[k]||0)+1; } return h; };
console.log(`lane walkers completed (spawn->despawn) over 10 seeds x 4 days: ${R.length}`);
console.log('ENTRY by end:', cnt(R, r => r.inEnd));
console.log('EXIT  by end:', cnt(R, r => r.outEnd));
console.log('entry->exit  :', cnt(R, r => r.inEnd + '>' + r.outEnd));
console.log('by kind, entry end:'); const byK = {}; for (const r of R){ byK[r.kind] = byK[r.kind] || {}; byK[r.kind][r.inEnd+'>'+r.outEnd] = (byK[r.kind][r.inEnd+'>'+r.outEnd]||0)+1; }
for (const k of Object.keys(byK).sort()) console.log('  ', k.padEnd(11), JSON.stringify(byK[k]));
// the brief's second clause: leavers whose LAST STOP is east of the cross street (x > 64) and who leave by the WEST end
const eastStop = R.filter(r => r.stopX != null && r.stopX > 64);
console.log(`stopped east of x 64: ${eastStop.length}; of those exiting W: ${eastStop.filter(r=>r.outEnd==='W').length}, E: ${eastStop.filter(r=>r.outEnd==='E').length}, N: ${eastStop.filter(r=>r.outEnd==='N').length}`);
console.log(`  from E and stopped east, then exit W (the whole lane back): ${eastStop.filter(r=>r.inEnd==='E'&&r.outEnd==='W').length}`);
const odd = R.filter(r => r.inEnd === 'in' || r.outEnd === 'in'); console.log('spawn/despawn INSIDE frame:', odd.length, odd.slice(0,12).map(r=>`${r.kind}@${r.x0}->${r.lx},${(+r.ly).toFixed(1)}[${r.flags}]`).join(' '));
console.log(`cart trips: ${C.length}; exits by end:`, cnt(C, c => c.end), ' market active during trip:', C.filter(c=>c.mkt).length, ' reached market stop:', C.filter(c=>c.reached).length);
console.log('cart trips:', C.map(c=>`s${c.seed}d${c.day}${c.mkt?'M':''}${c.reached?'R':''}>${c.end}`).join(' '));
