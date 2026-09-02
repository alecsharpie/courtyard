#!/usr/bin/env node
/* #113 — does pointing at a bird name a bird?
 *
 *   node probe-birds.mjs [--file courtyard.html] [--json]
 *
 * For a matrix of pinned (seed, warped instant), every bird the town is drawing is
 * projected to its own screen point and lookAt() is asked what is there. A bird is
 * ANSWERED if the line names a bird or a pigeon, BLOCKED if something else living
 * sorts in front of it (a legitimate answer — painter's order), SILENT otherwise.
 * Runs against any build, so HEAD is the control: on HEAD only b.roof birds answer.
 *
 * Also sweeps the five quarter cameras at one instant, and taps a bird on a 390x844
 * touch page (no hover) to prove the phone path names it too.
 */
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const FILE = resolve(arg('--file', 'courtyard.html'));
if (!existsSync(FILE)) { console.error('no such file', FILE); process.exit(2); }
const PAGE = pathToFileURL(FILE).href;

/* day (lawn, lane, plaza bands are open), dusk, night (the roof roosts) */
const INSTANTS = [];
for (const seed of [7, 42, 1234]) for (const w of [96, 118, 140, 300, 320, 640, 660])
  INSTANTS.push({ seed, warp: w });

/* what lookAt says at a bird's own projected point, per bird */
const SAMPLE = `(() => {
  const out = [];
  for (const b of birds){
    const p = project(b.x, b.y, b.z || 0);
    const kind = b.roof ? 'roof' : b.plaza ? 'plaza' : b.state === 'wheel' ? 'belfry'
               : (b.y > LN_ROAD0 - 1 && b.y < LN_WALK_S) ? 'lane' : 'other';
    out.push({ kind, perch: b.perch || '', state: b.state, x: b.x, y: b.y, z: b.z,
               px: p[0], py: p[1], name: lookAt(p) || '' });
  }
  return out;
})()`;

const isBird = s => /\b(bird|pigeon|blackbird|starlings)\b/i.test(s);
const tally = rows => {
  const t = {};
  for (const r of rows){
    const k = r.kind, c = t[k] || (t[k] = { n: 0, answered: 0, blocked: 0, silent: 0, lines: new Set() });
    c.n++;
    if (isBird(r.name)) { c.answered++; c.lines.add(r.name); }
    else if (r.name) c.blocked++;
    else c.silent++;
  }
  return t;
};

const b = await chromium.launch();
const errs = [];
const rows = [];
for (const { seed, warp } of INSTANTS){
  const p = await b.newPage({ viewport: { width: 1280, height: 700 } });
  p.on('pageerror', e => errs.push(`${seed}@${warp}: ${e}`));
  await p.goto(`${PAGE}?seed=${seed}&t=0&pause`);
  await p.waitForTimeout(220);
  const r = await p.evaluate(([w, src]) => {
    window.__reseed(); window.__warp(w);
    drawScene(simT, 1 / 30);            // __warp never draws: pin the frame's projection
    return eval(src);
  }, [warp, SAMPLE]);
  rows.push(...r.map(x => ({ ...x, seed, warp })));
  await p.close();
}

/* the belfry flock: warp in small steps until the bell has just put one up */
let belfry = [];
{
  const p = await b.newPage({ viewport: { width: 1280, height: 700 } });
  p.on('pageerror', e => errs.push('belfry: ' + e));
  await p.goto(`${PAGE}?seed=7&t=0&pause`);
  await p.waitForTimeout(220);
  belfry = await p.evaluate(src => {
    window.__reseed();
    for (let i = 0; i < 900; i++){
      window.__warp(0.4);
      if (birds.some(b => b.state === 'wheel')){
        drawScene(simT, 1 / 30);
        return eval(src);
      }
    }
    return [];
  }, SAMPLE);
  await p.close();
}

/* the five quarter cameras, at one instant that has birds in several bands */
const cams = {};
for (const q of [0, 1, 2, 3, 4]){
  const p = await b.newPage({ viewport: { width: 1280, height: 700 } });
  p.on('pageerror', e => errs.push(`cam${q}: ${e}`));
  await p.goto(`${PAGE}?seed=42&t=0&pause`);
  await p.waitForTimeout(220);
  cams[q] = await p.evaluate(([qq, src]) => {
    window.__reseed(); window.__warp(118);
    window.__where(qq, 2);                       // snap the ease to the destination
    drawScene(simT, 1 / 30);
    return { name: QUARTERS[qq].name, rows: eval(src) };
  }, [q, SAMPLE]);
  await p.close();
}

/* The POINTER PATH, end to end: the mouse is moved to where the bird is DISPLAYED
 * (canvas coords scaled into the element's box, which is what the eye sees) and the
 * page's own evPx -> hoverPx -> lookAt chain is asked what is under it. On HEAD this
 * is the control for #113's evPx fix: the same displayed point, a different answer. */
const point = [];
{
  const p = await b.newPage({ viewport: { width: 1280, height: 700 } });
  p.on('pageerror', e => errs.push('point: ' + e));
  await p.goto(`${PAGE}?seed=42&t=0&pause`);
  await p.waitForTimeout(220);
  const targets = await p.evaluate(src => {
    window.__reseed(); window.__warp(118); drawScene(simT, 1 / 30);
    const r = cv.getBoundingClientRect();
    return eval(src).filter(t => t.px > 6 && t.px < W - 6 && t.py > 6 && t.py < sillTop())
      .map(t => ({ ...t, sx: r.left + t.px * r.width / W, sy: r.top + t.py * r.height / H }));
  }, SAMPLE);
  for (const t of targets){
    await p.mouse.move(t.sx, t.sy); await p.waitForTimeout(25);
    const got = await p.evaluate(() => lookAt(hoverPx) || '');
    point.push({ kind: t.kind, want: t.name, got });
  }
  await p.close();
}

