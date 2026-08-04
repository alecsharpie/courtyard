/* seats-out — does the COURTYARD get up when the sky thickens, and does anyone
 * vanish where they sat?
 *
 *     node probe-seats-out.mjs [file...]        default: HEAD vs working tree
 *
 * c11, open since #5: street sitters refuse a seat above weatherComing() 0.42 and are
 * released over 0.55..0.88 off a per-agent a.wary; the courtyard sat through the front
 * because both gates read a.street. The census cannot answer this — it samples nine
 * fixed (seed, time) cells, so whether one of them is under a front is luck. This walks
 * the sim and watches the seats themselves.
 *
 * Four questions:
 *   1. Do courtyard seats get REFUSED under a building front, and RELEASED once it
 *      passes the personal band — at the same per-person stagger the cafe empties at?
 *   2. Does anybody vanish where they sat? (The reason c11 stayed open: a courtyard sit
 *      is assigned at the last waypoint, so a naive refusal is `a.done` on the lawn.)
 *   3. Do picnic PAIRS stay together — never one half on the blanket with the other gone?
 *   4. Under a CLEAR sky, is the courtyard unchanged? A seat feature that thins a blue
 *      afternoon is a bug, so the standing population is split by cover band, as #6 did.
 *
 * Everything is read from `agents` inside ONE page.evaluate per seed: the renderer draws
 * from R(), so a host round-trip mid-measurement walks the seeded stream (#29).
 */
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const FILES = process.argv.slice(2).length ? process.argv.slice(2)
  : ['/tmp/courtyard-head.html', 'courtyard.html'];
const SEEDS = [3, 7, 11, 19, 42, 63, 101, 1234];
const STEP = 0.25, SPAN = 660;                 // 12 sim days — fronts are rare, sweep wide

const browser = await chromium.launch();

async function run(file, seed){
  const p = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(pathToFileURL(resolve(file)).href + `?seed=${seed}&pause`);
  await p.waitForFunction(() => typeof window.__warp === 'function');

  const out = await p.evaluate(({ STEP, SPAN }) => {
    window.__reseed();
    const COURT_SIT = { picnic: 1, sitter: 1 };          // the two kinds c11 is about
    const seen = new Map();                              // agent object -> our notes
    const releases = [], refusals = [], vanished = [], splits = [], radii = [];

    /* __warp(0.25) is 7-8 sub-steps of 1/30 s and we only see the boundary, so a sit
     * that starts and ends inside one window is invisible to sampling — that is why the
     * refusal count is taken at SIM resolution instead, by wrapping the one function
     * both paths go through. Called with a sitter still on their feet = a refused seat;
     * called with one sitting = a release. The wrapper only records and delegates. */
    const _rte = window.routeToExit;
    window.routeToExit = function (a){
      if (COURT_SIT[a.kind]){
        if (a.state === 'sit') refusals.exactReleases++;
        else refusals.push({ simT: window.__census().clock.simT, kind: a.kind, cm: weatherComing() });
      }
      return _rte.apply(this, arguments);
    };
    refusals.exactReleases = 0;
    // standing sit-population by cloud band, courtyard vs street: the blue-sky control
    const bands = [0, 0, 0].map(() => ({ n: 0, court: 0, street: 0 }));
    let alive = new Set();

    const bandOf = c => c < 0.30 ? 0 : c < 0.60 ? 1 : 2;

    for (let t = 0; t < SPAN; t += STEP){
      window.__warp(STEP);
      const cm = weatherComing(), simT = +window.__census().clock.simT;
      const now = new Set(agents);

      /* despawns: anybody in `alive` who is no longer in `agents` */
      for (const a of alive){
        if (now.has(a)) continue;
        const note = seen.get(a);
        if (!note) continue;
        /* "nobody vanishes where they sat": a legitimate exit ends OFF the grid
         * (exitLeg's last waypoint is laneEdge() or e.out), so a courtyard kind whose
         * last seen position is still inside the walls did not walk out of anywhere.
         * Testing the state at despawn would miss it — a bad refusal sets `done` while
         * still labelled 'walk', standing on the lawn. */
        if (COURT_SIT[note.kind]){
          const r = Math.hypot(note.x - CX, note.y - CY);
          radii.push(+r.toFixed(1));                 // so a zero above is a gate, not a tautology
          if (r < 16) vanished.push({ simT, kind: note.kind, everSat: note.everSat,
                                      x: +note.x.toFixed(1), y: +note.y.toFixed(1) });
        }
      }

      let court = 0, street = 0;
      for (const a of agents){
        let note = seen.get(a);
        if (!note){
          note = { kind: a.kind, lastState: a.state, everSat: false, maxCm: cm, x: a.x, y: a.y };
          seen.set(a, note);
        }
        note.x = a.x; note.y = a.y;
        if (cm > note.maxCm) note.maxCm = cm;
        if (a.state === 'sit'){
          note.everSat = true;
          if (a.street) street++; else if (COURT_SIT[a.kind]) court++;
        }
        /* the transition c11 is about: on a seat, then up */
        if (note.lastState === 'sit' && a.state !== 'sit'){
          releases.push({ simT, kind: a.kind, street: !!a.street, cm: +cm.toFixed(3),
                          wary: +(a.wary ?? 0.5).toFixed(3), raining: !!window.__census().clock.raining });
        }
        note.lastState = a.state;

        /* a picnic pair shares one blanket: neither half may sit alone once seated */
        if (a.kind === 'picnic' && a.state === 'sit' && a.mate && !now.has(a.mate))
          splits.push({ simT, why: 'mate despawned' });
      }

      const b = bands[bandOf(cloudCover())];
      b.n++; b.court += court; b.street += street;
      alive = now;
    }

    return { releases, refusals, vanished, splits, bands, radii };
  }, { STEP, SPAN });

  await p.close();
  return { ...out, errs };
}

