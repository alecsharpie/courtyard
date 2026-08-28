#!/usr/bin/env node
/* naming.mjs — does the sill name the thing under the pointer, and is the name TRUE?
 *
 * The census cannot see a label. Six questions, numerically:
 *   1. Crowns: all thirteen trees record where they were painted, each crown centre
 *      names its own tree, and a point clear of every crown names the ground instead.
 *      A tree is drawn cells NORTH of its trunk, so this is the part that cannot be
 *      done by unprojecting the pointer.
 *   2. Agreement: nameAt() is non-empty on EXACTLY the cells answersTouch() answers.
 *      One predicate, two readers — the label may not fall silent where the cursor
 *      promises, nor speak where the click will not.
 *   3. Provenance: every named bed carries the species that is actually in bSp (and in
 *      the allotments, the crop plotCrop found), and a bed at stage 3 under a ceiling
 *      below 3 says so. Nothing is guessed from position.
 *   4. Density: how many distinct plant names one sweep of the courtyard can teach.
 *   5. The year: warped through eight phases, the linden's words track leafOut/leafTurn
 *      and the orchard's track blossomF/fruitF — the label cannot lie about the season
 *      because it never asks what season it is.
 *   6. The sill: settle, clear, the yield to a live ticker line at 1280px, and the
 *      phone — no hover at all, so the TAP names, borrows the sill, fits, gives it back.
 */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(resolve(HERE, '../../../..', 'courtyard.html')).href;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const seed = arg('--seed', '42');

const b = await chromium.launch();
const errs = [];
let bad = 0;
const ok = (c, s) => { console.log((c ? '  ok   ' : '  FAIL ') + s); if (!c) bad++; };

