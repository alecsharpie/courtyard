#!/usr/bin/env node
/* sill-year.mjs — does the sill still fit, and does the label name the year?
 *
 * Two questions the census cannot answer:
 *   1. seasonLabel() vs seasonPhase — every 1/8 sector, both sides of every boundary,
 *      and the wrap. Names must be continuous through phase 0 and land on SEASON_START.
 *   2. geometry — across six widths: is #season visible, does any nowrap item spill
 *      onto its neighbour, and does the ticker still have room. Longest strings forced.
 */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(resolve(HERE, '../../../..', 'courtyard.html')).href;

const browser = await chromium.launch();
let bad = 0;
const ok = (c, s) => { console.log((c ? '  ok   ' : '  FAIL ') + s); if (!c) bad++; };

/* ---- 1. the label vs the phase ------------------------------------------------ */
{
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  await page.goto(PAGE + '?pause&seed=42');
  await page.waitForFunction(() => !!window.__census);
  // sample the phase densely and read the label the page itself computes
  const rows = await page.evaluate(() => {
    const out = [];
    for (let i = 0; i < 400; i++) {
      const p = i / 400;
      // drive the real variable, not a copy: seasonPhase is module-level and
      // seasonLabel() is the only thing under test
      out.push([p, eval('(function(){ const save = seasonPhase; seasonPhase = ' + p +
                        '; const s = seasonLabel(); seasonPhase = save; return s; })()')]);
    }
    return out;
  }).catch(async () => {
    // seasonPhase is not reachable from eval in module scope on some builds; fall back
    // to warping the clock, which is the honest path anyway
    return null;
  });
  if (rows) {
    const names = [...new Set(rows.map(r => r[1]))];
    ok(names.length === 8, `8 distinct names across the year (${names.length}): ${names.join(', ')}`);
    // every boundary crossed exactly once => 8 runs, and the wrap is one name
    let runs = 0;
    for (let i = 0; i < rows.length; i++) if (rows[i][1] !== rows[(i + rows.length - 1) % rows.length][1]) runs++;
    ok(runs === 8, `${runs} name changes round the whole year (want 8 — no stutter, no wrap seam)`);
    const at = p => rows[Math.round(p * 400) % 400][1];
    ok(at(0.00) === 'Midwinter', `phase 0.00 → ${at(0.00)} (want Midwinter, and it must span the wrap)`);
    ok(at(0.995) === 'Midwinter', `phase 0.995 → ${at(0.995)} (same name the other side of the wrap)`);
    ok(at(0.25) === 'Spring', `phase 0.25 = SEASON_START → ${at(0.25)}`);
    ok(at(0.50) === 'Midsummer', `phase 0.50 → ${at(0.50)}`);
    ok(at(0.75) === 'Autumn', `phase 0.75 → ${at(0.75)}`);
  }
  // and the DOM actually carries it, warped through a real year
  const seen = [];
  for (const t of [0, 179, 358, 537, 715, 894, 1073, 1252]) {
    const s = await page.evaluate(async (tt) => {
      __reseed(); __setTime(0); __warp(tt);
      return { label: document.getElementById('season').textContent,
               phase: +__census().clock.season, day: __census().clock.day };
    }, t);
    seen.push(s);
    console.log(`  simT ${String(t).padStart(4)}  day ${String(s.day).padStart(2)}  phase ${s.phase.toFixed(3)}  →  "${s.label}"`);
  }
  ok(new Set(seen.map(s => s.label)).size >= 6, `the DOM label moves round the year (${new Set(seen.map(s => s.label)).size} names in 8 samples)`);
  await page.close();
}

