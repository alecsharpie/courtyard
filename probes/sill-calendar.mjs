#!/usr/bin/env node
/* sill-calendar.mjs — is the bottom of the frame a different picture in February and
 * in July, and is the difference legible at the shipping size?
 *
 * The sill is a draw-only vector: the census cannot see it (no new R(), no town
 * state), so the claim has to be a measured one. Four questions:
 *
 *   1. YEAR      Feb vs July at ONE seed, size and hour — mass in the sill band, on
 *                HEAD and on this build. HEAD is the control that differs in exactly
 *                one way; a same-code pair is the floor and must read 0.
 *   2. WEATHER   dry vs wet vs snow at one instant, same clock.
 *   3. CONTAIN   NEW vs HEAD ABOVE the band must be 0 px: nothing outside drawSill
 *                may have moved.
 *   4. CURVES    the year's terms and the cup's share, histogrammed over seeds — a
 *                per-day hash is one sample of the calendar in every world, so the
 *                cup is salted and the salt is checked.
 *
 * Everything is drawn with the dt PINNED at 0 and read in the same evaluate.
 */
import path from 'path'; import { homedir } from 'node:os'; import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
const PW = path.join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const REPO = path.resolve(new URL('.', import.meta.url).pathname, '..');
const HEAD = '/tmp/head-courtyard.html';
execSync(`git -C ${REPO} show HEAD:courtyard.html > ${HEAD}`);   // regenerated: a stale fixture is not a control
const NEW = path.join(REPO, 'courtyard.html');

const DAY = 55, YEAR = 26 * DAY;
// the clock that lands on a phase AND an hour: the within-day fraction is pinned first
// (day rolls at 6), then the whole days are chosen to put seasonPhase where we asked.
function simTFor(phase, hour){
  const f = (((hour - 6) % 24) + 24) % 24 / 24;
  const want = (((phase - 0.25) % 1) + 1) % 1 * YEAR;
  return Math.round((want - f * DAY) / DAY) * DAY + f * DAY;
}
const FEB = 0.125, JUL = 0.54;          // mid-February and mid-July, phase 0 = midwinter

const br = await chromium.launch();
let bad = 0;
const ok = (c, s) => { console.log((c ? '  ok   ' : '  FAIL ') + s); if (!c) bad++; };

/* grab: the whole canvas, plus where the sill band starts, at a pinned world. */
async function grab(file, w, h, T, seed, weather, light){
  const p = await br.newPage(); await p.setViewportSize({ width: w, height: h });
  await p.goto('file://' + path.resolve(file) + `?seed=${seed}&t=0&pause`);
  await p.waitForFunction(() => !!window.__census);
  const out = await p.evaluate(({ T, weather, light }) => {
    __reseed(); __setTime(T);
    if (weather){ snowCover = weather.snow || 0; wetness = weather.wet || 0; wind = weather.wind == null ? -1 : weather.wind; }
    if (light != null) daylight = light;      // hold the LIGHT still, so what is left is the YEAR
    groundDirty = true;                       // drawSill lives in the cache: it must be repainted
    drawScene(0, 0); groundDirty = true; drawScene(0, 0);
    const u = sillU(), sy = sillTop();
    return { px: Array.from(ctx.getImageData(0, 0, cv.width, cv.height).data),
             w: cv.width, h: cv.height, dpr: DPR,
             band: Math.max(0, Math.floor((sy - u * 4.4) * DPR)),
             strip: Math.max(0, Math.ceil(sy * DPR) + 1),          // rows the sill owns OUTRIGHT
             read: { phase: +season().toFixed(4), hour: +hour.toFixed(2), day, light: +daylight.toFixed(3),
                     // HEAD has none of these: the fixture is the build WITHOUT the year
                     leaf: typeof gerLeaf === 'function' ? +gerLeaf().toFixed(3) : null,
                     bloom: typeof gerBloom === 'function' ? +gerBloom().toFixed(3) : null,
                     frost: typeof sillFrost === 'function' ? +sillFrost().toFixed(3) : null,
                     wet: typeof sillWet === 'function' ? +sillWet().toFixed(3) : null,
                     snow: typeof sillSnow === 'function' ? +sillSnow().toFixed(3) : null,
                     cup: typeof sillCup === 'function' ? sillCup() : null } };
  }, { T, weather: weather || null, light: light == null ? null : light });
  await p.close(); return out;
}
// mass = pixels whose max channel delta clears 6 (the eye's floor on a dark band), and
// the mean |delta| over the region, so a wide faint change and a narrow loud one separate
function diff(A, B, y0, y1){
  let mass = 0, sum = 0, n = 0, peak = 0;
  for (let y = y0; y < y1; y++) for (let x = 0; x < A.w; x++){
    const i = (y * A.w + x) * 4;
    const d = Math.max(Math.abs(A.px[i] - B.px[i]), Math.abs(A.px[i+1] - B.px[i+1]), Math.abs(A.px[i+2] - B.px[i+2]));
    if (d > 6) mass++;
    sum += d; n++; if (d > peak) peak = d;
  }
  return { mass, mean: +(sum / n).toFixed(2), peak };
}