/* ---- 1-4: the vocabulary, against the grid it is read from -------------------- */
{
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${PAGE}?pause&seed=${seed}`);
  await p.waitForFunction('typeof window.__census === "function"');
  // ?t= sets the CLOCK; it does not grow anything. A town to name has to be warped to.
  await p.evaluate(() => __warp(625));
  await p.waitForFunction('crowns.length > 0');          // one frame has painted

  console.log('\n1. the crowns');
  const trees = await p.evaluate(() => crowns.map(c => ({
    name: c.name, at: lookAt([c.x, c.y]), rx: Math.round(c.rx), ry: Math.round(c.ry),
  })));
  ok(trees.length === 13, `${trees.length} crowns recorded (want 13: linden + 4 street + 4 plaza + 4 orchard)`);
  const named = trees.filter(t => t.at.startsWith(t.name));
  ok(named.length === trees.length,
    `${named.length}/${trees.length} crown centres name their own tree`);
  const kinds = {};
  for (const t of trees) kinds[t.name] = (kinds[t.name] || 0) + 1;
  ok(kinds['the linden'] === 1 && kinds['a street tree'] === 4 &&
     kinds['a plaza tree'] === 4 && kinds['an orchard tree'] === 4,
    'kinds: ' + Object.entries(kinds).map(([k, v]) => `${v}x ${k}`).join(', '));
  ok(trees.every(t => t.rx > 8 && t.ry > 8), `smallest crown ${Math.min(...trees.map(t => Math.min(t.rx, t.ry)))} px radius`);
  // the street trees stand ON the lane: the crown must beat the paving under it, and a
  // point below the crown must go back to naming the paving
  const overLane = await p.evaluate(() => {
    const c = crowns.find(k => k.name === 'a street tree');
    return [lookAt([c.x, c.y]), lookAt([c.x, c.y + c.ry * 2.2])];
  });
  ok(overLane[0].startsWith('a street tree'), `over the crown → "${overLane[0]}"`);
  ok(!overLane[1].startsWith('a street tree'), `below the crown → "${overLane[1]}" (the ground again)`);

  console.log('\n2. the label and the cursor agree, cell for cell');
  const agree = await p.evaluate(() => {
    let both = 0, named = 0, answers = 0, mism = 0; const eg = [];
    for (let y = 0; y < WH; y++) for (let x = 0; x < GW; x++){
      const n = !!nameAt(x, y), a = answersTouch(x, y);
      if (n) named++; if (a) answers++; if (n && a) both++;
      if (n !== a && eg.length < 5) eg.push([x, y, nameAt(x, y), a]);
      if (n !== a) mism++;
    }
    return { named, answers, both, mism, eg };
  });
  ok(agree.mism === 0,
    `${agree.mism} cells disagree (${agree.named} named, ${agree.answers} answer a touch)` +
    (agree.eg.length ? ' e.g. ' + JSON.stringify(agree.eg) : ''));

  console.log('\n3. provenance — every name is read, not guessed');
  const prov = await p.evaluate(() => {
    let beds = 0, wrong = 0, held = 0, stalled = 0, bare = 0; const eg = [];
    for (let y = 3; y < WH; y++) for (let x = 0; x < GW; x++){
      const j = y * GW + x, g = grid[j];
      if (g !== BED && g !== CBED) continue;
      const n = nameAt(x, y);
      if (inAllotment(x, y)){
        const sp = plotCrop(x, y);
        if (!sp){ if (!n.includes('bare')) { wrong++; eg.push([x, y, n, 'no crop']); } continue; }
        beds++;
        if (!n.startsWith('a plot of ' + SPECIES[sp - 1].name)){ wrong++; if (eg.length < 5) eg.push([x, y, n, SPECIES[sp - 1].name]); }
      } else {
        if (!bSp[j]){ bare++; if (!n.includes('earth')){ wrong++; if (eg.length < 5) eg.push([x, y, n, 'bare']); } continue; }
        beds++;
        if (!n.startsWith(SPECIES[bSp[j] - 1].name)){ wrong++; if (eg.length < 5) eg.push([x, y, n, SPECIES[bSp[j] - 1].name]); }
        if (bSt[j] === 3 && bedCap(x, y) === 3 && !/full flower|ready to lift/.test(n)){ wrong++; if (eg.length < 5) eg.push([x, y, n, 'stage 3, cap 3']); }
        if (bSt[j] === 3 && bedCap(x, y) < 3) held++;
        if (bSt[j] < 3 && bSt[j] >= bedCap(x, y)) stalled++;
      }
    }
    return { beds, bare, wrong, held, stalled, eg };
  });
  ok(prov.wrong === 0, `${prov.beds} planted beds + ${prov.bare} bare, ${prov.wrong} named wrongly` +
    (prov.eg.length ? ' e.g. ' + JSON.stringify(prov.eg) : ''));
  console.log(`         (this instant: ${prov.held} beds flowering above their ceiling, ${prov.stalled} stalled at it)`);

  console.log('\n4. how many names one sweep can teach');
  const sweep = await p.evaluate(() => {
    // the courtyard bed ring, as the pointer would cross it: a horizontal sweep through
    // the middle of the block and a vertical one, in SCREEN space, 300 points each
    const seen = new Set(), all = new Set();
    for (let k = 0; k < 300; k++){
      const a = project(3 + (58 * k) / 300, 32.5, 0), c = project(32, 3 + (58 * k) / 300, 0);
      for (const q of [a, c]){
        const n = lookAt(q);
        if (!n) continue;
        all.add(n.split(',')[0]);
        for (const s of SPECIES) if (n.includes(s.name)) seen.add(s.name);
      }
    }
    return { species: [...seen], subjects: [...all] };
  });
  ok(sweep.species.length >= 3,
    `${sweep.species.length} plant names in two sweeps of the courtyard: ${sweep.species.join(', ')}`);
  console.log('         subjects: ' + sweep.subjects.join(' · '));

  console.log('\n5. the year in the words');
  const rows = [];
  for (let i = 0; i < 8; i++){
    rows.push(await p.evaluate(() => ({
      phase: seasonPhase, label: seasonLabel(),
      out: leafOut(), turn: leafTurn(), shed: leafShed(),
      fresh: leafFresh(), bl: blossomF(), fr: fruitF(),
      linden: lookAt([crowns.find(c => c.name === 'the linden').x, crowns.find(c => c.name === 'the linden').y]),
      orchard: lookAt([crowns.find(c => c.name === 'an orchard tree').x, crowns.find(c => c.name === 'an orchard tree').y]),
      cold: (() => { let n = 0; for (let y = 3; y < 61; y++) for (let x = 3; x < 61; x++){ const s = nameAt(x, y); if (s && s.includes('cold')) n++; } return n; })(),
    })));
    await p.evaluate(() => __warp(1430 / 8));            // an eighth of a year, 26 days x 55 s
    await p.waitForTimeout(60);                          // let a frame repaint the crowns
  }
  for (const r of rows) console.log(`         p ${r.phase.toFixed(3)} ${r.label.padEnd(12)} out ${r.out.toFixed(2)} ` +
    `turn ${r.turn.toFixed(2)} bl ${r.bl.toFixed(2)} fr ${r.fr.toFixed(2)} | ${r.linden.padEnd(38)} | ` +
    `${r.orchard.padEnd(38)} | ${r.cold} cold beds`);
  // the words must follow the terms the crown is DRAWN with, in the documented order
  const lie = rows.filter(r => {
    const s = r.linden.replace('the linden, ', '');
    if (r.out < 0.06) return s !== 'bare for the winter';
    if (r.turn > 0.35) return s !== (r.shed > 0.45 ? 'dropping its leaves' : 'on the turn');
    if (r.fresh > 0.35) return s !== 'in new leaf';
    return s !== (r.out > 0.75 ? 'in full leaf' : 'coming into leaf');
  });
  ok(lie.length === 0, `${lie.length}/8 phases where the linden's words disagree with its own canopy terms`);
  const words = new Set(rows.map(r => r.linden));
  ok(words.size >= 3, `${words.size} distinct linden labels round the year`);
  ok(rows.some(r => r.orchard.includes('blossom')) && rows.some(r => r.orchard.includes('fruit')),
    'the orchard is named in blossom AND in fruit somewhere in the year');
  ok(rows.some(r => r.cold > 0), `the cold is named in the beds at ${rows.filter(r => r.cold > 0).length}/8 phases (max ${Math.max(...rows.map(r => r.cold))} beds)`);
  await p.close();
}

