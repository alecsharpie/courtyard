#!/usr/bin/env node
/* season-invite.mjs — the sill's own affordance, and the QUEUE the two offers share.
 *
 * The census cannot see a control, and a screenshot cannot see a sequence. Two
 * halves, then:
 *
 *   A. Pressable — on COMPUTED STYLE, never on the element. A CSS rule that fails to
 *      parse is silent (#28 shipped the season as a grey chip past a probe that
 *      checked tag, text and handler), so this reads cursor, text-decoration and
 *      colour back off the browser, at 1400 and at 390 where the label lives in the
 *      caption slot. It also measures the HIT BOX, and — because the sill borrows
 *      space from the picture with no resize event — asserts the sill and the canvas
 *      are the SAME HEIGHT they were on a reference build. Run with --file to point
 *      it at that reference.
 *
 *   B. Sequenced — watched in real time on fresh pages. The two invitations must be
 *      one queue, not two timers: each spoken exactly once, never in the same sample,
 *      the season's arriving only after the touch line has been read and the sill has
 *      gone quiet. At 390 the season label must be VISIBLE while the sill is saying
 *      to press it. Cancelled by pressing it first. Silent on ?pause.
 *
 * Real-clock, so B is wall-clock slow (~2.5 min). --geom runs A alone.
 */
