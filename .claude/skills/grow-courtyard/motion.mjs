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
    for (let i = 0; i < steps; i++) { window.__warp(step); out.push(window.__entities()); }
    return out;
  }, { warm: t, step: STEP, steps: STEPS });
  await p.close();
  return { frames, errs };
}

function analyse(frames) {
  const seen = new Map();       // id -> { kind, steps: [displacement…], lastFrame, gaps }
  const stats = {};
  const examples = [];
  const K = () => ({ jumps: 0, nan: 0, oob: 0, flicker: 0, spawns: 0, despawns: 0, samples: 0 });

  let prev = new Map();
  for (let f = 0; f < frames.length; f++) {
    const now = new Map(frames[f].map(e => [e.id, e]));
    for (const [id, e] of now) {
      const s = (stats[e.kind] ||= K());
      s.samples++;
      if (!Number.isFinite(e.x) || !Number.isFinite(e.y) || !Number.isFinite(e.z)) { s.nan++; if (examples.length < 12) examples.push(`${id} NaN at frame ${f}`); continue; }
      if (e.x < WORLD.x[0] || e.x > WORLD.x[1] || e.y < WORLD.y[0] || e.y > WORLD.y[1]) { s.oob++; if (examples.length < 12) examples.push(`${id} out of world at (${e.x.toFixed(1)}, ${e.y.toFixed(1)}) frame ${f}`); }

      const was = prev.get(id);
      const rec = seen.get(id) || { kind: e.kind, d: [], last: f };
      if (was) {
        const d = Math.hypot(e.x - was.x, e.y - was.y);
        rec.d.push(d);
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
    for (const d of rec.d) {
      if (d > ABS_JUMP && d > med * REL_JUMP) {
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
    const { frames, errs } = await sample(b, seed, t);
    result.pageerrors += errs.length;
    const a = analyse(frames);
    for (const k in a.stats) {
      const m = (merged[k] ||= { jumps: 0, nan: 0, oob: 0, flicker: 0, spawns: 0, despawns: 0, samples: 0 });
      for (const f in a.stats[k]) m[f] += a.stats[k][f];
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
const FIELDS = ['jumps', 'nan', 'oob', 'flicker', 'spawns', 'despawns'];
let fail = [];

for (const [name, sc] of Object.entries(result.scenes)) {
  console.log(`\n${name}:`);
  const bs = base && base.scenes[name] ? base.scenes[name].stats : null;
  const kinds = Object.keys(sc.stats).sort();
  console.log('  ' + 'kind'.padEnd(10) + FIELDS.map(f => f.padStart(9)).join(''));
  for (const k of kinds) {
    const row = sc.stats[k];
    const cells = FIELDS.map(f => {
      const v = row[f], was = bs && bs[k] ? bs[k][f] : null;
      if (was === null || was === v) return String(v).padStart(9);
      return `${v}(${v - was > 0 ? '+' : ''}${v - was})`.padStart(9);
    });
    console.log('  ' + k.padEnd(10) + cells.join(''));
    /* NaN and out-of-world are always bugs. The rest are judged as regressions. */
    if (row.nan) fail.push(`${name}/${k}: ${row.nan} NaN positions`);
    if (row.oob) fail.push(`${name}/${k}: ${row.oob} positions outside the world`);
    if (bs && bs[k]) {
      if (row.jumps > bs[k].jumps) fail.push(`${name}/${k}: jumps ${bs[k].jumps} -> ${row.jumps}`);
      if (row.flicker > bs[k].flicker) fail.push(`${name}/${k}: flicker ${bs[k].flicker} -> ${row.flicker}`);
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
