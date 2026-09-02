#!/usr/bin/env node
/* probe-affordance.mjs — #117. Three questions, all driven by a REAL pointer event.
 *   1. Does the cursor become a hand wherever the town has a NAME to give?
 *   2. Do the 24 pieces of roof furniture say anything?
 *   3. Does a point the sill covers answer, when the renderer does not draw it?
 * Every reading is taken by moving/tapping at the point the thing is DISPLAYED and
 * reading cv.style.cursor and #naming out of the DOM — never lookAt(project(...)),
 * which skips the event. HEAD is regenerated and measured by the same code.       */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
writeFileSync('/tmp/head-courtyard.html', execSync('git show HEAD:courtyard.html', { cwd: resolve(HERE, '../../../..'), maxBuffer: 1 << 26 }));
const BUILDS = {
  HEAD: pathToFileURL('/tmp/head-courtyard.html').href,
  tree: pathToFileURL(resolve(HERE, '../../../..', 'courtyard.html')).href,
};
const SEED = 42, WARP = 625;
const b = await chromium.launch();
const errs = [];
let bad = 0;
const ok = (c, s) => { console.log((c ? '  ok   ' : '  FAIL ') + s); if (!c) bad++; };

/* The display point of each target, computed from the SAME page state on both builds.
 * WASH_H, ROOF_FURN, FACES, VANES and crowns all exist on HEAD — only the answering
 * does not — so the two builds are pointed at pixel-identical places. */
const TARGETS = `() => {
  const out = {};
  /* The block runs off BOTH edges of the frame — ROOF_FURN[0] sits at world x -7.5,
   * which projects to sx -37 at 1600x950. A target off the canvas is not a target: take
   * the first piece of each kind whose display point is comfortably inside the frame. */
  const roofZ0 = f => nearZ(Math.floor(f.kind === 'line' ? (f.x + f.x1) / 2 : f.x), Math.floor(f.y));
  const onCanvas = q => q && q[0] > 40 && q[0] < W - 40 && q[1] > 40 && q[1] < H - 8;
  const at = f => f.kind === 'tank' ? project(f.x, f.y + 0.55, roofZ0(f) + 0.76)
                : f.kind === 'loft' ? project(f.x, f.y + 0.42, roofZ0(f) + 0.56)
                : project((f.x + f.x1) / 2, f.y, roofZ0(f) + WASH_H - 0.40);
  for (const [key, kind] of [['a water tank','tank'], ['a pigeon loft','loft'], ['a washing line','line']]){
    const f = ROOF_FURN.filter(q => q.kind === kind).map(at).find(onCanvas);
    if (f) out[key] = f;
  }
  const k = viewS / gview.s, dx = originX - k * gview.ox, dy = topPad - k * gview.tp;
  const win = FACES.filter(q => !q.live && !q.door && q.sa >= 0)
    .map(f => [dx + k * (f.x0 + f.x1) / 2, dy + k * (f.y0 + f.y1) / 2]).find(onCanvas);
  if (win) out['a window'] = win;
  const v = (typeof VANES !== 'undefined' ? VANES : []).map(q => project(q.x, q.y, q.z + 0.55)).find(onCanvas);
  if (v) out['a weathervane'] = v;
  const c = crowns.filter(q => q.name === 'a street tree').map(q => [q.x, q.y]).find(onCanvas);
  if (c) out['a tree crown'] = c;
  for (let y = 3; y < 61 && !out['the lawn']; y++) for (let x = 3; x < 61 && !out['the lawn']; x++){
    const q = project(x + .5, y + .5, 0);
    if (grid[y * GW + x] === GRASS && !treeAt(q) && onCanvas(q)) out['the lawn'] = q;
  }
  for (let y = 1; y < 60 && !out['a blank wall']; y++) for (let x = 1; x < 60 && !out['a blank wall']; x++){
    const q = project(x + .5, y + .5, 0);
    if (grid[y * GW + x] === WALL && !treeAt(q) && onCanvas(q) && !lookAt(q)) out['a blank wall'] = q;
  }
  return { pts: out, wash: washOut(), sillDepth: unproject(W / 2, sillTop())[1], W, H };
}`;

async function open(url, w, h, opts = {}){
  const ctx = await b.newContext({ viewport: { width: w, height: h }, ...opts });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(url.slice(-20) + ': ' + e));
  await p.goto(`${url}?pause&seed=${SEED}`);
  await p.waitForFunction('typeof window.__census === "function"');
  await p.evaluate(t => { __reseed(); __warp(t); }, WARP);   // frames drawn at load move the PRNG
  await p.waitForFunction('crowns.length > 0');
  await p.waitForTimeout(2600);          // the ticker's line is owed its dwell first
  return p;
}
const read = p => p.evaluate(() => ({
  cur: cv.style.cursor || 'default',
  txt: document.getElementById('naming').textContent,
}));