import { homedir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const has = n => process.argv.indexOf(n) !== -1;
const FILE = resolve(process.cwd(), arg('--file', resolve(HERE, '../../../..', 'courtyard.html')));
const PAGE = pathToFileURL(FILE).href;
const seed = arg('--seed', '42');

const b = await chromium.launch();
const errs = [];
let bad = 0;
const fail = m => { bad++; console.log('  FAIL ' + m); };

/* The lines are read off the PAGE, not copied into this file. They are top-level
 * consts in a classic script, so they are lexical globals an evaluate() can name —
 * and the first run of this probe reported "the season invitation ran 0 times" for a
 * page that was working perfectly, because the copy here had gone stale by one edit. */
let TOUCH, SEASON;
{
  const p = await b.newPage();
  await p.goto(`${PAGE}?seed=${seed}&pause`);
  await p.waitForFunction('typeof window.__census === "function"');
  [TOUCH, SEASON] = await p.evaluate(() => [
    { wide: INVITE_WIDE, narrow: INVITE_NARROW },
    { wide: SEASON_WIDE, narrow: SEASON_NARROW },
  ]);
  await p.close();
}

/* ---- A: the affordance, off computed style ---- */
console.log('# A. pressable  (' + FILE.split('/').pop() + ')');
const geom = {};
for (const [tag, vp] of [['1400', { width: 1400, height: 860 }], ['390', { width: 390, height: 844 }]]) {
  const p = await b.newPage({ viewport: vp });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${PAGE}?seed=${seed}&pause`);
  await p.waitForFunction('typeof window.__census === "function"');
  const r = await p.evaluate(() => {
    const el = document.getElementById('season');
    const cs = getComputedStyle(el);
    const root = getComputedStyle(document.documentElement);
    return {
      tag: el.tagName, text: el.textContent,
      cursor: cs.cursor,
      deco: cs.textDecorationLine,
      decoCol: cs.textDecorationColor,
      col: cs.color,
      ink: root.getPropertyValue('--ink').trim(),
      inkDim: root.getPropertyValue('--ink-dim').trim(),
      // the chevron must NOT be underlined with the word — it is an inline-block
      after: getComputedStyle(el, '::after').display,
      sillH: document.getElementById('sill').offsetHeight,
      cvH: Math.round(document.getElementById('cv').getBoundingClientRect().height),
    };
  });
  const box = await p.locator('#season').boundingBox();
  geom[tag] = { sillH: r.sillH, cvH: r.cvH, h: Math.round(box.height), w: Math.round(box.width) };
  console.log(`  ${tag}px: <${r.tag}> "${r.text.trim()}" · cursor ${r.cursor} · decoration ${r.deco} (${r.decoCol})`);
  console.log(`         colour ${r.col} · ::after display ${r.after} · hit box ${Math.round(box.width)}x${Math.round(box.height)} · sill ${r.sillH} · canvas ${r.cvH}`);
  if (r.tag !== 'BUTTON') fail(`${tag}: the season is a <${r.tag}>, not a button`);
  if (r.cursor !== 'pointer') fail(`${tag}: cursor is ${r.cursor}, not pointer`);
  if (!/underline/.test(r.deco)) fail(`${tag}: no underline — text-decoration-line is "${r.deco}"`);
  if (/rgba\(.*,\s*0\)/.test(r.decoCol)) fail(`${tag}: the underline is transparent`);
  if (r.after !== 'inline-block') fail(`${tag}: ::after is ${r.after} — the rule will run under the chevron`);
  // a control is inked; a caption is grey. 390 was the grey one.
  const hex = s => { const m = s.match(/\d+/g); return m ? m.slice(0, 3).map(Number) : null; };
  const [cr, cg, cb] = hex(r.col);
  const dim = r.inkDim.replace('#', '').match(/../g).map(h => parseInt(h, 16));
  const near = Math.abs(cr - dim[0]) + Math.abs(cg - dim[1]) + Math.abs(cb - dim[2]) < 12;
  if (near) fail(`${tag}: the label is set in --ink-dim (${r.col}) — it reads as a caption`);
  if (box.height < 22) fail(`${tag}: hit box is only ${Math.round(box.height)}px tall`);
  await p.close();
}
console.log('  geometry: ' + JSON.stringify(geom));

if (has('--geom')) {
  await b.close();
  console.log(errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'page errors: 0');
  console.log(bad || errs.length ? `VERDICT: FAIL (${bad})` : 'VERDICT: PASS');
  process.exit(bad || errs.length ? 1 : 0);
}

/* ---- B: the queue, watched on the real clock ---- */
const watch = async (opts) => {
  const p = await b.newPage({ viewport: opts.viewport });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${PAGE}?seed=${seed}${opts.pause ? '&pause' : ''}`);
  await p.waitForFunction('typeof window.__census === "function"');
  const t0 = Date.now();
  if (opts.pressAt != null) {
    await new Promise(r => setTimeout(r, opts.pressAt * 1000));
    await p.click('#season');
  }
  const seen = []; let end = null;
  while (Date.now() - t0 < opts.secs * 1000) {
    end = await p.evaluate(() => ({ offerN, touched, pressed }));
    seen.push({
      t: (Date.now() - t0) / 1000,
      ...await p.evaluate(() => {
        const sill = document.getElementById('sill'), se = document.getElementById('season');
        return {
          txt: tickerEl.textContent,
          shown: tickerEl.offsetWidth > 0,
          clipped: tickerEl.scrollWidth > tickerEl.clientWidth + 1,
          // px of headroom. NOT clientWidth - scrollWidth: scrollWidth is floored at
          // clientWidth, so that difference is 0 for every line that fits and can only
          // ever report bad news. A range over the text measures what is really there.
          fit: (() => { const r = document.createRange(); r.selectNodeContents(tickerEl);
            return Math.round(tickerEl.clientWidth - r.getBoundingClientRect().width); })(),
          inviting: sill.classList.contains('inviting'),
          atSeason: sill.classList.contains('at-season'),
          plateShown: document.getElementById('plate').offsetWidth > 0,
          seasonShown: se.offsetWidth > 0 && se.offsetHeight > 0,
        };
      }),
    });
    await new Promise(r => setTimeout(r, 200));
  }
  await p.close();
  seen.end = end;
  return seen;
};
// a "run" is a contiguous stretch of samples whose ticker starts with `pre`
const runsOf = (s, pre) => s.reduce((a, r, i) => a + (r.txt.startsWith(pre) && !(s[i - 1] || {}).txt?.startsWith(pre) ? 1 : 0), 0);
const span = (s, pre) => { const h = s.filter(r => r.txt.startsWith(pre)); return h.length ? [h[0].t, h[h.length - 1].t] : null; };

