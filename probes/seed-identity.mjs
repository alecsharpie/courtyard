#!/usr/bin/env node
/* seed-identity.mjs — does `?seed=N` name a WORLD, or only a world-at-a-window?
 *
 *   node probes/seed-identity.mjs                       # the working tree
 *   node probes/seed-identity.mjs --ref 'Iter 175'      # a REF, checked out to /tmp
 *   node probes/seed-identity.mjs --seed 7 --verbose
 *
 * THE CLAIM. The frame is a WINDOW on the town and never a fork of it: given one seed,
 * every viewport must run the SAME simulation. So load `courtyard.html` at each framing
 * `shoot.config.json` shoots plus two arbitrary ones, `__reseed()` each, warp them all
 * to the same pinned instants, and require the census and the entity set to be
 * IDENTICAL — not close, identical — at every instant at every size.
 *
 * WHY IT EXISTS (#176). It failed on its own HEAD. At seed 42 the town ran bit-identical
 * to simT 121 and then split on a duck; by simT 415 `cloud` read 0.166 / 0.781 / 0.471
 * and `raining` false / true / false at 1600x950 / 390x844 / 1200x720. The cause was the
 * rain: the drop field is canvas-space — spawned across W, recycled at H, culled by the
 * frame — and it drew from the town's own PRNG, so how many draws the sky spent was a
 * function of the window. Worse, the shower's END waited on `!raindrops.length`, making a
 * world event wait on a screen. Every multi-framing gate this loop owns had therefore
 * spent 175 iterations comparing two different towns.
 *
 * THE ONE EXEMPTION, and why it is not a dodge. `life.raindrops` is a count of canvas
 * particles — render state, which the census's own note says it must not carry, and which
 * motion.mjs reads as the `shower` population at ONE pinned viewport. It is the picture,
 * and a picture is allowed to be the shape of its frame. So it is excluded BY NAME, and
 * the exclusion is EARNED, not assumed: `clock.raining` and the world's `rainFall` are
 * asserted identical across framings in their own right, and any OTHER field that differs
 * is a failure. A second render-state field creeping into the census fails this gate.
 */
import { homedir } from 'node:os';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const has = (n) => process.argv.includes(n);

const SEED = arg('--seed', '42');
const VERBOSE = has('--verbose');
const REF = arg('--ref', null);
let pagePath = arg('--page', join(REPO, 'courtyard.html'));
if (REF){                                        // a "before" pinned to a ref, never to HEAD
  pagePath = `/tmp/seed-identity-${REF.replace(/\W+/g, '_')}.html`;
  writeFileSync(pagePath, execFileSync('git', ['show', `${REF}:courtyard.html`], { cwd: REPO, maxBuffer: 1 << 28 }).toString());
}
if (!existsSync(pagePath)) { console.error('no such page: ' + pagePath); process.exit(1); }
const PAGE = pathToFileURL(resolve(REPO, pagePath)).href;

/* Every framing shoot.mjs shoots (a clip is the same viewport, so dedupe on w x h),
 * then two that nothing in this repo has ever rendered — the point is that the set is
 * arbitrary, so a fix that happens to suit the shipped sizes still fails here. */
const cfg = JSON.parse(readFileSync(join(REPO, 'shoot.config.json'), 'utf8'));
const seen = new Set();
const SIZES = [];
for (const s of cfg.shots){ const w = s.w || 1600, h = s.h || 950, k = w + 'x' + h;
  if (!seen.has(k)){ seen.add(k); SIZES.push({ w, h, from: 'shoot.config' }); } }
for (const [w, h] of [[1200, 720], [744, 1133]]) if (!seen.has(w + 'x' + h)) SIZES.push({ w, h, from: 'arbitrary' });

/* Pinned instants, in warped sim seconds from the seeded start. 125 is where #176's fork
 * first showed and is INSIDE the only shower seed 42 gets in its first 800 s (125–130,
 * measured); 128 is mid-shower, where the recycle branch that caused the fork fires
 * hardest. 415 is where the fork had grown into two different skies, and 700 is most of a
 * fortnight further on — long enough that a fork of one draw has reached everything.
 *   Showers are RARE, so the rain line at the foot of this report is load-bearing: if a
 * future re-pin moves these instants off the wet window, the gate still passes but stops
 * testing the mechanism it was written for, and says so. */
const INSTANTS = [125, 128, 200, 415, 700];

/* The census carries one render-state field. Named here, and nowhere else. */
const EXEMPT = new Set(['life.raindrops']);

const flat = (o, pre = '', out = {}) => {
  for (const [k, v] of Object.entries(o)){
    const key = pre ? pre + '.' + k : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, key, out);
    else out[key] = Array.isArray(v) ? JSON.stringify(v) : v;
  }
  return out;
};

const browser = await chromium.launch();
const read = async (sz) => {
  const pg = await browser.newPage({ viewport: { width: sz.w, height: sz.h } });
  const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(PAGE + `?pause&seed=${SEED}&t=0`);
  await pg.waitForFunction('window.__census');
  /* One evaluate: reseed, then step. A ?pause'd page still runs rAF, so anything done
   * across two evaluates has frames of somebody else's time in the middle of it. */
  const out = await pg.evaluate((INSTANTS) => {
    if (!window.__reseed()) throw new Error('__reseed() returned false — the page is not seeded');
    window.__setTime(0);
    let at = 0; const rows = [];
    for (const t of INSTANTS){
      window.__warp(t - at, 1 / 30); at = t;
      const ents = window.__entities()
        .filter(e => e.kind !== 'raindrop')       // canvas-space: the picture, not the town
        .map(e => `${e.kind} ${e.x.toFixed(6)} ${e.y.toFixed(6)} ${e.z.toFixed(6)} ${e.act || ''}`)
        .sort();
      rows.push({ t, census: window.__census(), ents });
    }
    return rows;
  }, INSTANTS);
  await pg.close();
  return { out, errs };
};