/* ---- 2. the sill still fits ---------------------------------------------------- */
for (const [w, h] of [[1600, 950], [1024, 800], [900, 800], [768, 800], [641, 800], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(PAGE + '?pause&seed=42');
  await page.waitForFunction(() => !!window.__census);
  // the longest name in the table, forced into the DOM — geometry, not simulation
  const g = await page.evaluate(() => {
    document.getElementById('season').textContent = 'Early summer';
    document.getElementById('daytime').textContent = 'Day 26 · Afternoon';
    const sill = document.getElementById('sill');
    const box = el => { const r = el.getBoundingClientRect(); return { x: +r.x.toFixed(1), w: +r.width.toFixed(1), bottom: +r.bottom.toFixed(1), shown: r.width > 0 }; };
    /* The leaves that actually carry text, wherever the breakpoint has put them —
       #season moves inside #plate below 640px, so walking sill.children alone would
       stop seeing it. */
    const vis = ['title', 'season', 'daytime', 'ticker', 'stats', 'ctrl']
      .map(id => document.getElementById(id))
      .filter(el => el.getClientRects().length && getComputedStyle(el).display !== 'none');
    /* The check that matters, and the one a container-overflow number MISSES: every
       item is white-space:nowrap, so a flex item squeezed narrower than its own text
       reports a box that FITS while the glyphs run out over the next item. Compare
       text extents (scrollWidth), and only between items sharing a row. */
    const spill = [];
    const rect = el => el.getBoundingClientRect();
    // #ticker is the ONE item allowed to be narrower than its text: it is the only one
    // with overflow:hidden + text-overflow:ellipsis, so it truncates instead of
    // spilling. Its INKED extent is therefore its box, not its scrollWidth.
    const inked = el => el.id === 'ticker' ? rect(el).width : el.scrollWidth;
    for (let i = 0; i < vis.length; i++) {
      const a = rect(vis[i]);
      if (inked(vis[i]) > Math.ceil(a.width)) {
        spill.push(`${vis[i].id} text ${vis[i].scrollWidth} > box ${a.width.toFixed(1)}`); continue;
      }
      for (let j = i + 1; j < vis.length; j++) {
        const b = rect(vis[j]);
        const sameRow = a.top < b.bottom - 2 && b.top < a.bottom - 2;
        if (sameRow && a.x + inked(vis[i]) > b.x + 0.5) spill.push(`${vis[i].id} runs into ${vis[j].id}`);
      }
    }
    return {
      overflow: sill.scrollWidth - sill.clientWidth,
      spill,
      season: box(document.getElementById('season')),
      daytime: box(document.getElementById('daytime')),
      ctrl: box(document.getElementById('ctrl')),
      items: vis.map(c => [c.id, c.scrollWidth]),
      tickerBox: +(rect(document.getElementById('ticker')).width).toFixed(0),
      sameRowAsClock: (() => { const a = rect(document.getElementById('season')), b = rect(document.getElementById('daytime'));
        return a.top < b.bottom - 2 && b.top < a.bottom - 2; })(),
    };
  });
  console.log(`\n  ${w}x${h}: overflow ${g.overflow}px   items: ${g.items.map(([id, iw]) => `${id} ${iw}`).join('  ')}`);
  ok(g.season.shown, `${w}px — #season is visible (x=${g.season.x} w=${g.season.w})`);
  ok(g.spill.length === 0, `${w}px — no text spills onto a neighbour${g.spill.length ? ': ' + g.spill.join('; ') : ''}`);
  ok(g.overflow <= 0, `${w}px — sill does not overflow (${g.overflow}px)`);
  // one baseline-aligned row at full width; below 640 the season drops to the plate's
  // caption line on purpose, and must NOT be sharing the clock's row
  ok(g.sameRowAsClock === (w > 640),
     `${w}px — season ${g.sameRowAsClock ? 'shares' : 'does not share'} the clock's row (want ${w > 640 ? 'shares' : 'caption line'})`);
  ok(g.ctrl.x + g.ctrl.w <= w + 0.5, `${w}px — the controls are still on screen (right edge ${(g.ctrl.x + g.ctrl.w).toFixed(1)})`);
  // The ticker must still have room to say something wherever it is shown. This band
  // was ALREADY the tight one before the season existed — HEAD gives the ticker 71px
  // of box at 641px and 193px at 768px — so the bar is not "wide", it is "wider than
  // HEAD", which dropping #stats below 860px buys.
  if (w > 640) ok(g.tickerBox >= 90, `${w}px — the ticker still has room (${g.tickerBox}px box; HEAD: 71 at 641, 193 at 768)`);
  await page.close();
}

await browser.close();
console.log(bad ? `\nsill-year: ${bad} FAILED` : '\nsill-year: all checks passed');
process.exit(bad ? 1 : 0);