/* ---- 7: the living things ----------------------------------------------------
 * Ten seeds, a grown town, one frame painted. Every walker, duck, swan and the boat
 * (drawn ones: not inside an archway, not under the bridge) is pointed at where its
 * feet were projected, and the sill must answer a LIVING name and never the ground.
 * Then a lattice of points at least two cells clear of every entity must answer
 * exactly what nameAt/treeAt alone answer — the ground is not renamed by the change.
 * Pass `--head <file>` to compare the clear-lattice answers against another build. */
{
  console.log('\n7. the living things, ten seeds');
  let total = 0, living = 0, ground = 0, clearN = 0, clearDiff = 0; const eg = [], vocab = new Set();
  const clearAll = [];
  for (let sd = 1; sd <= 10; sd++){
    const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
    p.on('pageerror', e => errs.push(String(e)));
    await p.goto(`${PAGE}?pause&seed=${sd}`);
    await p.waitForFunction('typeof window.__census === "function"');
    await p.evaluate(() => __warp(625 + 27.5));            // midday on a grown town: the lane is full
    await p.waitForFunction('crowns.length > 0');
    const r = await p.evaluate(() => {
      const cellAt = (x, y) => grid[clamp(y|0, 0, WH-1) * GW + clamp(x|0, 0, GW-1)];
      const rows = [];
      const probe = (e, kind) => {
        const q = project(e.x, e.y, e.z || 0); q[1] -= cellH * 0.5;   // mid-shin, inside the box
        const n = lookAt(q), living = !!livingAt(q);
        rows.push({ kind, n, living, ground: !living && !!nameAt(...cellOf(q)) });
      };
      for (const a of agents) if (cellAt(a.x, a.y) !== TUNNEL) probe(a, a.kind);
      for (const d of ducks) probe(d, 'duck');
      for (const s of swans) probe(s, 'swan');
      if (boat && (boat.y < 64.5 || boat.y > 79)) probe(boat, 'boat');
      // a lattice two cells clear of every entity, in world space, then named on screen
      const ents = __entities().filter(e => e.kind !== 'raindrop' && e.kind !== 'bird' && e.kind !== 'leaf' && e.kind !== 'butterfly' && e.kind !== 'firefly');
      const clear = [];
      for (let y = 2; y < WH; y += 3) for (let x = 2; x < GW; x += 3){
        if (ents.some(e => Math.abs(e.x - x) < 2.5 && Math.abs(e.y - y) < 2.5)) continue;
        const q = project(x + 0.5, y + 0.5, 0);
        const c = treeAt(q);
        clear.push([x, y, lookAt(q), c ? c.name + ', ' + treeState(c.fruit) : nameAt(x, y)]);
      }
      return { rows, clear };
    });
    for (const w of r.rows){ total++; if (w.living){ living++; vocab.add(w.n); } if (w.ground){ ground++; if (eg.length < 6) eg.push([sd, w.kind, w.n]); } }
    for (const c of r.clear){ clearN++; if (c[2] !== c[3]) clearDiff++; clearAll.push([sd, ...c]); }
    await p.close();
  }
  ok(total >= 50, `${total} drawn living things pointed at over ten seeds`);
  ok(living / total >= 0.95, `${living}/${total} = ${(100 * living / total).toFixed(1)}% answer a living name (want ≥ 95%)`);
  ok(ground === 0, `${ground} answered the ground instead` + (eg.length ? ' e.g. ' + JSON.stringify(eg) : ''));
  ok(clearDiff === 0, `${clearN} points 2+ cells clear of every entity: ${clearDiff} differ from nameAt/treeAt alone`);
  console.log('         vocabulary (' + vocab.size + '): ' + [...vocab].join(' · '));
  const headFile = arg('--head', null);
  if (headFile){
    const { readFileSync, writeFileSync } = await import('node:fs');
    if (arg('--write-clear', null)){ writeFileSync(headFile, JSON.stringify(clearAll)); console.log('         wrote clear lattice to ' + headFile); }
    else { const h = JSON.parse(readFileSync(headFile, 'utf8')); let d = 0;
      for (let i = 0; i < Math.min(h.length, clearAll.length); i++) if (h[i][3] !== clearAll[i][3]) d++;
      ok(h.length === clearAll.length && d === 0, `clear lattice vs HEAD: ${d} of ${clearAll.length} names differ`); }
  }
}

