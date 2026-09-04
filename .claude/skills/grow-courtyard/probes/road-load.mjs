/* probe: what is actually ON the carriageway, and how often?
 *
 * The roadway is LN_ROAD0..LN_ROAD1 over the visible width. Every 0.5 s of sim time
 * we ask the world (not the picture) what stands between those rows: the cart, the
 * dray, a cyclist, a walker crossing, and — on a candidate — the traffic. Occupancy
 * is the SHARE OF SAMPLES with at least one thing on it, split by hour band and by
 * weather, so "the road is empty" is a number.
 *
 *   node probe-road-load.mjs [file]      SEEDS=… DAYS=… STEP=…
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = resolve(process.argv[2] || fileURLToPath(new URL('../../../../courtyard.html', import.meta.url)));
const SEEDS = (process.env.SEEDS || '7,42,1234,99,5,3141').split(',').map(Number);
const DAYS = +(process.env.DAYS || 26), STEP = +(process.env.STEP || 0.5);

const browser = await chromium.launch();
const T = { n:0, occ:0, veh:0, vehOcc:0, rain:0, rainVeh:0, busyRain:0, busyRainVeh:0, busyDamp:0, busyDampVeh:0, busy:0, busyVeh:0, busyOcc:0, day:0, dayOcc:0, dayVeh:0, night:0, nightOcc:0, nightVeh:0,
            wet:0, wetOcc:0, wetVeh:0, dry:0, dryOcc:0, dryVeh:0, kinds:{} };
console.log(`${FILE.split('/').pop()}  ${SEEDS.length} seeds x ${DAYS} d, every ${STEP} s`);
console.log('seed   |  samples  occupancy  mean-on-road | wheel/samp  wheelOcc | day  night |  dry   wet');
for (const seed of SEEDS){
  const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(FILE).href + `?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.__warp === 'function');
  const r = await page.evaluate(({ step, days }) => {
    window.__reseed();
    const s = { n:0, occ:0, veh:0, vehOcc:0, on:0, rain:0, rainVeh:0, busyRain:0, busyRainVeh:0, busyDamp:0, busyDampVeh:0, busy:0, busyVeh:0, busyOcc:0, day:0, dayOcc:0, dayVeh:0, night:0, nightOcc:0, nightVeh:0,
                wet:0, wetOcc:0, wetVeh:0, dry:0, dryOcc:0, dryVeh:0, kinds:{} };
    const onRoad = (x, y) => y >= LN_ROAD0 && y < LN_ROAD1 && x >= 0 && x <= GW;
    const total = days * DAY_LEN;
    for (let t = 0; t < total; t += step){
      window.__warp(step);
      let n = 0, nv = 0;
      const bump = (k) => { s.kinds[k] = (s.kinds[k] || 0) + 1; };
      /* nv counts what is USING the road as a road — on wheels or on hooves, crossing
         it end to end. The drayman and the sweeper are on the setts but on their feet
         and going nowhere along them, so they are in n and not in nv. */
      for (const a of agents){
        if (!onRoad(a.x, a.y)) continue;
        n++;
        if (a.cycle){ nv++; bump('cyclist'); }
        else if (a.dray) bump('drayman');
        else bump(a.kind === 'sweeper' ? 'sweeper' : 'onfoot');
      }
      if (cart && onRoad(cart.x, cart.y)){ n++; nv++; bump('cart'); }
      if (typeof TRAFFIC !== 'undefined')
        for (const v of TRAFFIC) if (onRoad(v.x, v.y)){ n++; nv++; bump('rig:' + v.kind); }
      s.n++; s.on += n; s.veh += nv;
      if (n) s.occ++; if (nv) s.vehOcc++;
      const isDay = daylight > 0.15, isWet = raining || wetF() > 0.35;
      // the BUSY hour: a grown town, the sun well up, no shower — the frame the brief is about
      /* the weather bands are CONFOUNDED by the hour — showers fall in the day, so
         "in the rain" is largely a daytime sample and "dry" carries every night.
         Both weather bands below are cut INSIDE the same busy hour. */
      if (daylight > 0.6 && day >= 8){
        if (raining){ s.busyRain++; if (nv) s.busyRainVeh++; }
        else if (wetF() > 0.35){ s.busyDamp++; if (nv) s.busyDampVeh++; }
        else { s.busy++; if (nv) s.busyVeh++; if (n) s.busyOcc++; } }
      if (isDay){ s.day++; if (nv) s.dayVeh++; if (n) s.dayOcc++; } else { s.night++; if (nv) s.nightVeh++; if (n) s.nightOcc++; }
      if (raining){ s.rain++; if (nv) s.rainVeh++; }
      if (isWet){ s.wet++; if (nv) s.wetVeh++; if (n) s.wetOcc++; } else { s.dry++; if (nv) s.dryVeh++; if (n) s.dryOcc++; }
    }
    return s;
  }, { step: STEP, days: DAYS });
  if (errs.length) console.log('  PAGE ERROR', errs[0]);
  await page.close();
  const pc = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : '   – ';
  console.log(`${String(seed).padStart(6)} | ${String(r.n).padStart(8)}  ${pc(r.occ, r.n).padStart(8)}  ${(r.on / r.n).toFixed(3).padStart(11)} |` +
    ` ${(r.veh / r.n).toFixed(3).padStart(9)}  ${pc(r.vehOcc, r.n).padStart(6)} | ${pc(r.dayVeh, r.day).padStart(5)} ${pc(r.nightVeh, r.night).padStart(5)} |` +
    ` ${pc(r.dryVeh, r.dry).padStart(5)} ${pc(r.wetVeh, r.wet).padStart(5)}`);
  for (const k of ['n','occ','veh','vehOcc','rain','rainVeh','busyRain','busyRainVeh','busyDamp','busyDampVeh','busy','busyVeh','busyOcc','day','dayOcc','dayVeh','night','nightOcc','nightVeh','wet','wetOcc','wetVeh','dry','dryOcc','dryVeh']) T[k] += r[k];
  T.on = (T.on || 0) + r.on;
  for (const k in r.kinds) T.kinds[k] = (T.kinds[k] || 0) + r.kinds[k];
}
await browser.close();
const pc = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : '–';
console.log('-'.repeat(96));
console.log(`POOLED ${T.n} samples · anything on the roadway ${pc(T.occ, T.n)} · mean ${(T.on / T.n).toFixed(3)}`);
console.log(`       something ON WHEELS ${pc(T.vehOcc, T.n)} · mean ${(T.veh / T.n).toFixed(3)} per sample`);
console.log(`       by hour: day ${pc(T.dayVeh, T.day)}  night ${pc(T.nightVeh, T.night)} · by sky: dry ${pc(T.dryVeh, T.dry)}  damp ${pc(T.wetVeh, T.wet)}  IN THE RAIN ${pc(T.rainVeh, T.rain)} (${T.rain} samples)`);
console.log(`       BUSY HOUR (daylight>0.6, day>=8, dry, ${T.busy} samples): on wheels ${pc(T.busyVeh, T.busy)} · anything ${pc(T.busyOcc, T.busy)}`);
console.log(`       SAME HOUR, wet: damp ${pc(T.busyDampVeh, T.busyDamp)} (${T.busyDamp})  ·  raining ${pc(T.busyRainVeh, T.busyRain)} (${T.busyRain})`);
console.log('       what it was: ' + Object.entries(T.kinds).sort((a,b) => b[1]-a[1])
  .map(([k, v]) => `${k} ${(100*v/T.n).toFixed(2)}%`).join(' · '));
