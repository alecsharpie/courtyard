/* The tenant on the leads (#170). Four questions the census and the screenshots cannot
 * answer, and one control that makes a zero mean something.
 *
 * PREMISE. The brief's claim is that no person has ever stood on our own block. That is
 * a claim about HEAD, so it is COUNTED on HEAD — regenerated from `git show` inside the
 * probe, so the fixture is never whatever last wrote it. HEAD must read 0 people south
 * of the lane; the candidate must read non-zero, or the leads have a tenant who never
 * comes up. (roof-life.mjs's own control, narrowed from "life" to PEOPLE.)
 *
 * CONTAINMENT. A new walkable region south of the lane must not leak: every tenant
 * sample has to sit inside its own bay's x span and on the two lead rows, and their
 * SCREEN DEPTH (y - z*LIFT) has to stay south of LN_WALK_S — the arithmetic eaveFor()
 * states for the whole block, and the reason the evening stand was put at the bay's east
 * end rather than at the parapet. A figure that draws at depth < 79 is drawn standing in
 * the lane's footway in front of walkers a cached roof cannot cover.
 *
 * CONTINUITY. motion.mjs folds tenants into `walker` (they are agents, and __entities
 * reports role, not kind), and none spawned inside its sampling windows — so the gate is
 * silent about them rather than clean. Per-step displacement is measured here instead.
 *
 * ERRANDS. Each act has to actually fire over a run of days, and the rain response is
 * the brief's own success line: when it comes on, somebody takes the washing in.
 * usage: node probe-tenant.mjs [seeds=12] [days=8]
 */
import path from 'path'; import fs from 'fs';
import { execSync } from 'child_process';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
const PW = path.join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = path.resolve(new URL('.', import.meta.url).pathname, '../../../..');
const N = +(process.argv[2] || 12), DAYS = +(process.argv[3] || 8);
const HEAD = path.join(REPO, '.probe-head.html');
fs.writeFileSync(HEAD, execSync('git show HEAD:courtyard.html', { cwd: REPO, maxBuffer: 1 << 28 }));