/* how tightly does one front empty its seats? group releases into fronts (gaps > 25 s
   sim start a new one) and report the spread from first up to last up. */
function stagger(rel){
  const rs = rel.filter(r => !r.raining && r.cm > 0.5).sort((a, b) => a.simT - b.simT);
  const groups = []; let g = null;
  for (const r of rs){
    if (!g || r.simT - g[g.length - 1].simT > 25){ g = []; groups.push(g); }
    g.push(r);
  }
  const multi = groups.filter(x => x.length > 1);
  if (!multi.length) return { fronts: groups.length, pairs: 0, spread: null };
  const spreads = multi.map(x => x[x.length - 1].simT - x[0].simT);
  return { fronts: groups.length, pairs: multi.length,
           spread: +(spreads.reduce((a, b) => a + b, 0) / spreads.length).toFixed(2) };
}

for (const file of FILES){
  const tot = { rel: [], ref: 0, van: [], spl: 0, rad: [], bands: [0,1,2].map(() => ({ n:0, court:0, street:0 })), errs: 0 };
  console.log(`\n=== ${file} ===`);
  for (const seed of SEEDS){
    const r = await run(file, seed);
    tot.rel.push(...r.releases); tot.ref += r.refusals.length;
    tot.van.push(...r.vanished); tot.spl += r.splits.length; tot.errs += r.errs.length; tot.rad.push(...r.radii);
    r.bands.forEach((b, i) => { tot.bands[i].n += b.n; tot.bands[i].court += b.court; tot.bands[i].street += b.street; });
    const skyRel = r.releases.filter(x => !x.raining && x.cm > 0.5);
    console.log(`  seed ${String(seed).padStart(4)}  court-seats REFUSED ${String(r.refusals.length).padStart(2)}` +
                `  released-by-sky ${String(skyRel.filter(x => !x.street).length).padStart(2)} court /` +
                ` ${String(skyRel.filter(x => x.street).length).padStart(2)} street` +
                `  VANISHED-SITTING ${r.vanished.length}  pair-splits ${r.splits.length}` +
                (r.errs.length ? `  PAGE ERRORS ${r.errs.length}` : ''));
  }
  const court = tot.rel.filter(r => !r.street), street = tot.rel.filter(r => r.street);
  const sc = stagger(court), ss = stagger(street);
  console.log(`  ---`);
  console.log(`  court seats refused under a front : ${tot.ref}`);
  console.log(`  released by the sky (dry, cm>0.5) : ${court.filter(r => !r.raining && r.cm > 0.5).length} courtyard,` +
              ` ${street.filter(r => !r.raining && r.cm > 0.5).length} street`);
  console.log(`  stagger, mean sim s first-up..last-up: courtyard ${sc.spread ?? '–'} (${sc.pairs}/${sc.fronts} fronts lifted >1)` +
              ` · street ${ss.spread ?? '–'} (${ss.pairs}/${ss.fronts})`);
  const cm = tot.rel.filter(r => !r.street && !r.raining && r.cm > 0.5).map(r => r.cm);
  if (cm.length) console.log(`  courtyard release cover: min ${Math.min(...cm).toFixed(3)} max ${Math.max(...cm).toFixed(3)}` +
                             ` mean ${(cm.reduce((a,b)=>a+b,0)/cm.length).toFixed(3)}   (band is 0.55..0.88)`);
  console.log(`  VANISHED WHERE THEY SAT: ${tot.van.length}   PAIR SPLITS: ${tot.spl}   page errors: ${tot.errs}`);
  console.log(`    (despawn radius from the courtyard centre, n=${tot.rad.length}: min ${Math.min(...tot.rad)} — the test fires under 16,`
              + ` and a seat is at 3-12, so the zero above is a gate)`);
  const nm = ['cover<0.30', '0.30-0.60', 'cover>0.60'];
  tot.bands.forEach((b, i) => console.log(`  ${nm[i]}  samples ${String(b.n).padStart(6)}` +
    `  mean sitting: courtyard ${(b.court / (b.n || 1)).toFixed(3)}  street ${(b.street / (b.n || 1)).toFixed(3)}`));
}

await browser.close();