/* ---- 6a: the sill on a wide screen — settle, clear, yield -------------------- */
{
  console.log('\n6a. the sill, 1280px');
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${PAGE}?pause&seed=${seed}`);
  await p.waitForFunction('typeof window.__census === "function"');
  await p.evaluate(() => __warp(625));
  await p.waitForFunction('crowns.length > 0');
  // 625 s of town happening at once leaves a line on the ticker, and that line is owed
  // its reading time before the label may take the box. Real seconds, even paused.
  await p.waitForTimeout(2600);
  const box = await p.locator('#cv').boundingBox();
  const at = async (wx, wy) => {
    const [sx, sy] = await p.evaluate(([x, y]) => project(x, y, 0), [wx, wy]);
    await p.mouse.move(Math.round(box.x + sx), Math.round(box.y + sy));
    await p.waitForTimeout(220);                          // > NAME_SETTLE
    return p.evaluate(() => ({
      txt: document.getElementById('naming').textContent,
      on: document.getElementById('sill').classList.contains('naming'),
      tickerShown: getComputedStyle(document.getElementById('ticker')).display !== 'none',
    }));
  };
  const bed = await p.evaluate(() => {              // a planted courtyard bed, found on the grid
    for (let y = 3; y < 61; y++) for (let x = 3; x < 61; x++){
      const j = y * GW + x;
      // clear of every crown: a bed BEHIND the linden is correctly named the linden,
      // because that is what is in front of it
      if (grid[j] === CBED && bSp[j] && !treeAt(project(x + 0.5, y + 0.5, 0))) return [x + 0.5, y + 0.5];
    }
    return null;
  });
  const a = await at(bed[0], bed[1]);
  ok(a.on && a.txt.length > 0, `over a planted bed → "${a.txt}"`);
  ok(a.txt === a.txt.charAt(0).toUpperCase() + a.txt.slice(1) && !a.txt.endsWith('.'),
    'set as a label: leading capital, no full stop');
  ok(!a.tickerShown, 'the ticker yields its box while the label is up');
  const wall = await at(1.5, 1.5);                  // the block wall answers nothing
  ok(!wall.on && wall.txt === '' && wall.tickerShown, 'over the wall → nothing, ticker back');
  await p.mouse.move(Math.round(box.x + 5), Math.round(box.y + box.height + 40));   // off the canvas
  await p.waitForTimeout(120);
  const gone = await p.evaluate(() => document.getElementById('sill').classList.contains('naming'));
  ok(!gone, 'pointer off the canvas → the sill goes back');
  /* The yield, on a page whose SIM CLOCK IS STOPPED — which is what the Pause button
   * gives a viewer. tickerAge is bucketed off the sim's dt and so never advances here;
   * if the label waited on that, a paused diorama would name nothing ever again. The
   * line is put up directly because announce() on a paused page only QUEUES (the queue
   * drains from the same stopped bucket) — the surface is what is under test, not the
   * routing. */
  const [px, py] = await p.evaluate(([x, y]) => project(x, y, 0), bed);
  await p.mouse.move(Math.round(box.x + px), Math.round(box.y + py));
  await p.waitForTimeout(220);
  ok((await p.evaluate(() => document.getElementById('naming').textContent)).length > 0, 'label up over the bed');
  await p.evaluate(() => showLine({ txt: 'A bell somewhere over the lane.' }));
  await p.waitForTimeout(250);
  const during = await p.evaluate(() => ({
    naming: document.getElementById('naming').textContent,
    line: document.getElementById('ticker').textContent,
    shown: getComputedStyle(document.getElementById('ticker')).display !== 'none',
  }));
  ok(during.naming === '' && during.shown, `a fresh line takes the box back: "${during.line}"`);
  await p.waitForTimeout(2600);                    // TICK_DWELL of REAL time, sim still stopped
  const after = await p.evaluate(() => ({ naming: document.getElementById('naming').textContent, free: tickerFree() }));
  ok(after.naming.length > 0,
    `read on the REAL clock, so a PAUSED page names again (tickerFree still ${after.free}) → "${after.naming}"`);
  await p.close();
}

/* ---- 6b: the same yield on a live page, through a real click ------------------ */
{
  console.log('\n6b. the yield, live page, real click');
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${PAGE}?seed=${seed}`);            // live and unwarped: done inside INVITE_AT
  await p.waitForFunction('typeof window.__census === "function"');
  await p.waitForFunction('crowns.length > 0');
  const box = await p.locator('#cv').boundingBox();
  const lawn = await p.evaluate(() => {
    for (let y = 3; y < 61; y++) for (let x = 3; x < 61; x++){
      const q = project(x + 0.5, y + 0.5, 0);
      if (grid[y * GW + x] === GRASS && !treeAt(q)) return q;
    }
    return null;
  });
  await p.mouse.move(Math.round(box.x + lawn[0]), Math.round(box.y + lawn[1]));
  await p.waitForTimeout(220);
  const before = await p.evaluate(() => document.getElementById('naming').textContent);
  ok(before.length > 0, `hovering a live page names it → "${before}"`);
  await p.mouse.down(); await p.mouse.up();
  await p.waitForTimeout(300);
  const during = await p.evaluate(() => ({
    naming: document.getElementById('naming').textContent,
    line: document.getElementById('ticker').textContent,
  }));
  ok(during.naming === '' && during.line.startsWith('You'),
    `the click's own answer is not covered: "${during.line}"`);
  await p.waitForTimeout(2600);
  const after = await p.evaluate(() => document.getElementById('naming').textContent);
  ok(after.length > 0, `and the label comes back after the dwell → "${after}"`);
  await p.close();
}