/* ---- 1. the year, and 3. containment ------------------------------------------ */
for (const [w, h, label] of [[1200, 720, 'desktop 1200x720'], [1600, 950, 'wide 1600x950'], [390, 844, 'mobile 390x844']]){
  console.log(`\n=== ${label} · seed 7 · hour 17.0 pinned, February vs July ===`);
  const Tf = simTFor(FEB, 17), Tj = simTFor(JUL, 17);
  const hf = await grab(HEAD, w, h, Tf, 7), hj = await grab(HEAD, w, h, Tj, 7);
  const nf = await grab(NEW,  w, h, Tf, 7), nj = await grab(NEW,  w, h, Tj, 7);
  const nf2 = await grab(NEW, w, h, Tf, 7);                       // the same-code floor
  const y0 = nf.band, y1 = nf.h, s0 = nf.strip;
  console.log(`  phase ${nf.read.phase} (leaf ${nf.read.leaf} bloom ${nf.read.bloom} frost ${nf.read.frost} light ${nf.read.light})`
            + ` -> ${nj.read.phase} (leaf ${nj.read.leaf} bloom ${nj.read.bloom} frost ${nj.read.frost} light ${nj.read.light})`);
  console.log(`  band rows ${y0}..${y1} of ${nf.h}  (${((y1 - y0) / nf.h * 100).toFixed(1)}% of the frame);  the strip the sill owns outright: ${s0}..${y1}`);
  // (a) the headline the brief asked for: the two pictures, against a same-code floor
  const dh = diff(hf, hj, y0, y1), dn = diff(nf, nj, y0, y1), dc = diff(nf, nf2, y0, y1);
  console.log(`  Feb v Jul   HEAD mass ${dh.mass} mean ${dh.mean} peak ${dh.peak}`);
  console.log(`  Feb v Jul   NEW  mass ${dn.mass} mean ${dn.mean} peak ${dn.peak}`);
  console.log(`  Feb v Jul   CTRL mass ${dc.mass} mean ${dc.mean} peak ${dc.peak}`);
  ok(dc.mass === 0, 'same-code control reads 0 in the band');
  /* (b) but HEAD is not zero there: the band contains TOWN as well as sill (the pots
   * stand in front of the near roof) and daylight at 17.00 is not the same in February
   * as in July. So the isolation is NEW against HEAD at ONE instant — same seed, same
   * clock, same town, and the census says no R() moved, so every pixel that differs is
   * a pixel drawSill drew. */
  const iF = diff(nf, hf, y0, y1), iJ = diff(nj, hj, y0, y1);
  console.log(`  NEW v HEAD  @Feb mass ${iF.mass} mean ${iF.mean} peak ${iF.peak}   @Jul mass ${iJ.mass} mean ${iJ.mean} peak ${iJ.peak}`);
  /* the winter ledge is nearly all of it, and that is the DESIGN: HEAD's fixed
   * nine-leaf plant already was the summer one, so July gains flower heads and little
   * else while February gains a cut-back plant, a rime and a snow lip. */
  ok(iJ.mass > 0 && iF.mass > iJ.mass * 3, `the winter ledge is the one that was missing (${iF.mass} px v July's ${iJ.mass})`);
  const above = diff(nf, hf, 0, y0);
  console.log(`  ABOVE the band, NEW v HEAD: mass ${above.mass} peak ${above.peak}`);
  ok(above.mass === 0, 'nothing above the sill band moved (no draw-order regression)');
  /* (c) and the same question with the LIGHT held still. drawSill on HEAD is a pure
   * function of `daylight`, so pinning it takes the day out of the comparison — but
   * NOT the year: the strip is composited under applyLight, whose sun colour and
   * warmth are seasonal, and HEAD's strip still moves 10.6k px on that alone. What the
   * new build adds ON TOP of that floor is the ledge itself. */
  const L = 0.46;
  const hfL = await grab(HEAD, w, h, Tf, 7, null, L), hjL = await grab(HEAD, w, h, Tj, 7, null, L);
  const nfL = await grab(NEW,  w, h, Tf, 7, null, L), njL = await grab(NEW,  w, h, Tj, 7, null, L);
  const dhL = diff(hfL, hjL, s0, y1), dnL = diff(nfL, njL, s0, y1);
  console.log(`  light PINNED at ${L}, strip only:  HEAD Feb v Jul mass ${dhL.mass} (mean ${dhL.mean})   NEW mass ${dnL.mass} (mean ${dnL.mean} peak ${dnL.peak})`);
  ok(dnL.mass > dhL.mass * 1.3, `with the light pinned the strip still moves ${dnL.mass} px v HEAD's ${dhL.mass} (the composite's own season)`);
}

