/* seats-shots — the brief's own test, as a picture: a front builds over an OCCUPIED
 * courtyard, and the lawn and benches empty before the first drop.
 *
 *     node probe-seats-shots.mjs [file] [tag]
 *
 * Finds, in a seeded world, the moment a courtyard with people sitting in it goes under
 * a thickening sky, then shoots the same clip at four points through the front: seated,
 * cover crossing the refuse bar, cover through the release band, and the first rain.
 * Run it against HEAD with a tag to get the same four instants in the build that sat
 * through it — the two strips side by side are the whole iteration.
 *
 * One page per shot: the renderer draws from R(), so warping and screenshotting on one
 * page walks the seeded stream between frames (#29). Each shot reseeds and warps alone.
 */
import { homedir } from 'node:os';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const FILE = resolve(process.argv[2] || 'courtyard.html');
const TAG = process.argv[3] || 'seats';
const SEEDS = [7, 63, 101, 3];
const CLIP = JSON.parse(readFileSync('shoot.config.json', 'utf8')).shots.find(s => s.name === 'courtyard').clip;
const OUT = 'shots'; mkdirSync(OUT, { recursive: true });
const STEP = 0.25, SPAN = 660;

const browser = await chromium.launch();
const page = async () => {
  const p = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  return p;
};

/* pass 1 — find a front that arrives while somebody is sitting in the courtyard */
let found = null;
for (const seed of SEEDS){
  const p = await page();
  await p.goto(pathToFileURL(FILE).href + `?seed=${seed}&pause`);
  await p.waitForFunction(() => typeof window.__warp === 'function');
  found = await p.evaluate(({ STEP, SPAN }) => {
    window.__reseed();
    const sitting = () => agents.filter(a => !a.street && a.state === 'sit').length;
    let best = null;
    for (let t = 0; t < SPAN; t += STEP){
      window.__warp(STEP);
      const c = window.__census().clock;
      // the moment we want: seats occupied, sky still open, and a front on the way up
      if (sitting() >= 2 && weatherComing() > 0.05 && weatherComing() < 0.35 && !c.raining){
        // look ahead is not possible without stepping, so just take the first and let
        // pass 2 confirm it actually thickened
        best = { simT: c.simT, seated: sitting(), cm: +weatherComing().toFixed(3) };
        break;
      }
    }
    if (!best) return null;
    // walk on and record when the sky crosses each bar, and when it rains
    const marks = { refuse: null, band: null, rain: null };
    for (let t = 0; t < 260; t += STEP){
      window.__warp(STEP);
      const c = window.__census().clock, cm = weatherComing();
      if (marks.refuse == null && cm > 0.45) marks.refuse = c.simT;
      if (marks.band == null && cm > 0.72) marks.band = c.simT;
      if (marks.rain == null && c.raining) marks.rain = c.simT;
      if (marks.rain != null) break;
    }
    return { ...best, marks };
  }, { STEP, SPAN });
  await p.close();
  if (found && found.marks.band != null){ found.seed = seed; break; }
  found = null;
}

if (!found){ console.log('no front arrived over an occupied courtyard in any seed'); await browser.close(); process.exit(1); }
console.log(`seed ${found.seed}: ${found.seated} seated at simT ${found.simT} (cover→rain ${JSON.stringify(found.marks)})`);

/* pass 2 — one fresh page per instant */
const stops = [
  ['a-seated', found.simT, 'seats taken, sky still open'],
  ['b-refuse', found.marks.refuse ?? found.simT, 'cover past the refuse bar (0.42)'],
  ['c-band',   found.marks.band, 'cover through the release band (0.55..0.88)'],
  ['d-rain',   found.marks.rain ?? found.marks.band + 20, 'first drops'],
];
for (const [name, t, why] of stops){
  const p = await page();
  await p.goto(pathToFileURL(FILE).href + `?seed=${found.seed}&pause`);
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const st = await p.evaluate((t) => {
    window.__reseed(); window.__warp(t);
    const c = window.__census().clock;
    return { simT: c.simT, cloud: c.cloud, raining: c.raining, cm: +weatherComing().toFixed(3),
             courtSit: agents.filter(a => !a.street && a.state === 'sit').length,
             streetSit: agents.filter(a => a.street && a.state === 'sit').length,
             courtWalk: agents.filter(a => !a.street && a.state === 'walk').length };
  }, t);
  await p.waitForTimeout(500);
  await p.screenshot({ path: join(OUT, `${TAG}-${name}.png`), clip: CLIP });
  await p.close();
  console.log(`  ${TAG}-${name}.png  t=${st.simT}  cm=${st.cm} cloud=${st.cloud} ${st.raining ? 'RAIN' : '    '}` +
              `  courtyard sitting ${st.courtSit} (walking ${st.courtWalk}) · street sitting ${st.streetSit}   — ${why}`);
}
await browser.close();
