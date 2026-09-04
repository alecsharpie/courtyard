/* ground-rebuilds.mjs — how OFTEN is the ground cache repainted, and WHY?
 *
 * drawGround is the frame's biggest single cost (25-27 ms, c214), so the number that
 * matters is not what one paint costs but how many a sim day asks for. __warp() never
 * draws, so the flag is never cleared and a count off it is meaningless: this probe
 * builds an INSTRUMENTED copy of the source in which
 *   - every `groundDirty = true` site is tagged, and counts only when it is the EDGE
 *     (the flag was false), which is exactly the attribution drawScene would make; and
 *   - __warp emulates drawScene's one consuming line — clear the flag, count a repaint,
 *     honour whatever gate the build puts in front of it — without painting anything.
 * So the answer is the build's own rule, run over sim days, at seeds.
 *
 *   node probes/ground-rebuilds.mjs [days] [seeds...]
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const DAYS = +(process.argv[2] || 6);
const SEEDS = process.argv.slice(3).map(Number);
const seeds = SEEDS.length ? SEEDS : [7, 42, 101, 2024, 5150, 88];
const DAY = 55;

// every site that sets the flag, by a string unique in the file, with the tag it counts as
const SITES = [
  ['  viewSnap();                                     // a resize lands the camera; no ease across it\n  groundDirty = true;', 'resize'],
  ["  if (RM){ viewSnap(); groundDirty = true; return; }", 'rm-where'],
  ['viewFrom = viewTo = null; gpadWant = 0; bpadWant = 0; groundDirty = true; }', 'ease-land'],
  ['a.crop = sp; harvested += took; groundDirty = true;', 'harvest'],
  ['      groundDirty = true;\n    }\n    // the far side goes home when the light does', 'plant'],
  ['  if (n){ groundDirty = true;', 'turn'],
  ["announce('The rain moves on. Everything smells green, and the lane shines.'); groundDirty=true; }", 'rain-off'],
  ["seeds from the window.'); groundDirty = true; }", 'sow'],
  ['    daisy[j] = 2; groundDirty = true;', 'daisy'],
  ['  if (lb !== lightBucket){ lightBucket = lb; groundDirty = true; }', 'light'],
  ['  if (lightMoved()) groundDirty = true;', 'light'],
  ['  if (Math.abs(snowCover - snowPainted) > SNOW_REPAINT) groundDirty = true;', 'snow'],
  ['  if (wetBucket() !== wetPainted) groundDirty = true;', 'wet'],
  ['  if (washOut() !== washPainted) groundDirty = true;', 'wash'],
  ['  if (barrowKey() !== barrowPainted) groundDirty = true;', 'barrow'],
  ['  if (wearDirty && wearAcc >= WEAR_REPAINT) groundDirty = true;', 'wear'],
];
const REQUIRED = new Set(['light', 'snow', 'wet', 'wash', 'wear']);
const ANCHOR = 'let groundDirty = true;';
const WARP = `window.__warp = function(secs, step){
  step = step || 1 / 30;
  const n = Math.max(0, Math.round(secs / step));
  for (let i = 0; i < n; i++) simStep(step, step);
  return { simT, day, hour };
};`;

function instrument(src, name){
  let out = src, seen = new Set();
  if (!out.includes(ANCHOR)) throw new Error(name + ': anchor miss');
  out = out.replace(ANCHOR, ANCHOR + `
window.__GDR = {}; window.__GDN = 0;
function __gd(t){ const R = window.__GDR; R[t + ':raw'] = (R[t + ':raw'] || 0) + 1;
  if (!groundDirty) R[t] = (R[t] || 0) + 1; return true; }`);
  for (const [needle, tag] of SITES){
    const n = out.split(needle).length - 1;
    // an OLD ref legitimately lacks the newer sites (there was no camera at #138); the
    // step function's own gates are required in every build, and a DOUBLE match is a bug
    if (n > 1) throw new Error(name + ': site "' + tag + '" matched ' + n + ' times');
    if (n === 0) continue;      // an OLD ref lacks the newer sites; a tag may have two spellings
    seen.add(tag);
    out = out.replace(needle, needle.replace(/groundDirty ?= ?true/, "groundDirty = __gd('" + tag + "')"));
  }
  for (const t of REQUIRED) if (!seen.has(t)) throw new Error(name + ': required site "' + t + '" missing');
  if (!out.includes(WARP)) throw new Error(name + ': __warp miss');
  const nWet = (out.match(/wetPainted/g) || []).length;   // the bookkeeping below needs these to EXIST
  // drawScene's one consuming line, minus the paint — WHATEVER gate the build puts on it
  out = out.replace(WARP, `window.__warp = function(secs, step){
  step = step || 1 / 30;
  const n = Math.max(0, Math.round(secs / step));
  for (let i = 0; i < n; i++){ simStep(step, step);
    if (groundDirty && !viewEasing() && (typeof groundPaints !== 'function' || groundPaints())){
      window.__GDN++; groundDirty = false; wearDirty = false; wearAcc = 0;
      /* drawGround's BOOKKEEPING, which is half of what a repaint does: every one of
       * these gates compares the world against what was last PAINTED, so an emulation
       * that clears the flag and not the marks leaves each gate true for ever (a first
       * cut read the washing at 868 repaints a day off exactly that). */
      if (typeof markGroundPainted === 'function') markGroundPainted();
      else { snowPainted = snowCover; wetPainted = wetBucket(); washPainted = washOut();
             if (typeof barrowKey === 'function') barrowPainted = barrowKey(); }
      if (typeof groundPaintT !== 'undefined') groundPaintT = simT; } }
  return { simT, day, hour };
};`);
  return out;
}

/* maxBuffer: courtyard.html passed node's default 1 MB at #191 and spawnSync answered
 * ENOBUFS, i.e. the probe died of the file GROWING. Any probe that shells out for the
 * source needs the same.
 *
 * The control is a REF, not "HEAD": HEAD expires the moment this change commits, and the
 * premise being priced here is a claim about a much older build. GR_REF names it. */
const REF = process.env.GR_REF || 'HEAD';
const builds = { [REF === 'HEAD' ? 'HEAD' : 'REF']: execFileSync('git', ['show', REF + ':courtyard.html'], { maxBuffer: 64 << 20 }).toString(),
                 CAND: readFileSync('courtyard.html', 'utf8') };
const files = {};
for (const [k, src] of Object.entries(builds)){
  files[k] = `/tmp/probe-gr-${k}.html`; writeFileSync(files[k], instrument(src, k));
}

const b = await chromium.launch();
const rows = {};
for (const [k, file] of Object.entries(files)){
  const tot = { N: 0 }; const by = {};
  for (const seed of seeds){
    const pg = await b.newPage({ viewport: { width: 1600, height: 950 } });
    const errs = []; pg.on('pageerror', e => errs.push(String(e)));
    await pg.goto(pathToFileURL(file).href + `?pause&seed=${seed}&t=0`);
    await pg.waitForFunction('window.__census');
    const r = await pg.evaluate((secs) => { window.__reseed(); window.__warp(secs);
      return { n: window.__GDN, by: window.__GDR }; }, DAYS * DAY);
    if (errs.length){ console.log('PAGE ERROR', k, seed, errs[0]); process.exit(1); }
    tot.N += r.n;
    for (const [t, v] of Object.entries(r.by)) by[t] = (by[t] || 0) + v;
    await pg.close();
  }
  rows[k] = { perDay: tot.N / (DAYS * seeds.length), by };
}
await b.close();

const tags = [...new Set(Object.values(rows).flatMap(r => Object.keys(r.by)))]
  .filter(t => !t.endsWith(':raw')).sort();
const nd = DAYS * seeds.length;
console.log(`ground cache repaints per SIM DAY — ${DAYS} d x ${seeds.length} seeds\n`);
const KS = Object.keys(rows);
console.log('  ' + ('cause  (' + REF + ')').padEnd(20) + KS.map(s => s.padStart(10)).join('') + '   (edges/day, raw/day)');
for (const t of tags){
  const cell = k => { const r = rows[k]; return ((r.by[t] || 0) / nd).toFixed(2).padStart(10); };
  const raw = k => ((rows[k].by[t + ':raw'] || 0) / nd).toFixed(1);
  console.log('  ' + t.padEnd(20) + KS.map(cell).join('') + '   raw ' + KS.map(raw).join(' -> '));
}
console.log('  ' + '-'.repeat(42));
console.log('  ' + 'REPAINTS'.padEnd(20) + KS.map(k => rows[k].perDay.toFixed(2).padStart(10)).join('')
  + '   ' + (100 * (rows.CAND.perDay / rows[KS[0]].perDay - 1)).toFixed(1) + '%');
