#!/usr/bin/env node
/* punt-force — b94 / #96: the machinery proof. Natural jetty stands land at 17:30+
 * (the walk from the east gates is ~12 h sim), so the choice almost never fires on
 * its own; this drives one crossing end-to-end and watches every transition.
 *
 *   node punt-force.mjs [--seed 42] [--hour 10] [--late] [--shots]
 *
 * Manufactures a jetty-bound east visitor (spawnEastAgent until one rolls a.jetty),
 * places them at the towpath end of the deck walk at --hour, and runs. Asserts:
 * leg cycle 0→1→2→3→4→0, one announce at push-off, the rider a.eyot standing at
 * PUNT_STAND, no rider step on open water while walking (on turf / jetty / within
 * 0.9 of mooring or landing), swans ≥ 0.9 from the landing while the punt lies
 * there, punt y never under DECK rows, and the retrace resumes after. --late picks
 * an hour where the drawn stay outruns eastOpen()'s close: the retire rule must cut
 * the stand and the punt must still bring them home (dusk return, no stranding).
 * --shots writes shots/b94-punt-{push,channel,willow}.png along the way.
 */
import { homedir } from 'node:os'; import { join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = new URL('../../../../courtyard.html', import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? +process.argv[i + 1] : d; };
const SEED = arg('--seed', 42), LATE = process.argv.includes('--late'), HOUR = arg('--hour', LATE ? 16.8 : 10), SHOTS = process.argv.includes('--shots');
const br = await chromium.launch();
const p = await br.newPage({ viewport:{width:1600, height:950}, deviceScaleFactor:arg('--dsf', 1) });
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto(pathToFileURL(FILE).href + `?pause&seed=${SEED}`, { waitUntil:'load' });
await p.waitForFunction(() => typeof window.__warp === 'function');

const setup = await p.evaluate(`(() => {
  const uc = updateClock; updateClock = function(){ uc(); wind = 0; raining = false; rainFall = 0; };
  const an0 = announce; window.__said = []; announce = function(t, ...r){ if (/punt/i.test(t)) __said.push({h:+hour.toFixed(2), t}); return an0(t, ...r); };
  window.__reseed(); window.__warp(5 * 55 - simT);
  while (hour < ${HOUR}) window.__warp(0.1);
  let a = null, tries = 0;
  while (!a && tries++ < 300){ spawnEastAgent(false, false); const c = agents[agents.length - 1];
    if (c.jetty && !c.with && !c.pairLead) a = c; else agents.pop(); }
  if (!a) return {fail:'no jetty roll in 300 spawns'};
  a.x = TOW_WALK; a.y = JETTY.y + 1.3;
  a.i = a.wp.findIndex(q => q[0] === a.stop.x && q[1] === a.stop.y);
  window.__R = a; window.__T = {legs:[{leg:0, h:+hour.toFixed(2)}], waterWalk:[], swanMin:9, swanNear:0,
    yMin:99, yMax:-99, stand:null, standH:[null, null], fits:null};
  return {ok:1, hour:+hour.toFixed(2), speed:+a.speed.toFixed(2), wary:+a.wary.toFixed(2),
          close:+eastCloseHour().toFixed(2), trip:+puntTripH(a).toFixed(2), stay:+puntStayH(a).toFixed(2)};
})()`);
console.log('setup:', JSON.stringify(setup));
if (setup.fail){ await br.close(); process.exit(1); }

const stepUntil = cond => p.evaluate(`(() => {
  const T = window.__T, a = window.__R;
  const near = (x, y, px, py, r) => Math.hypot(x - px, y - py) < r;
  let guard = 0;
  while (guard++ < 12000){
    window.__warp(0.1);
    if (punt.leg !== T.legs[T.legs.length - 1].leg) T.legs.push({leg:punt.leg, h:+hour.toFixed(2), y:+punt.y.toFixed(1)});
    if (T.fits === null && a.stopped) T.fits = punt.rider === a;
    if (punt.leg === 2 || punt.leg === 4){ T.yMin = Math.min(T.yMin, punt.y); T.yMax = Math.max(T.yMax, punt.y); }
    if (a.state === 'walk' && a.x < 128 && a.y > 33 && !a.aboard){
      const legal = onEyot(a.x, a.y) || onJetty(a.x, a.y) || a.y < 36.4
        || near(a.x, a.y, PUNT_MOOR.x, PUNT_MOOR.y, 0.9) || near(a.x, a.y, PUNT_LAND.x, PUNT_LAND.y, 0.9)
        || Math.hypot(a.x - punt.x, a.y - punt.y) < 0.9;
      if (!legal && T.waterWalk.length < 5) T.waterWalk.push({h:+hour.toFixed(2), x:+a.x.toFixed(1), y:+a.y.toFixed(1), i:a.i});
    }
    if (a.eyot && a.state === 'stand' && !T.stand){ T.stand = {x:+a.x.toFixed(2), y:+a.y.toFixed(2)}; T.standH[0] = +hour.toFixed(2); }
    if (T.standH[0] !== null && T.standH[1] === null && a.state === 'walk' && a.eyot) T.standH[1] = +hour.toFixed(2);
    if (puntAtShore()) for (const s of swans){ const d = Math.hypot(s.x - PUNT_LAND.x, s.y - PUNT_LAND.y);
      T.swanMin = Math.min(T.swanMin, +d.toFixed(2)); if (d < 0.9) T.swanNear++; }
    if (T.fits === false) return {refused:1, h:+hour.toFixed(2)};
    if (${cond}) return {done:1, h:+hour.toFixed(2), leg:punt.leg, ax:+a.x.toFixed(1), ay:+a.y.toFixed(1), st:a.state};
  }
  return {done:0, h:+hour.toFixed(2), leg:punt.leg, ax:+a.x.toFixed(1), ay:+a.y.toFixed(1), st:a.state, i:a.i, wp:a.wp.length};
})()`);

const shoot = async name => {
  const clip = await p.evaluate(`(() => {
    drawScene(simT, 1/30);
    const r = document.querySelector('canvas').getBoundingClientRect();
    const a = project(120, 30, 0), c = project(131, 52, 0);
    return {x:r.x + a[0], y:r.y + a[1] - 60, w:c[0] - a[0], h:c[1] - a[1] + 70};
  })()`);
  const f = `shots/b94-punt-${name}.png`;
  await p.screenshot({path:f, clip:{x:clip.x, y:clip.y, width:clip.w, height:clip.h}});
  console.log('shot ->', f);
};

const bail = r => { if (r.refused){ console.log('REFUSED at the choice — pick another --hour'); process.exit(2); } return r; };
console.log('to push-off:', JSON.stringify(bail(await stepUntil('punt.leg === 2 && punt.rider === __R'))));
if (SHOTS) await shoot('push');
console.log('to mid-channel:', JSON.stringify(await stepUntil('punt.rider === __R && (punt.leg === 2 && punt.y > 39.2 || punt.leg > 2)')));
if (SHOTS) await shoot('channel');
console.log('to the stand:', JSON.stringify(await stepUntil("punt.leg === 3 && __R.state === 'stand'")));
if (SHOTS) await shoot('willow');
console.log('home:', JSON.stringify(await stepUntil('punt.rider !== __R && !__R.aboard && !__R.eyot')));
console.log('retrace:', JSON.stringify(await stepUntil('__R.done || __R.x > 128.5 || __R.y < 32')));

const T = await p.evaluate(`(() => { const T = window.__T, a = window.__R;
  return {...T, said:window.__said, eastOpenNow:eastOpen(), close:+eastCloseHour().toFixed(2),
          riderEyot:!!a.eyot, riderAboard:!!a.aboard, h:+hour.toFixed(2)}; })()`);
console.log('\ntrace:', JSON.stringify(T, null, 1));
const legs = T.legs.map(l => l.leg).join('');
const ok = legs.includes('01234') && legs.endsWith('0') && T.waterWalk.length === 0 && T.said.length === 1
  && T.stand && Math.hypot(T.stand.x - 125.35, T.stand.y - 46.4) < 0.4
  && T.swanNear === 0 && T.yMin > 33 && !T.riderEyot && !T.riderAboard;
console.log(ok ? '\nVERDICT: PASS' : '\nVERDICT: FAIL');
await br.close();
process.exit(ok ? 0 : 1);