/* ---- 2. the weather on the stone ---------------------------------------------- */
{
  console.log('\n=== the weather, 1200x720, seed 7, one instant (phase 0.125, hour 11) ===');
  const T = simTFor(FEB, 11);
  const dry  = await grab(NEW, 1200, 720, T, 7, { snow: 0,   wet: 0,   wind: 0.2 });
  const wet  = await grab(NEW, 1200, 720, T, 7, { snow: 0,   wet: 1.0, wind: 0.9 });
  const snow = await grab(NEW, 1200, 720, T, 7, { snow: 0.7, wet: 0,   wind: 0.2 });
  const dry2 = await grab(NEW, 1200, 720, T, 7, { snow: 0,   wet: 0,   wind: 0.2 });
  const y0 = dry.band, y1 = dry.h;
  console.log(`  landed: dry(frost ${dry.read.frost} wet ${dry.read.wet} snow ${dry.read.snow})`
            + ` wet(frost ${wet.read.frost} wet ${wet.read.wet})  snow(snow ${snow.read.snow})`);
  ok(wet.read.wet > 0.5 && snow.read.snow > 0.5 && dry.read.wet === 0, 'the weather LANDED on the sill terms');
  const dw = diff(dry, wet, y0, y1), ds = diff(dry, snow, y0, y1), dc = diff(dry, dry2, y0, y1);
  console.log(`  dry v wet    mass ${dw.mass}  mean ${dw.mean}  peak ${dw.peak}`);
  console.log(`  dry v snow   mass ${ds.mass}  mean ${ds.mean}  peak ${ds.peak}`);
  console.log(`  CTRL         mass ${dc.mass}  mean ${dc.mean}  peak ${dc.peak}`);
  ok(dc.mass === 0, 'same-code weather control reads 0');
  ok(dw.mass > 2000 && ds.mass > 2000, 'rain and snow are each legible in the band');
}

