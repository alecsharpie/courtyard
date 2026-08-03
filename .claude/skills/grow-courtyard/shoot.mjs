#!/usr/bin/env node
/* shoot.mjs — screenshots of the town at a PINNED seed and a PINNED sim INSTANT.
 *
 *   node shoot.mjs                          all framings, day 4 mid-morning, seed 42
 *   node shoot.mjs --shots wide,courtyard   just those framings
 *   node shoot.mjs --t 1210 --tag night     a different moment, into shots/night-*.png
 *   node shoot.mjs --seed 7
 *
 * It drives the page the way census.mjs and motion.mjs do: load `?pause&t=0`, then
 * `__reseed()` + `__warp(t)`. That is the whole point of this script.
 *
 * It used to be a thin wrapper that loaded `?t=<t>&fast` and slept 2600 ms of WALL
 * time before capturing — which at 8x speed is ~21 s of sim time on a fast machine
 * and rather more on a loaded one, so the instant it actually photographed jittered
 * by many sim minutes and twice came back a different day than it aimed at. A
 * harness cannot compare two builds at "the same moment" if it cannot name the
 * moment. Now `--t 175` means simT 175.000, exactly, on every run and every machine.
 * (`__warp` from 0 is also NOT the same world as `?t=175`, which sets the clock and
 * skips the intervening sim — every other instrument in this skill warps, so this
 * one warps too.)
 *
 * `--tag` prefixes the FILES. It used to forward `--prefix` to a screenshot-verify
 * that has no such flag, so two tagged runs silently overwrote each other's
 * courtyard.png and iteration 14 lost a summer shot under a winter one.
 *
 * Framings come from the repo's shoot.config.json (the same file the
 * screenshot-verify skill reads), so there is still exactly one list of them.
 */
import { homedir } from 'node:os';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
if (!existsSync(PW)) {
  console.error('shoot: playwright not found at ' + PW);
  console.error('       install the screenshot-verify skill first (npm i in that directory).');
  process.exit(1);
}
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const OUT = join(REPO, 'shots');
mkdirSync(OUT, { recursive: true });

const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const seed = arg('--seed', '42');
const t = +arg('--t', '175');          // day 4, mid-morning: gardens up, lamps off, people about
const tag = arg('--tag', null);
const want = arg('--shots', null);
const page = arg('--page', 'courtyard.html');
const PAGE = pathToFileURL(resolve(REPO, page)).href;
const prefix = tag ? `${tag}-` : '';

const CFG = join(REPO, 'shoot.config.json');
const DEFAULT_SHOTS = [{ name: 'wide', w: 1600, h: 950 }];
let shots = existsSync(CFG) ? (JSON.parse(readFileSync(CFG, 'utf8')).shots || DEFAULT_SHOTS) : DEFAULT_SHOTS;
if (want) {
  const names = String(want).split(',').map(s => s.trim());
  const missing = names.filter(n => !shots.some(s => s.name === n));
  if (missing.length) { console.error(`shoot: no such framing: ${missing.join(', ')} (have: ${shots.map(s => s.name).join(', ')})`); process.exit(1); }
  shots = shots.filter(s => names.includes(s.name));
}

/* No day/hour is derived here: the page owns that arithmetic and prints it below as
 * `at:`. Two places computing the same clock is how they drift. */
console.log(`shoot: seed=${seed} t=${t}s${tag ? `  tag=${tag}` : ''}  ->  ${prefix}<framing>.png`);

const browser = await chromium.launch();
let pageerrors = 0;
let pinned = null;
for (const s of shots) {
  const ctx = await browser.newContext({
    viewport: { width: s.w || 1600, height: s.h || 950 },
    deviceScaleFactor: s.dsf || 2,
    reducedMotion: s.reducedMotion || 'no-preference',
  });
  const p = await ctx.newPage();
  p.on('pageerror', e => { pageerrors++; console.error(`  PAGE ERROR ${s.name}: ${e}`); });
  await p.goto(`${PAGE}?seed=${seed}&t=0&pause`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  /* One evaluate: the page keeps running between host round-trips, so reseed, warp
   * and read the clock without going back to node in the middle. */
  const at = await p.evaluate(secs => {
    window.__reseed(); window.__warp(secs);
    const c = window.__census();
    return { simT: c.clock.simT, day: c.clock.day, hour: c.clock.hour, season: c.clock.season,
             cloud: c.clock.cloud, raining: c.clock.raining, people: c.life.people };
  }, t);
  /* The clock is frozen but rAF still paints, so two frames is a painted warp state. */
  await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await p.waitForTimeout(120);
  if (typeof s.scrollY === 'number') await p.evaluate(y => window.scrollTo(0, y), s.scrollY);
  await p.screenshot({ path: join(OUT, `${prefix}${s.name}.png`), ...(s.clip ? { clip: s.clip } : {}), ...(s.fullPage ? { fullPage: true } : {}) });
  console.log(`  -> ${prefix}${s.name}.png   ${s.w || 1600}x${s.h || 950}${s.clip ? ' clipped' : ''}`);
  if (!pinned) pinned = at;
  else if (at.simT !== pinned.simT || at.season !== pinned.season)
    console.error(`  DRIFT ${s.name}: simT ${at.simT} season ${at.season} (expected ${pinned.simT} / ${pinned.season})`);
  await ctx.close();
}
await browser.close();

if (pinned) console.log(`  at: simT ${pinned.simT}  day ${pinned.day}  hour ${pinned.hour}  season ${pinned.season}  cloud ${pinned.cloud}` +
                        `${pinned.raining ? '  RAINING' : ''}  people ${pinned.people}`);
if (pageerrors) { console.error(`\nshoot: ${pageerrors} page error(s)`); process.exit(1); }
console.log(`done -> ${OUT}`);