const br = await chromium.launch();
async function run(file, label){
  const url = 'file://' + path.resolve(file);
  const T = { samples:0, present:0, acts:{}, maxAtOnce:0, bays:0,
              offBay:0, northOfLeads:0, minDepth:99, maxJump:0, nan:0,
              scaleMin:9, scaleMax:0, takeInRain:0, takes:0, pegs:0, spawned:0, why:{} };
  for (let seed = 1; seed <= N; seed++){
    const p = await br.newPage();
    await p.setViewportSize({ width: 1600, height: 950 });
    await p.goto(`${url}?seed=${seed}&t=0&pause`); await p.waitForTimeout(350);
    const r = await p.evaluate((DAYS) => {
      window.__reseed();
      const S = { samples:0, present:0, acts:{}, maxAtOnce:0, bays:0,
                  offBay:0, northOfLeads:0, minDepth:99, maxJump:0, nan:0,
                  scaleMin:9, scaleMax:0, takeInRain:0, takes:0, pegs:0, spawned:0, why:{} };
      S.bays = typeof LEADS_BAYS === 'undefined' ? 0 : LEADS_BAYS.length;
      const last = new Map();       // id -> [x,y], for per-step displacement
      const seen = new Set();
      // a PERSON on the block, not life on it: the boat runs downriver between the
      // block's two halves, so the river channel is excluded exactly as roof-life does
      const onBlock = a => a.y > 79 && !(a.x >= QUAY_X0 && a.x < RIVER_X1);
      while (window.__census().clock.day < DAYS){
        window.__warp(0.25);
        S.samples++;
        const up = agents.filter(onBlock);
        if (up.length) S.present++;
        S.maxAtOnce = Math.max(S.maxAtOnce, up.length);
        for (const a of up){
          if (a.__id === undefined) a.__id = Math.random();
          const id = a.__id;
          if (!seen.has(id)){
            seen.add(id); S.spawned++;
            /* WHY the errand fired, read at the SPAWN and not during the stand: rain
             * flips washOut() directly, but wetF() > 0.22 holds it false for a good
             * while after, so the weather during the walk is not the cause of it. */
            const want = a.stops && a.stops[0] ? a.stops[0].act : '?';
            if (want === 'take'){
              const why = raining ? 'rain' : wetF() > 0.22 ? 'wet' : snowCover > 0.04 ? 'snow' : 'light';
              S.why[why] = (S.why[why] || 0) + 1;
            }
          }
          const act = a.tenant ? (a.act || a.state) : ('NOT-A-TENANT:' + (a.kind || '?'));
          S.acts[act] = (S.acts[act] || 0) + 1;
          if (!isFinite(a.x) || !isFinite(a.y) || !isFinite(a.z)) S.nan++;
          if (a.tenant){
            // inside its OWN bay, party wall to party wall, and on the lead rows
            if (a.bay && (a.x < a.bay.x0 - 0.1 || a.x > a.bay.x1 + 0.1)) S.offBay++;
            if (a.y < LEADS_Y0 - 0.1) S.northOfLeads++;
            const d = a.y - roofWalkZ(a.x, a.y) * LIFT;   // the depth they are DRAWN at
            S.minDepth = Math.min(S.minDepth, d);
            const sc = nearScale(a.y);
            S.scaleMin = Math.min(S.scaleMin, sc); S.scaleMax = Math.max(S.scaleMax, sc);
            if (a.act === 'take'){ S.takes++; if (raining) S.takeInRain++; }
            if (a.act === 'peg') S.pegs++;
          }
          const pv = last.get(id);
          if (pv) S.maxJump = Math.max(S.maxJump, Math.hypot(a.x - pv[0], a.y - pv[1]));
          last.set(id, [a.x, a.y]);
        }
      }
      return S;
    }, DAYS);
    T.samples += r.samples; T.present += r.present; T.spawned += r.spawned;
    T.maxAtOnce = Math.max(T.maxAtOnce, r.maxAtOnce); T.bays = r.bays;
    T.offBay += r.offBay; T.northOfLeads += r.northOfLeads; T.nan += r.nan;
    T.minDepth = Math.min(T.minDepth, r.minDepth); T.maxJump = Math.max(T.maxJump, r.maxJump);
    T.scaleMin = Math.min(T.scaleMin, r.scaleMin); T.scaleMax = Math.max(T.scaleMax, r.scaleMax);
    T.takes += r.takes; T.takeInRain += r.takeInRain; T.pegs += r.pegs;
    for (const k in r.acts) T.acts[k] = (T.acts[k] || 0) + r.acts[k];
    for (const k in r.why) T.why[k] = (T.why[k] || 0) + r.why[k];
    await p.close();
  }
  const pc = (a, b) => b ? (100 * a / b).toFixed(2).padStart(6) + '%' : '   n/a';
  console.log(`\n${label}  (${N} seeds x ${DAYS} days, ${T.samples} samples of 0.25s)`);
  console.log(`  terraces built                 ${T.bays}`);
  console.log(`  samples with a PERSON on the block ${pc(T.present, T.samples)} (${T.present}/${T.samples})`);
  console.log(`  distinct people who came up    ${T.spawned}   most at once ${T.maxAtOnce}`);
  console.log(`  what they were doing           ${JSON.stringify(T.acts)}`);
  if (T.spawned){
    console.log(`  CONTAINMENT  off their bay ${T.offBay} · north of the leads ${T.northOfLeads} · NaN ${T.nan}`);
    console.log(`               shallowest DRAWN depth ${T.minDepth.toFixed(2)}  (must stay > ${79} = LN_WALK_S)`);
    console.log(`  CONTINUITY   largest step ${T.maxJump.toFixed(3)} cells in 0.25s`);
    console.log(`  drawn at nearScale ${T.scaleMin.toFixed(2)}..${T.scaleMax.toFixed(2)}  (NEAR_SZ 1.95)`);
    console.log(`  washing      pegged-out samples ${T.pegs} · taking-in samples ${T.takes}`);
    console.log(`  WHY it came in (at the spawn) ${JSON.stringify(T.why)}`);
  }
}
await run(HEAD, 'HEAD (control: nobody has ever stood on the block)');
await run(path.join(REPO, 'courtyard.html'), 'candidate');
await br.close();
fs.unlinkSync(HEAD);