console.log(`seed-identity — seed ${SEED} · page ${REF ? 'ref ' + REF : pagePath.replace(REPO + '/', '')}`);
console.log(`  ${SIZES.length} framings: ${SIZES.map(s => `${s.w}x${s.h}(${s.from[0]})`).join(' ')}`);
console.log(`  instants: simT ${INSTANTS.join(' ')}\n`);

const reads = [];
for (const sz of SIZES){ const r = await read(sz); reads.push(r);
  if (r.errs.length){ console.log(`  PAGE ERRORS at ${sz.w}x${sz.h}: ${r.errs[0]}`); } }
await browser.close();

const base = reads[0], baseSz = SIZES[0];
let fails = 0, exempted = 0;
for (let i = 0; i < INSTANTS.length; i++){
  const bf = flat(base.out[i].census);
  for (let j = 1; j < reads.length; j++){
    const cf = flat(reads[j].out[i].census);
    const keys = new Set([...Object.keys(bf), ...Object.keys(cf)]);
    const diff = [], skipped = [];
    for (const k of keys) if (String(bf[k]) !== String(cf[k])) (EXEMPT.has(k) ? skipped : diff).push(k);
    exempted += skipped.length;
    const eq = base.out[i].ents.join('\n') === reads[j].out[i].ents.join('\n');
    if (diff.length || !eq){
      fails++;
      console.log(`FAIL  simT ${INSTANTS[i]}  ${baseSz.w}x${baseSz.h} vs ${SIZES[j].w}x${SIZES[j].h}`);
      for (const k of diff.sort().slice(0, 10)) console.log(`        ${k.padEnd(22)} ${bf[k]}  vs  ${cf[k]}`);
      if (diff.length > 10) console.log(`        …and ${diff.length - 10} more census fields`);
      if (!eq){
        const bs = new Set(base.out[i].ents), cs = new Set(reads[j].out[i].ents);
        const only = (a, s) => a.filter(x => !s.has(x));
        console.log(`        entities  ${base.out[i].ents.length} vs ${reads[j].out[i].ents.length}` +
                    `  ·  ${only(base.out[i].ents, cs).length} / ${only(reads[j].out[i].ents, bs).length} unmatched`);
        for (const e of only(base.out[i].ents, cs).slice(0, 3)) console.log(`          only ${baseSz.w}x${baseSz.h}: ${e}`);
        for (const e of only(reads[j].out[i].ents, bs).slice(0, 3)) console.log(`          only ${SIZES[j].w}x${SIZES[j].h}: ${e}`);
      }
    } else if (VERBOSE){
      console.log(`ok    simT ${INSTANTS[i]}  ${baseSz.w}x${baseSz.h} vs ${SIZES[j].w}x${SIZES[j].h}  ` +
                  `${keys.size} census fields, ${base.out[i].ents.length} entities`);
    }
  }
}

/* The exemption has to be EARNED, and the earning is a READING and not a sentence.
 * `life.raindrops` is excused only because the WORLD's rain — `clock.raining`, the flag
 * the town's behaviour reads, and `clock.cloud`, the sky it comes out of — are inside the
 * gated set and agree on their own. Both are reported here so a reader never has to take
 * the exclusion on trust. And a ZERO is evidence only if the test COULD have been
 * non-zero: showers are rare, so the wet-instant count is printed, and a run that never
 * rained is called WEAK however green it is. */
const pairs = INSTANTS.length * (reads.length - 1);
const worldRain = [];
for (let i = 0; i < INSTANTS.length; i++) for (let j = 1; j < reads.length; j++)
  if (base.out[i].census.clock.raining !== reads[j].out[i].census.clock.raining ||
      base.out[i].census.clock.cloud   !== reads[j].out[i].census.clock.cloud) worldRain.push(INSTANTS[i]);
const wet = INSTANTS.filter((_, i) => reads.some(r => r.out[i].census.clock.raining)).length;
console.log(`\nexempt: life.raindrops (canvas particles) — differed at ${exempted} of ${pairs} comparisons.`);
console.log(`  earned? clock.raining + clock.cloud disagree at ${worldRain.length} of ${pairs}` +
            (worldRain.length ? `  ← NOT EARNED: the WORLD's rain forks at simT ${[...new Set(worldRain)].join(',')}` : '  — the world\'s rain is one world'));
console.log(`rain reached: ${wet} of ${INSTANTS.length} instants had raining=true somewhere` +
            (wet ? '' : '  ← WEAK: no instant exercised the shower; re-pin INSTANTS'));
console.log(fails ? `\nVERDICT: FAIL — ${fails} of ${pairs} comparisons disagree. ?seed= does not name a world.`
                  : `\nVERDICT: PASS — ${pairs} comparisons, all identical. One seed, one town.`);
process.exit(fails ? 1 : 0);