/* ---- 1. the table, 1600x950 ------------------------------------------------- */
async function table(url, w, h){
  const p = await open(url, w, h);
  const box = await p.locator('#cv').boundingBox();
  const { pts, wash, sillDepth, W, H } = await p.evaluate(`(${TARGETS})()`);
  const rows = {};
  for (const [name, q] of Object.entries(pts)){
    await p.mouse.move(Math.round(box.x + q[0] * box.width / W),
                       Math.round(box.y + q[1] * box.height / H));
    await p.waitForTimeout(200);          // > NAME_SETTLE 0.12
    rows[name] = await read(p);
  }
  await p.close();
  return { rows, wash, sillDepth: +sillDepth.toFixed(1) };
}

console.log(`\n1. the pointer, 1600x950 (seed ${SEED}, warp ${WARP}s)`);
// HEAD twice first: anything that differs between two runs of IDENTICAL code is the
// instrument, and may not be read as a change (the vane eases on real frames).
const H2 = await table(BUILDS.HEAD, 1600, 950);
const A = { HEAD: await table(BUILDS.HEAD, 1600, 950), tree: await table(BUILDS.tree, 1600, 950) };
const unstable = Object.keys(A.HEAD.rows).filter(k => H2.rows[k] && H2.rows[k].txt !== A.HEAD.rows[k].txt);
console.log(`   HEAD-vs-HEAD control: ${unstable.length} target(s) whose words are not stable run to run` +
            (unstable.length ? ' -> ' + unstable.join(', ') : ''));
console.log(`   washOut() = ${A.tree.wash}; the sill reaches world depth ${A.tree.sillDepth} (the town ends at 88)`);
console.log('   ' + 'target'.padEnd(16) + '| HEAD cursor  name'.padEnd(44) + '| tree cursor  name');
let handHEAD = 0, handTree = 0, namedTree = 0;
for (const k of Object.keys(A.tree.rows)){
  const hd = A.HEAD.rows[k], tr = A.tree.rows[k];
  if (hd.cur === 'pointer') handHEAD++;
  if (tr.cur === 'pointer') handTree++;
  if (tr.txt) namedTree++;
  const f = r => (r.cur === 'pointer' ? 'HAND ' : '  -  ') + ' ' + (r.txt || '—').slice(0, 34);
  console.log('   ' + k.padEnd(16) + '| ' + f(hd).padEnd(42) + '| ' + f(tr));
}
const n = Object.keys(A.tree.rows).length;
ok(handHEAD === 1, `HEAD gives a hand on ${handHEAD}/${n} targets (the lawn — the sowable cell)`);
ok(handTree === n - 1, `tree gives a hand on ${handTree}/${n} (all but the blank wall)`);
ok(namedTree === n - 1, `tree names ${namedTree}/${n}`);
const FURN = ['a water tank', 'a pigeon loft', 'a washing line'];
for (const k of FURN)
  ok(A.HEAD.rows[k].txt === 'Our own roof, the slates below the window' && !!A.tree.rows[k].txt,
     `${k}: HEAD named the SLATES UNDER it -> tree "${A.tree.rows[k].txt}"`);
for (const k of Object.keys(A.tree.rows))
  if (A.HEAD.rows[k].txt && !FURN.includes(k) && !unstable.includes(k))
    ok(A.HEAD.rows[k].txt === A.tree.rows[k].txt, `${k}: the WORDS are unchanged`);
ok(A.tree.rows['a blank wall'].cur === 'default' && !A.tree.rows['a blank wall'].txt,
   'a blank wall still answers nothing and shows no hand');

/* ---- 2. behind the sill, 1280x700 — where all 24 pieces are covered ---------- */
console.log('\n2. behind the sill, 1280x700');
async function behind(url){
  const p = await open(url, 1280, 700);
  const box = await p.locator('#cv').boundingBox();
  const q = await p.evaluate(() => {
    const st = sillTop(), cov = [];
    for (const f of ROOF_FURN){
      const cx = f.kind === 'line' ? (f.x + f.x1) / 2 : f.x;
      const s = project(cx, f.y, nearZ(Math.floor(cx), Math.floor(f.y)) + 0.7);
      if (s[1] > st && s[0] > 40 && s[0] < W - 40 && s[1] < H - 8) cov.push(s);
    }
    const ent = [];                      // anything the renderer's own nearHidden suppresses
    for (const bd of birds){ const s = project(bd.x, bd.y, bd.z); if (nearHidden(bd.y, s[1])) ent.push(['a bird', s]); }
    if (typeof catA !== 'undefined' && catA){ const s = project(catA.x, catA.y, catA.z || 0);
      if (nearHidden(catA.y, s[1])) ent.push(['the cat', s]); }
    return { cov: cov.length, pt: cov[0], ent, total: ROOF_FURN.length, W, H, st: +st.toFixed(0) };
  });
  const out = { cov: q.cov, total: q.total, st: q.st, ent: q.ent.length, rows: [] };
  for (const [label, s] of [['roof furniture', q.pt], ...q.ent]){
    await p.mouse.move(Math.round(box.x + s[0] * box.width / q.W), Math.round(box.y + s[1] * box.height / q.H));
    await p.waitForTimeout(200);
    out.rows.push([label, await read(p)]);
  }
  await p.close();
  return out;
}
const B = { HEAD: await behind(BUILDS.HEAD), tree: await behind(BUILDS.tree) };
console.log(`   sillTop ${B.tree.st} px covers ${B.tree.cov}/${B.tree.total} pieces of furniture` +
            ` and ${B.tree.ent} living thing(s) the renderer already refuses to draw`);