/* the phone: no hover, so the TAP has to do the naming. Only birds the phone's frame
 * actually SHOWS are tappable — the wide view leans in at FOCUS 54 and the plaza is off
 * the side of it — so the quarters are driven too, to reach the bands that live east. */
const taps = [];
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  /* ONE tap per page. Two taps on the same mobile page 320 ms apart are a DOUBLE TAP —
   * the second lands after the browser has zoomed and names the ground beside the bird,
   * which reads exactly like a hit-test bug and is not one (the instrument first). */
  const open = async (seed, q) => {
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(`tap${seed}: ${e}`));
    await p.goto(`${PAGE}?seed=${seed}&t=0&pause`);
    await p.waitForTimeout(200);
    const t = await p.evaluate(([src, qq]) => {
      window.__reseed(); window.__warp(118); window.__where(qq, 2); drawScene(simT, 1 / 30);
      const r = cv.getBoundingClientRect();
      return { hovers: HOVERS, rows: eval(src)
        .filter(t => t.px > 8 && t.px < W - 8 && t.py > 8 && t.py < sillTop() - 4)
        .map(t => ({ ...t, sx: r.left + t.px * r.width / W, sy: r.top + t.py * r.height / H })) };
    }, [SAMPLE, q]);
    return { p, t };
  };
  for (const seed of [7, 42, 1234]) for (const q of [0, 1, 3]){
    const { p, t } = await open(seed, q);
    const n = Math.min(3, t.rows.length);
    await p.close();
    for (let i = 0; i < n; i++){
      const s2 = await open(seed, q);
      const t2 = s2.t.rows[i];
      await s2.p.touchscreen.tap(t2.sx, t2.sy);
      await s2.p.waitForTimeout(320);   // > NAME_SETTLE (0.12 s): a name COMMITS only once the pointer has rested
      const line = await s2.p.evaluate(() => document.getElementById('naming').textContent);
      taps.push({ seed, q, kind: t2.kind, hovers: s2.t.hovers, want: t2.name, got: line });
      await s2.p.close();
    }
  }
  await ctx.close();
}
await b.close();

const all = tally(rows), cam = {}, bel = tally(belfry);
for (const q in cams) cam[q] = { name: cams[q].name, t: tally(cams[q].rows) };

const line = (k, c) => `  ${k.padEnd(8)} n=${String(c.n).padStart(4)}  answered ${String(c.answered).padStart(4)}  blocked ${String(c.blocked).padStart(3)}  SILENT ${String(c.silent).padStart(4)}`;
console.log('probe-birds —', FILE.split('/').pop(), '·', INSTANTS.length, 'instants');
console.log('page errors:', errs.length, errs.slice(0, 3).join(' | '));
console.log('\nwide camera, by band:');
for (const k of Object.keys(all).sort()) console.log(line(k, all[k]));
console.log('\nbelfry flush (state wheel):');
for (const k of Object.keys(bel).sort()) console.log(line(k, bel[k]));
console.log('\nquarter cameras (seed 42 @ warp 118):');
for (const q of Object.keys(cam)){
  const t = cam[q].t, n = Object.values(t).reduce((a, c) => a + c.n, 0),
        a = Object.values(t).reduce((a, c) => a + c.answered, 0),
        s = Object.values(t).reduce((a, c) => a + c.silent, 0);
  console.log(`  ${cam[q].name.padEnd(10)} birds ${String(n).padStart(3)}  answered ${String(a).padStart(3)}  SILENT ${String(s).padStart(3)}`);
}
let pOk = 0, pExact = 0;
for (const t of point){ if (isBird(t.got)) pOk++; if (t.got.toLowerCase() === (t.want || '').toLowerCase()) pExact++; }
console.log(`\npointer path (real mousemove onto the bird's DISPLAYED point, 1280x700):`);
console.log(`  ${point.length} birds pointed at  ->  ${pOk} named a bird, ${pExact} matched exactly`);
for (const t of point) if (!isBird(t.got)) console.log(`  MISS want "${t.want}" got "${t.got}"`);

console.log('\nphone taps (390x844, hasTouch):', taps.length, 'hovers =', taps.length ? taps[0].hovers : '-');
let tOk = 0;
for (const t of taps){
  const ok = isBird(t.got);
  if (ok) tOk++;
  console.log(`  ${t.kind.padEnd(7)} seed ${String(t.seed).padStart(4)} q${t.q}  ${ok ? 'OK ' : 'MISS'}  "${t.got}"   (want "${t.want}")`);
}
console.log(`\ntaps naming a bird: ${tOk}/${taps.length}`);
const lines = new Set();
for (const c of [...Object.values(all), ...Object.values(bel)]) for (const l of c.lines) lines.add(l);
console.log('\ndistinct bird lines seen (' + lines.size + '):');
for (const l of [...lines].sort()) console.log('  ' + l);
if (argv.includes('--json')) console.log('\nJSON ' + JSON.stringify({ all, bel, cam, taps }, (k, v) => v instanceof Set ? [...v] : v));
process.exit(errs.length ? 1 : 0);
