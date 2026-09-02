/* b143 — is the evening's warm wash a function of the SUN or of the CLOCK?
 *
 * The wash is a local `const dusk` inside applyLight, so there is nothing to call.
 * Rather than expose a hook (or hard-code the formula, which would make the probe an
 * opinion about the build instead of a reading of it), this LIFTS the declarations out
 * of each build's own source — everything between `function applyLight(t){` and
 * `if (dusk > 0)` — and evaluates them in that page's global scope, where `hour`,
 * `sunUp`, `sunDown` and `clamp` all live. Both sides are read the same way, so the
 * instrument cannot favour either.
 *
 * Then, for each day of the year, it solves the instant sunset+k (sunDown moves WITHIN
 * a day near the equinox, so the target is iterated to a fixed point, not assumed) and
 * prints the wash there. The success criterion is a FLAT COLUMN: the same warmth at the
 * same offset from sunset in midwinter and midsummer alike.
 *
 *   node .../probes/dusk-year.mjs [cand] [base]
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url'; import { readFileSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const CAND = process.argv[2] || 'courtyard.html';
const BASE = process.argv[3] || '/tmp/head.html';
const KS = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5];
const DAYS = 26;                                    // SEASON_LEN — one whole year

function prelude(file){
  const src = readFileSync(resolve(file), 'utf8');
  const i = src.indexOf('function applyLight(t){');
  if (i < 0) throw new Error('no applyLight in ' + file);
  const j = src.indexOf('if (dusk > 0)', i);
  if (j < 0) throw new Error('no `if (dusk > 0)` after applyLight in ' + file);
  return src.slice(src.indexOf('{', i) + 1, j);
}

const b = await chromium.launch();
async function readBuild(file){
  const p = await b.newPage({ viewport: { width: 900, height: 600 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=42&pause');
  await p.waitForFunction('typeof __setTime === "function"');
  const out = await p.evaluate(({ pre, KS, DAYS }) => {
    // the build's own declarations, run in the build's own scope
    const wash = new Function(pre + '\n return dusk;');
    const rows = [];
    for (let d = 0; d < DAYS; d++){
      const row = { d };
      for (const k of KS){
        let h = 19 + k;                              // seed the fixed point anywhere
        for (let it = 0; it < 24; it++){
          __setTime(d * DAY_LEN + ((h - DAY_ROLL) / 24) * DAY_LEN);
          const want = sunDown + k;
          if (Math.abs(want - h) < 1e-5) break;
          h = want;
        }
        row[k] = { w: +wash().toFixed(4), h: +hour.toFixed(3), sd: +sunDown.toFixed(3),
                   warmth: +warmth.toFixed(3) };
      }
      rows.push(row);
    }
    return rows;
  }, { pre: prelude(file), KS, DAYS });
  await p.close();
  if (errs.length) console.log('  PAGE ERRORS', file, errs.slice(0, 3));
  return out;
}

const A = await readBuild(BASE), B = await readBuild(CAND);
await b.close();

const F = (n, w = 6) => String(n).padStart(w);
for (const [name, R] of [['HEAD  ' + BASE, A], ['CAND  ' + CAND, B]]){
  console.log('\n== ' + name + ' — the wash at sunset + k ==');
  console.log('  day  warmth  sunDown ' + KS.map(k => F((k >= 0 ? '+' : '') + k)).join(''));
  for (const r of R)
    console.log('  ' + F(r.d, 3) + F(r[KS[0]].warmth, 8) + F(r[KS[0]].sd, 9) + ' ' +
      KS.map(k => F(r[k].w.toFixed(3))).join(''));
  console.log('  ---  spread over the year (max - min at each k):');
  console.log('  ' + ' '.repeat(19) + ' ' + KS.map(k => {
    const v = R.map(r => r[k].w); return F((Math.max(...v) - Math.min(...v)).toFixed(3));
  }).join(''));
}

// the two extremes, named
const wi = A.reduce((a, r) => r[0].warmth < a[0].warmth ? r : a);
const su = A.reduce((a, r) => r[0].warmth > a[0].warmth ? r : a);
console.log('\n== the two dusks the brief names (at sunset itself, k=0) ==');
for (const [lbl, ra] of [['midwinter day ' + wi.d, wi], ['midsummer day ' + su.d, su]]){
  const rb = B[ra.d];
  console.log('  ' + lbl.padEnd(18) + 'sunDown ' + ra[0].sd.toFixed(2) +
    '   HEAD ' + ra[0].w.toFixed(3) + '  ->  CAND ' + rb[0].w.toFixed(3));
}
const flat = k => { const v = B.map(r => r[k].w); return Math.max(...v) - Math.min(...v); };
const worst = Math.max(...KS.map(flat));
console.log('\nVERDICT: candidate spread over the year, worst k = ' + worst.toFixed(4) +
  (worst < 1e-6 ? '  FLAT' : '  NOT FLAT'));