for (let i = 0; i < B.tree.rows.length; i++){
  const [lab, tr] = B.tree.rows[i], hd = B.HEAD.rows[i][1];
  console.log(`   ${lab.padEnd(16)}| HEAD "${hd.txt}" ${hd.cur} | tree "${tr.txt}" ${tr.cur}`);
  ok(!tr.txt && tr.cur === 'default', `${lab} behind the sill: nothing said, no hand`);
}
ok(B.HEAD.rows.some(([, r]) => r.txt), 'and HEAD DID answer there — the test is not vacuous');

/* ---- 3. the phone, 390x844 — ONE tap per page ------------------------------- */
console.log('\n3. the phone, 390x844, one tap per page');
for (const name of ['a water tank', 'a pigeon loft', 'a washing line', 'a window', 'a tree crown']){
  const p = await open(BUILDS.tree, 390, 844, { hasTouch: true });
  const box = await p.locator('#cv').boundingBox();
  const { pts, W, H } = await p.evaluate(`(${TARGETS})()`);
  if (!pts[name]){ ok(false, `${name}: no such target on the phone framing`); await p.close(); continue; }
  await p.touchscreen.tap(Math.round(box.x + pts[name][0] * box.width / W),
                          Math.round(box.y + pts[name][1] * box.height / H));
  await p.waitForTimeout(320);
  const r = await p.evaluate(() => ({
    txt: document.getElementById('naming').textContent,
    on: document.getElementById('sill').classList.contains('naming'),
    fits: (e => e.scrollWidth <= e.clientWidth + 1)(document.getElementById('naming')),
  }));
  ok(r.on && !!r.txt && r.fits, `tap on ${name} -> "${r.txt}"`);
  await p.close();
}

/* ---- 4. the line is named by what is ON it, not by the fact of it ------------ */
console.log('\n4. one washing line, four states of the same cord (1600x950)');
{
  const p = await open(BUILDS.tree, 1600, 950);
  const box = await p.locator('#cv').boundingBox();
  const seen = new Set();
  for (let step = 0; step < 14; step++){
    // aimed at the CORD itself, which is there in every weather — a point below it is
    // over washing on a fine day and over bare slates on a wet one, and would not be
    // one target measured four times
    const q = await p.evaluate(k => {
      if (k) __warp(k);                          // on into rain, dusk, the night, the frost
      const f = ROOF_FURN.filter(v => v.kind === 'line')
        .map(v => ({ v, s: project((v.x + v.x1) / 2, v.y,
             nearZ(Math.floor((v.x + v.x1) / 2), Math.floor(v.y)) + WASH_H) }))
        .find(o => o.s[0] > 40 && o.s[0] < W - 40 && o.s[1] > 40 && o.s[1] < H - 8);
      return { s: f.s, W, H, out: washOut(), rain: raining, wet: +wetF().toFixed(2),
               snow: +snowCover.toFixed(2), hour: +hour.toFixed(1), wind: +windF().toFixed(2) };
    }, step ? 19 : 0);
    await p.mouse.move(Math.round(box.x + q.s[0] * box.width / q.W), Math.round(box.y + q.s[1] * box.height / q.H));
    await p.waitForTimeout(2600);              // the warp leaves a line on the ticker, owed its dwell
    const r = await read(p);
    if (r.txt && !seen.has(r.txt)){
      seen.add(r.txt);
      console.log(`   h${String(q.hour).padStart(5)}  out=${q.out ? 'Y' : 'n'} rain=${q.rain ? 'Y' : 'n'} wet=${q.wet} snow=${q.snow} wind=${q.wind}  -> "${r.txt}"`);
    }
    if (r.txt) ok(q.out === /washing out to dry|blowing about/.test(r.txt),
      `h${q.hour}: washOut()=${q.out} and the words ${/out to dry|blowing about/.test(r.txt) ? 'say so' : 'do not'}`);
  }
  await p.close();
  console.log(`   ${seen.size} distinct lines from ONE cord over the day`);
  ok(seen.size >= 2, `the cord's words change with what is on it (${seen.size} distinct)`);
}

await b.close();
if (errs.length) console.log('\npage errors:\n' + errs.join('\n'));
console.log(`\n${bad ? 'FAIL ' + bad : 'all checks passed'}${errs.length ? ' + ' + errs.length + ' page errors' : ''}`);
process.exit(bad || errs.length ? 1 : 0);