/* ---- 4. the curves and the cup ------------------------------------------------- */
{
  console.log('\n=== the year, sampled every day, and the cup\'s share ===');
  const p = await br.newPage(); await p.setViewportSize({ width: 1200, height: 720 });
  const perSeed = [];
  for (const seed of [7, 42, 101, 2024, 5150, 88]){
    await p.goto('file://' + NEW + `?seed=${seed}&t=0&pause`);
    await p.waitForFunction(() => !!window.__census);
    perSeed.push(await p.evaluate(() => {
      const rows = [], cupBy = [0, 0, 0, 0], nBy = [0, 0, 0, 0];
      for (let d = 0; d < 26 * 4; d++){
        __setTime(d * 55 + 24);
        const q = Math.min(3, Math.floor(season() * 4));
        nBy[q]++; if (sillCup()) cupBy[q]++;
        if (d < 26) rows.push([+season().toFixed(3), +gerLeaf().toFixed(2), +gerBloom().toFixed(2), +gerDrop().toFixed(2), +sillFrost().toFixed(2)]);
      }
      return { rows, cupBy, nBy, salt: WIND_SALT };
    }));
  }
  const s0 = perSeed[0];
  console.log('  phase  leaf bloom drop frost   (seed 7, one year)');
  for (const r of s0.rows) console.log(`  ${r[0].toFixed(3)}  ${r[1].toFixed(2)} ${r[2].toFixed(2)} ${r[3].toFixed(2)}  ${r[4].toFixed(2)}`);
  const leafs = s0.rows.map(r => r[1]), blooms = s0.rows.map(r => r[2]);
  ok(Math.min(...leafs) <= 0.12 && Math.max(...leafs) >= 0.99, `leaf spans ${Math.min(...leafs)}..${Math.max(...leafs)}`);
  ok(Math.min(...blooms) === 0 && Math.max(...blooms) >= 0.95, `bloom spans ${Math.min(...blooms)}..${Math.max(...blooms)} and is 0 for part of the year`);
  console.log('  cup, share of days by quarter (winter/spring/summer/autumn), per seed:');
  const sums = [0, 0, 0, 0], ns = [0, 0, 0, 0];
  for (let i = 0; i < perSeed.length; i++){
    const s = perSeed[i];
    console.log(`    salt ${String(s.salt).padStart(5)}  ` + s.cupBy.map((c, q) => (c / s.nBy[q]).toFixed(2)).join('  '));
    s.cupBy.forEach((c, q) => { sums[q] += c; ns[q] += s.nBy[q]; });
  }
  const share = sums.map((c, q) => c / ns[q]);
  console.log('    pooled       ' + share.map(x => x.toFixed(2)).join('  '));
  ok(share[0] > share[2] + 0.15, `the cup is likelier in the cold: winter ${share[0].toFixed(2)} v summer ${share[2].toFixed(2)}`);
  const distinct = new Set(perSeed.map(s => s.cupBy.join(','))).size;
  ok(distinct > 1, `the calendar differs per world (${distinct} distinct of ${perSeed.length}) — the salt is live`);
  await p.close();
}

/* ---- 5. the names -------------------------------------------------------------- */
{
  console.log('\n=== c282: the pointer has a word for what is on the ledge ===');
  const p = await br.newPage(); await p.setViewportSize({ width: 1200, height: 720 });
  await p.goto('file://' + NEW + '?seed=7&t=0&pause');
  await p.waitForFunction(() => !!window.__census);
  const rows = await p.evaluate(({ FEB, JUL, DAY, YEAR }) => {
    const at = (phase, hour, w) => {
      const f = (((hour - 6) % 24) + 24) % 24 / 24;
      const want = (((phase - 0.25) % 1) + 1) % 1 * YEAR;
      __setTime(Math.round((want - f * DAY) / DAY) * DAY + f * DAY);
      if (w){ snowCover = w.snow || 0; wetness = w.wet || 0; }
      const sy = sillTop(), b = sillBoxes();
      const pot = [b[1][0] + b[1][2] / 2, b[1][1] + b[1][3] * 0.5];
      const cup = [b[3][0] + b[3][2] * 0.3, b[3][1] + b[3][3] * 0.5];
      const band = [W * 0.5, sy + (H - sy) * 0.5];
      return { pot: lookAt(pot), cup: lookAt(cup), band: lookAt(band), cupOut: sillCup() };
    };
    return { feb: at(FEB, 18), jul: at(JUL, 8), snowy: at(FEB, 11, { snow: 0.6 }), wet: at(0.4, 11, { wet: 1 }) };
  }, { FEB, JUL, DAY, YEAR });
  for (const k of Object.keys(rows)) console.log(`  ${k.padEnd(6)} pot: ${rows[k].pot}\n         band: ${rows[k].band}\n         cup(${rows[k].cupOut}): ${rows[k].cup}`);
  ok(/geranium/.test(rows.feb.pot) && /geranium/.test(rows.jul.pot), 'both pots are named');
  ok(rows.feb.pot !== rows.jul.pot, 'and the name reads the year');
  ok(/windowsill/.test(rows.feb.band) && /snow/.test(rows.snowy.band) && /rain/.test(rows.wet.band), 'the ledge itself is named, and reads the weather');
  await p.close();
}

await br.close();
console.log(bad ? `\n${bad} FAILED` : '\nall ok');
process.exit(bad ? 1 : 0);