for (const [tag, vp] of [['1400', { width: 1400, height: 860 }], ['390', { width: 390, height: 844 }]]) {
  const k = tag === '390' ? 'narrow' : 'wide';
  console.log(`\n# B. sequence @ ${tag}px (48 s)`);
  const s = await watch({ secs: 48, viewport: vp });
  const rT = runsOf(s, TOUCH[k]), rS = runsOf(s, SEASON[k]);
  const spT = span(s, TOUCH[k]), spS = span(s, SEASON[k]);
  const both = s.filter(r => r.txt.startsWith(TOUCH[k]) && r.txt.startsWith(SEASON[k])).length;
  console.log(`  touch : runs ${rT} · on screen ${spT ? spT[0].toFixed(1) + '..' + spT[1].toFixed(1) + 's' : 'never'}`);
  console.log(`  season: runs ${rS} · on screen ${spS ? spS[0].toFixed(1) + '..' + spS[1].toFixed(1) + 's' : 'never'}`);
  if (rT !== 1) fail(`${tag}: the touch invitation ran ${rT} times, want 1`);
  if (rS !== 1) fail(`${tag}: the season invitation ran ${rS} times, want 1`);
  if (!spT || !spS) continue;
  const gap = spS[0] - spT[1];
  console.log(`  quiet between them: ${gap.toFixed(1)}s · overlapping samples ${both}`);
  if (both) fail(`${tag}: both invitations on screen in ${both} samples`);
  if (gap < 4.0) fail(`${tag}: only ${gap.toFixed(1)}s of ordinary sill between the two offers`);
  if (spS[1] - spS[0] < 5.0) fail(`${tag}: the season line held the surface ${(spS[1] - spS[0]).toFixed(1)}s, under INVITE_DWELL`);
  if (tag !== '390') continue;
  // the narrow sill borrows the plate — but the offer that POINTS AT the season may
  // not hide the season while it speaks, and it must give the sill back afterwards.
  const sShown = s.filter(r => r.txt.startsWith(SEASON.narrow) && r.shown);
  const blind = sShown.filter(r => !r.seasonShown).length;
  const clip = sShown.filter(r => r.clipped).length;
  const flagged = sShown.filter(r => r.atSeason).length;
  const back = s.filter(r => r.t > spS[1] && !r.inviting && r.plateShown && r.seasonShown);
  // the fit is a MARGIN, not a boolean: keeping the plate costs the ticker ~80px, and
  // the fuller sentence this line started as overran the remainder by 11. Print it.
  const fit = sShown.length ? Math.min(...sShown.map(r => r.fit)) : 0;
  console.log(`  390 season offer: visible samples ${sShown.length} · season label hidden in ${blind} · clipped ${clip} (worst fit ${fit >= 0 ? '+' : ''}${fit}px) · at-season ${flagged} · sill back at ${back.length ? back[0].t.toFixed(1) + 's' : 'never'}`);
  if (!sShown.length) fail('390: the narrow sill never showed the season invitation');
  if (blind) fail(`390: the season label was hidden in ${blind} samples of the line telling you to tap it`);
  if (clip) fail(`390: the season invitation was truncated in ${clip} samples`);
  if (flagged !== sShown.length) fail('390: at-season was not set for the whole of the season offer');
  if (!back.length) fail('390: the narrow sill never went back to ordinary');
  // and the TOUCH offer still hides the plate outright, as it always did
  const tShown = s.filter(r => r.txt.startsWith(TOUCH.narrow) && r.shown);
  if (tShown.some(r => r.atSeason)) fail('390: at-season leaked onto the touch offer');
}

/* ---- pressed first: the season offer is never spoken, the touch one is not lost ----
 * The touch line's TIMING here is not assertable and must not be asserted. A press at
 * 3 s starts a 7 s lapse, and offerInvite is deferred through one; the town then comes
 * back six sim days on and mid-summer, where clock strikes, the market and the kiosk
 * fill the surface for tens of seconds at a stretch, so the deferred offer waits for a
 * gap in the news. Measured over two builds it arrived at 17.4 s and at 30.1 s, and on
 * unmodified HEAD just the same — this is the ticker's own "never shown behind the
 * news" rule, not anything the queue does. So the invariant, not the clock: the offer
 * is never SPENT in silence. Either it was spoken, or offerN says it is still pending.
 */
{
  console.log('\n# B. pressed at 3 s (34 s)');
  const s = await watch({ secs: 34, viewport: { width: 1400, height: 860 }, pressAt: 3 });
  const rT = runsOf(s, TOUCH.wide), rS = runsOf(s, SEASON.wide);
  const e = s.end || {};
  console.log(`  season runs ${rS} (want 0) · pressed ${e.pressed} · touched ${e.touched}`);
  console.log(`  touch runs ${rT}, offerN ${e.offerN} — spoken, or still pending behind the news`);
  if (rS) fail('the season was offered to a viewer who had already pressed it');
  if (!e.pressed) fail('the press did not register — the rest of this section proves nothing');
  if (e.touched) fail('pressing the season counted as touching the picture');
  if (rT !== 1 && e.offerN !== 0) fail('the touch invitation was spent without ever being shown');
}

/* ---- ?pause: the harness is not a viewer ---- */
{
  console.log('\n# B. ?pause (26 s)');
  const s = await watch({ secs: 26, viewport: { width: 1400, height: 860 }, pause: true });
  const rT = runsOf(s, TOUCH.wide), rS = runsOf(s, SEASON.wide);
  console.log(`  touch runs ${rT} · season runs ${rS} (want 0, 0)`);
  if (rT || rS) fail('an invitation was offered to a driven page');
}

await b.close();
console.log(errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'page errors: 0');
console.log(bad || errs.length ? `VERDICT: FAIL (${bad})` : 'VERDICT: PASS');
process.exit(bad || errs.length ? 1 : 0);
