// #85 pricing (+ #89 the audience's CHOICE and a follow), run on ANY build: far-side east retirements per summer evening, and whether a walk to the
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
          const p = (a.band && typeof bandWay === 'function') ? bandWay(a) : deckPath(a); const o = { seed:0, rel:+rel.toFixed(2), day, band:!!a.band, kind:a.kind + (a.jetty ? '/jetty' : ''), x:+a.x.toFixed(1), y:+a.y.toFixed(1), path:!!p, wx: p ? p.slice(-1)[0][0] : null };
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

/* ---- #89: the audience's choice, counted AT the choice (a.band -> a.fromBand), never by presence ---- */
async function choice(seed, day0, days){
  const page = await br.newPage({ viewport:{width:1200,height:720} });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}&t=0`, { waitUntil:'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(([day0, days]) => {
    window.__reseed(); window.__warp(day0 * 55);
    const ev = {};                      // per concert evening: listeners retiring, in weather, stayed
    const tracks = [];                  // one position track per stayer (the follow)
    let lastDay = -1;
    const key = () => (hourEve() > 12 ? day : day - 1);
    for (let i = 0; i < days * 55 / 0.25; i++){ window.__warp(0.25);
      if (day !== lastDay){ lastDay = day; if (isBandDay()) ev[day] = ev[day] || {n:0, wx:0, stay:0, endWx:null}; }
      for (const a of agents){
        if (a.__seen === undefined){ a.__seen = 1; a.__wasBand = !!a.band; }
        // the retire: a listener who was standing and is now walking, or has just become a stayer
        if (a.__wasBand && !a.__ret && ((a.stopped && a.state === 'walk') || a.fromBand)){
          a.__ret = 1; const k = key(); const e = ev[k] = ev[k] || {n:0, wx:0, stay:0, endWx:null};
          e.n++; if (eveWeather()) e.wx++; if (a.fromBand){ e.stay++; a.__track = []; tracks.push({seed:0, day:k, speed:+a.speed.toFixed(2), from:[+a.x.toFixed(1), +a.y.toFixed(1)], rel:+(hourEve() - sunDown).toFixed(2), pts:a.__track, wp:a.wp.map(p => p.map(v => +v.toFixed(1)))}); }
        }
        if (a.__track && !a.__trackDone){ a.__track.push([+a.x.toFixed(2), +a.y.toFixed(2), a.state, +(hourEve() - sunDown).toFixed(2)]); if (a.stopped && a.state !== 'walk') a.__trackDone = 1; }
      }
      // the concert's end: did it fall inside the weather the evening reads?
      for (const k in ev){ if (ev[k].endWx === null && +k === day && isBandDay() && bandF() <= 0 && hour > bandEnd()) ev[k].endWx = eveWeather(); }
    }
    return { ev, tracks, BX:BANDSTAND.x, BY:BANDSTAND.y, posts:EVE_SPOTS.filter(s => s.stay).map(s => [s.x, s.y]) };
  }, [day0, days]);
  await page.close(); return r;
}
let EV = [], TR = [], G = null;
for (const seed of seeds){ const r = await choice(seed, 4, 4); G = r; for (const k in r.ev) EV.push({seed, day:+k, ...r.ev[k]}); TR.push(...r.tracks.map(t => ({...t, seed}))); }
const wx = EV.filter(e => e.endWx === true), stood = wx.filter(e => e.stay > 0);
const nAll = EV.reduce((s, e) => s + e.n, 0), nWx = EV.reduce((s, e) => s + e.wx, 0), nStay = EV.reduce((s, e) => s + e.stay, 0);
console.log(`\nCHOICE: concert evenings ${EV.length}; ended inside eveWeather ${wx.length}; a deck post stood on by the audience in ${stood.length}/${wx.length} of those (${(100*stood.length/Math.max(1,wx.length)).toFixed(0)}%); ${wx.filter(e => e.stay >= 2).length} took both posts`);
console.log(`   listeners retiring ${nAll}, ${nWx} in eveWeather, ${nStay} chose the deck (${(100*nStay/Math.max(1,nWx)).toFixed(0)}% of the in-weather choices; the two posts cap it)`);
console.log('   evenings ended OUTSIDE the weather:', EV.filter(e => e.endWx === false).length, ' stayers on those (must be 0):', EV.filter(e => e.endWx === false).reduce((s, e) => s + e.stay, 0));
// the follow: every sampled position outside the stand's stepped base (rx 2.67, ry 1.92), and the walk ends ON a post
if (TR.length){ const RX = 2.3 * 1.16, RY = RX * 0.72; let worst = 9, bad = 0, ended = 0;
  for (const t of TR){ let m = 9; for (const p of t.pts){ const d = Math.hypot((p[0] - G.BX) / RX, (p[1] - G.BY) / RY); if (d < m) m = d; } if (m < worst) worst = m; if (m < 1) bad++;
    const last = t.pts[t.pts.length - 1]; if (last && G.posts.some(q => Math.hypot(q[0] - last[0], q[1] - last[1]) < 0.7)) ended++; }
  console.log(`   FOLLOW: ${TR.length} stayers tracked; nearest approach to the stand's centre ${worst.toFixed(2)} of its base (>1 = round it, not through); ${bad} passed through; ${ended} ended standing on a post`);
  const t = TR[0]; console.log(`   one listener (seed ${t.seed}, day ${t.day}, speed ${t.speed}) chose at ${t.rel} h rel sunDown from ${t.from}; waypoints ${JSON.stringify(t.wp.slice(0, 7))}`);
  const step = Math.max(1, Math.floor(t.pts.length / 10)); console.log('   track: ' + t.pts.filter((_, i) => i % step === 0 || i === t.pts.length - 1).map(p => `${p[0]},${p[1]}@${p[3]}`).join('  '));
}
await br.close();
