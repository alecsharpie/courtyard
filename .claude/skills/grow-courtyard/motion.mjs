#!/usr/bin/env node
/* motion.mjs — the gate a screenshot cannot be.
 *
 *   node motion.mjs                  measure + diff against motion-baseline.json
 *   node motion.mjs --save-baseline
 *   node motion.mjs --scene night
 *
 * A still frame proves the town LOOKS right in one instant. It says nothing about
 * whether a walker teleported across the lane, a duck popped out of existence and
 * back, a bird flickered between two positions every frame, or a leaf drifted off
 * to NaN. Those are the bugs that survive a visual gate — in the previous loop
 * three separate agents stared at a motion bug and all three named the wrong
 * cause, while a twenty-line probe found it on the first run.
 *
 * So this is numeric, and it is deterministic: the sim is advanced by __warp() in
 * fixed steps with a pinned seed, and every moving thing is sampled by identity at
 * every step. Continuity is then a measurement, not an opinion:
 *
 *   jump      a step displacement wildly out of line with that entity's own pace
 *   nan       a position that stopped being a number
 *   oob       a position outside the world
 *   flicker   an entity that vanishes and comes back within a few steps
 *   churn     spawn/despawn rate, per kind
 *
 * Legitimate teleports exist (rain recycles, birds respawn off-screen), so the
 * gate is a DIFF against a pinned baseline, exactly like the census: what matters
 * is a kind that started jumping, not that jumps exist.
 *
 * RAIN is watched at BOTH levels, and they answer different questions.
 *
 *   shower    the POPULATION — `__census().life.raindrops` at every step, rises
 *             counted as spawns, falls as despawns, a step bigger than half the
 *             shower's own peak as a jump. This is the shape of the weather: a
 *             shower that stops arriving, empties in one frame, or never ends.
 *             It has no per-drop identity, so nan/oob/flicker print `–` rather
 *             than a reassuring 0.
 *   raindrop  per-DROP continuity, since #21. Drops live in SCREEN space, so
 *             `__entities()` had not carried them and the world-bounds test would
 *             have called every one of them out of bounds; both are now told about
 *             SCREEN kinds. A drop that drifts to NaN, stalls, leaves the frame or
 *             jumps sideways is a fault the population count cannot see — and rain
 *             is the feature #21 changed, so the gate had to be able to see it.
 */
import { homedir } from 'node:os';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const PAGE = pathToFileURL(resolve(REPO, arg('--page', 'courtyard.html'))).href;
const save = process.argv.includes('--save-baseline');
const baseFile = join(HERE, 'motion-baseline.json');

const SCENES = { day: 175, dusk: 1080, night: 1230, market: 605 };
const sceneArg = arg('--scene', null);
const scenes = sceneArg ? [[sceneArg, SCENES[sceneArg] ?? +sceneArg]] : Object.entries(SCENES);

const SEEDS = [7, 42];
const STEP = 0.25;          // sim seconds per sample — fine enough to catch a single-frame flicker
const STEPS = 240;          // 60 sim-seconds of watching per cell
const WORLD = { x: [-12, 152], y: [-12, 100] };

/* A jump is a step that is both far in absolute terms AND far out of line with how
 * this entity normally moves. Either test alone produces noise: fast things trip
 * the absolute test, and near-stationary things trip the relative one. */
const ABS_JUMP = 2.5;       // world units in 0.25 s — nothing in this town moves that fast
const REL_JUMP = 8;         // ...and 8x its own median step
/* Kinds whose x,y are canvas pixels rather than world cells. They are bounded by the
 * frame and their absolute jump threshold is in pixels, so both tests need telling. */
const SCREEN = new Set(['raindrop']);
const ABS_JUMP_PX = 400;    // px in 0.25 s — a drop falls ~160, so this is a real teleport