/* ---- 6c: the phone — no hover at all ---------------------------------------- */
{
  console.log('\n6c. the phone, 390x844, no pointer');
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${PAGE}?seed=${seed}`);              // live, not paused: the tap is the whole point
  await p.waitForFunction('typeof window.__census === "function"');
  await p.evaluate(() => __warp(625));
  await p.waitForFunction('crowns.length > 0');
  ok(await p.evaluate(() => HOVERS === false), 'the page knows it has no hover');
  const box = await p.locator('#cv').boundingBox();
  const bed = await p.evaluate(() => {
    for (let y = 3; y < 61; y++) for (let x = 3; x < 61; x++){
      const j = y * GW + x;
      const q = project(x + 0.5, y + 0.5, 0);
      if (grid[j] === CBED && bSp[j] && !treeAt(q)) return q;
    }
    return null;
  });
  await p.touchscreen.tap(Math.round(box.x + bed[0]), Math.round(box.y + bed[1]));
  await p.waitForTimeout(300);
  const t = await p.evaluate(() => {
    const n = document.getElementById('naming');
    const cs = e => getComputedStyle(document.getElementById(e)).display;
    return { txt: n.textContent, on: document.getElementById('sill').classList.contains('naming'),
             fits: n.scrollWidth <= n.clientWidth + 1, w: n.clientWidth, need: n.scrollWidth,
             plate: cs('plate'), clock: cs('daytime'), sill: document.getElementById('sill').scrollWidth - document.getElementById('sill').clientWidth };
  });
  ok(t.on && t.txt.length > 0, `a tap names it → "${t.txt}"`);
  ok(t.plate === 'none' && t.clock === 'none', 'the plate and the clock step aside, as for the invitation');
  ok(t.fits, `the label fits one line untruncated (${t.need} px into ${t.w} px)`);
  ok(t.sill <= 0, `the sill does not overflow its box (${t.sill} px over)`);
  await p.waitForTimeout(4800);                     // > NAME_HELD
  const back = await p.evaluate(() => ({
    on: document.getElementById('sill').classList.contains('naming'),
    plate: getComputedStyle(document.getElementById('plate')).display,
  }));
  ok(!back.on && back.plate !== 'none', 'the sill comes back on its own after NAME_HELD');
  await ctx.close();
}

console.log('');
if (errs.length){ bad += errs.length; console.log('  FAIL page errors: ' + errs.join(' | ')); }
console.log(bad ? `naming: ${bad} FAILURES` : 'naming: all checks passed');
await b.close();
process.exit(bad ? 1 : 0);