async function sample(browser, seed, t) {
  const p = await browser.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${PAGE}?seed=${seed}&t=0&pause`);
  await p.waitForTimeout(300);
  const frames = await p.evaluate(async ({ warm, step, steps }) => {
    window.__reseed();
    window.__warp(warm);
    const out = [];
    for (let i = 0; i < steps; i++) {
      window.__warp(step);
      out.push({ ents: window.__entities(), rain: window.__census().life.raindrops });
    }
    // the canvas the screen-space kinds live in — read, not assumed, because the page
    // sizes its own canvas and a hard-coded viewport would silently mis-bound the rain
    return { out, screen: { w: W, h: H } };
  }, { warm: t, step: STEP, steps: STEPS });
  await p.close();
  return { frames: frames.out, screen: frames.screen, errs };
}

function analyse(frames, screen) {
  const seen = new Map();       // id -> { kind, steps: [displacement…], lastFrame, gaps }
  const stats = {};
  const examples = [];
  const K = () => ({ jumps: 0, nan: 0, oob: 0, flicker: 0, spawns: 0, despawns: 0, samples: 0 });
  /* The shower alone also carries `rises` / `falls`: a rise is how rain STARTS by
   * design, a fall in one step is the bug #15 fixed. `jumps` stays their sum. */
  const KS = () => ({ ...K(), rises: 0, falls: 0 });

  /* The shower, as a population. Frame 0 is the starting level, not an arrival, so
   * only the changes after it are counted — warping into an existing shower must
   * not read as 110 spawns.
   *
   * `spawns`/`despawns` alone would be a weak gate: they are the integral of the
   * rises and the falls, and a shower that vanishes in one frame has exactly the
   * same integral as one that tapers over three seconds — which is the bug #15
   * actually fixed. So `jumps` carries the shape, on the same principle the entity
   * rule uses: a step out of all proportion to how this thing normally moves. For a
   * population that is a step bigger than half its own peak. Rain STARTS abruptly by
   * design (`want` goes to 110 the instant it begins), so one jump per shower is
   * expected and sits in the baseline; a second one means the ending broke too. */
  const rain = frames.map(f => f.rain).filter(Number.isFinite);
  if (rain.length) {
    const s = (stats.shower ||= KS());
    const peak = Math.max(...rain);
    for (let i = 0; i < rain.length; i++) {
      s.samples += rain[i];
      if (i === 0) continue;
      const d = rain[i] - rain[i - 1];
      if (d > 0) s.spawns += d; else if (d < 0) s.despawns += -d;
      if (peak >= 8 && Math.abs(d) > peak * 0.5) {
        s.jumps++; if (d > 0) s.rises++; else s.falls++;
        if (examples.length < 12) examples.push(`raindrops stepped ${d > 0 ? '+' : ''}${d} in one ${STEP}s step (peak ${peak})`);
      }
    }
  }

  let prev = new Map();
  for (let f = 0; f < frames.length; f++) {
    const now = new Map(frames[f].ents.map(e => [e.id, e]));
    for (const [id, e] of now) {
      const s = (stats[e.kind] ||= K());
      s.samples++;
      if (!Number.isFinite(e.x) || !Number.isFinite(e.y) || !Number.isFinite(e.z)) { s.nan++; if (examples.length < 12) examples.push(`${id} NaN at frame ${f}`); continue; }
      /* SCREEN-space kinds are bounded by the canvas, not the world. A raindrop's x,y
       * are canvas pixels, so the world box would call every one of them out of bounds
       * — which is why they were invisible to this gate until #21. The x margins are
       * wide because a drop is blown left about 12% of its fall and is recycled up to
       * 1.15 W to the right; anything outside THIS box has genuinely got away. */
      const sc = SCREEN.has(e.kind) ? screen : null;
      const box = sc ? { x: [-0.3 * sc.w, 1.35 * sc.w], y: [-60, sc.h + 60] } : WORLD;
      if (e.x < box.x[0] || e.x > box.x[1] || e.y < box.y[0] || e.y > box.y[1]) { s.oob++; if (examples.length < 12) examples.push(`${id} out of ${sc ? 'frame' : 'world'} at (${e.x.toFixed(1)}, ${e.y.toFixed(1)}) frame ${f}`); }

      const was = prev.get(id);
      const rec = seen.get(id) || { kind: e.kind, d: [], last: f };
      if (was) {
        const d = Math.hypot(e.x - was.x, e.y - was.y);
        /* A drop that reaches the bottom is put back above the top as the SAME object:
         * a teleport of nearly the canvas height, by design. Leaving it in the step
         * series would set the entity's own median and hide the very anomaly the
         * series exists to find, so a recycle is excluded — everything else about the
         * drop (NaN, a drift, a stall, a sideways jump) is still measured. */
        if (!(sc && e.y < was.y - sc.h * 0.5)) rec.d.push(d);
      } else if (seen.has(id)) {
        /* it was here, then it wasn't, and now it is again */
        if (f - rec.last <= 4) { s.flicker++; if (examples.length < 12) examples.push(`${id} vanished and returned within ${f - rec.last} steps (frame ${f})`); }
        else s.spawns++;
      } else s.spawns++;
      rec.last = f;
      seen.set(id, rec);
    }
    for (const id of prev.keys()) if (!now.has(id)) { const k = (prev.get(id) || {}).kind; if (k) (stats[k] ||= K()).despawns++; }
    prev = now;
  }

  /* Second pass: a jump is judged against the entity's OWN median step. */
  for (const [id, rec] of seen) {
    if (rec.d.length < 6) continue;
    const sorted = [...rec.d].sort((a, b) => a - b);
    const med = sorted[sorted.length >> 1] || 0.0001;
    const abs = SCREEN.has(rec.kind) ? ABS_JUMP_PX : ABS_JUMP;
    for (const d of rec.d) {
      if (d > abs && d > med * REL_JUMP) {
        (stats[rec.kind] ||= K()).jumps++;
        if (examples.length < 12) examples.push(`${id} moved ${d.toFixed(2)} in one step (its median is ${med.toFixed(3)})`);
        break;   // one report per entity, not one per frame
      }
    }
  }
  return { stats, examples };
}

const b = await chromium.launch();
const result = { when: new Date().toISOString(), pageerrors: 0, scenes: {} };
for (const [name, t] of scenes) {
  const merged = {}; const ex = [];
  for (const seed of SEEDS) {
    const { frames, screen, errs } = await sample(b, seed, t);
    result.pageerrors += errs.length;
    const a = analyse(frames, screen);
    for (const k in a.stats) {
      const m = (merged[k] ||= { jumps: 0, nan: 0, oob: 0, flicker: 0, spawns: 0, despawns: 0, samples: 0 });
      for (const f in a.stats[k]) m[f] = (m[f] || 0) + a.stats[k][f];
    }
    ex.push(...a.examples.map(e => `[seed ${seed}] ${e}`));
  }
  result.scenes[name] = { stats: merged, examples: ex.slice(0, 8) };
}
await b.close();

if (save) {
  writeFileSync(baseFile, JSON.stringify(result, null, 1));
  console.log(`motion: baseline pinned — ${scenes.length} scene(s) x ${SEEDS.length} seeds, ${STEPS} steps of ${STEP}s each.`);
}

const base = !save && existsSync(baseFile) ? JSON.parse(readFileSync(baseFile, 'utf8')) : null;
const FIELDS = ['jumps', 'rises', 'falls', 'nan', 'oob', 'flicker', 'spawns', 'despawns'];
/* Fields a kind is not measured on. Printing 0 here would claim a check that was
 * never run — the rain is counted, not identified, and only the shower has a
 * rise/fall shape. */
const UNTRACKED = { shower: ['nan', 'oob', 'flicker'] };
const tracked = (kind, f) => !(UNTRACKED[kind] || []).includes(f) && (kind === 'shower' || !['rises', 'falls'].includes(f));
let fail = [];

for (const [name, sc] of Object.entries(result.scenes)) {
  console.log(`\n${name}:`);
  const bs = base && base.scenes[name] ? base.scenes[name].stats : null;
  const kinds = Object.keys(sc.stats).sort();
  console.log('  ' + 'kind'.padEnd(10) + FIELDS.map(f => f.padStart(10)).join(''));
  for (const k of kinds) {
    const row = sc.stats[k];
    const cells = FIELDS.map(f => {
      if (!tracked(k, f)) return '–'.padStart(10);
      const v = row[f], was = bs && bs[k] ? bs[k][f] : null;
      if (was === null || was === v) return String(v).padStart(10);
      return `${v}(${v - was > 0 ? '+' : ''}${v - was})`.padStart(10);
    });
    console.log('  ' + k.padEnd(10) + cells.join(''));
    /* NaN and out-of-world are always bugs. The rest are judged as regressions. */
    if (row.nan && tracked(k, 'nan')) fail.push(`${name}/${k}: ${row.nan} NaN positions`);
    if (row.oob && tracked(k, 'oob')) fail.push(`${name}/${k}: ${row.oob} positions outside the world`);
    if (bs && bs[k]) {
      /* The shower is gated on FALLS only: a rise is how rain begins by design, and
       * an extra shower in a churned seed used to fail the gate for the wrong reason. */
      if (k === 'shower' && bs[k].falls != null) {
        if (row.falls > bs[k].falls) fail.push(`${name}/${k}: falls ${bs[k].falls} -> ${row.falls} (a shower ended in one step)`);
      } else if (tracked(k, 'jumps') && row.jumps > bs[k].jumps) fail.push(`${name}/${k}: jumps ${bs[k].jumps} -> ${row.jumps}`);
      if (tracked(k, 'flicker') && row.flicker > bs[k].flicker) fail.push(`${name}/${k}: flicker ${bs[k].flicker} -> ${row.flicker}`);
    } else if (!bs && (row.jumps || row.flicker)) {
      console.log(`    note: ${row.jumps} jumps, ${row.flicker} flickers — no baseline to compare against yet`);
    }
  }
  for (const e of sc.examples) console.log('    · ' + e);
}

if (result.pageerrors) fail.push(`${result.pageerrors} page error(s)`);

console.log();
if (save) { console.log('VERDICT: BASELINE SAVED'); process.exit(result.pageerrors ? 1 : 0); }
if (!base) { console.log('VERDICT: NO BASELINE — run --save-baseline before your edit to make this a gate.'); process.exit(result.pageerrors ? 1 : 0); }
if (fail.length) { console.error('VERDICT: FAIL'); for (const f of fail) console.error('  ' + f); process.exit(1); }
console.log('VERDICT: PASS — nothing teleported, vanished, flickered or went NaN that was not already doing so.');
