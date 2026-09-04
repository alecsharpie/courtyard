#!/usr/bin/env node
/* probe-ticker-fit.mjs — how much of the ticker's CORPUS fits the ticker's SLOT.
 *
 * Two numbers, at every size the ticker is shown at:
 *   slot   — #ticker's content box, in CSS px (flex:1 leftover of the sill row)
 *   corpus — the rendered width of every sentence the town can put on that surface,
 *            measured in the ticker's own computed font by an off-screen span
 *            (not canvas measureText: letter-spacing and italic serif kerning are
 *            the DOM's, so ask the DOM).
 *
 * The corpus is lifted STATICALLY out of the script: a comment-stripping scanner,
 * then every string literal shaped like a sentence, with `a + expr + b`
 * concatenations merged around a placeholder as wide as the widest insert the page
 * can name. Static beats sampling here — a line drawn at R()<0.02 would take a
 * thousand warps to observe and is exactly as clipped as a common one.
 */
import { homedir } from 'node:os';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../../..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
// `--head` measures the SAME corpus against the committed build, regenerated from git
// so the fixture can never drift; it is the control every number below is quoted against.
const HEAD = process.argv.includes('--head');
if (HEAD) writeFileSync(resolve(ROOT, '.probe-head.html'),
  execFileSync('git', ['show', 'HEAD:courtyard.html'], { cwd: ROOT, maxBuffer: 64 << 20 }));
const FILE = HEAD ? resolve(ROOT, '.probe-head.html') : resolve(ROOT, arg('--file', 'courtyard.html'));
const PAGE = pathToFileURL(FILE).href;
const TOPN = +arg('--top', 12);
const WARP = +arg('--warp', 175);   // a SETTLED town: the counts sit at their widest form
                                    // for the median and the 95th centile of the year, so
                                    // this is the slot the ticker has almost always. --warp 0
                                    // is the other end: a page one second old, counts at
                                    // `0 people - 0 blooms`, which is the narrowest room the
                                    // reserve ever hands out.

/* ---- scanner: strip comments, collect string literals with positions ---- */
function literals(src){
  const out = []; let i = 0; const n = src.length;
  while (i < n){
    const c = src[i];
    if (c === '/' && src[i + 1] === '/'){ while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*'){ i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    if (c === "'" || c === '"' || c === '`'){
      const q = c, start = i; i++; let v = '';
      while (i < n && src[i] !== q){
        if (src[i] === '\\'){ const e = src[i + 1]; v += e === 'n' ? '\n' : e === 't' ? '\t' : e; i += 2; continue; }
        v += src[i]; i++;
      }
      i++; out.push({ v, start, end: i, q });
      continue;
    }
    i++;
  }
  return out;
}
const html = readFileSync(FILE, 'utf8');
const s0 = html.indexOf('<script>'), s1 = html.lastIndexOf('</script>');
const src = html.slice(s0 + 8, s1);
const lits = literals(src);

/* sentence-shaped: prose the town could say */
const OPEN = /^[A-Z‘“…]/;
const CLOSE = /[.!?…]$/;
const sentence = v => OPEN.test(v.trim()) && CLOSE.test(v.trim())
  && (v.match(/ /g) || []).length >= 2 && v.length >= 18 && !/[<>{}=]/.test(v) && !v.includes('\n');

/* merge `'a ' + expr + ' b'` into one sentence around a placeholder */
const PLACE = '␟';
const merged = [];
for (let k = 0; k < lits.length; k++){
  let text = lits[k].v, end = lits[k].end;
  for (;;){
    const nx = lits[k + 1]; if (!nx) break;
    const mid = src.slice(end, nx.start);
    if (/^\s*\+\s*$/.test(mid)) text += nx.v;
    else if (/^\s*\+[^;{},]*\+\s*$/.test(mid) && mid.length < 60) text += PLACE + nx.v;
    else break;
    end = nx.end; k++;
  }
  merged.push(text);
}
const corpusRaw = [...new Set(merged.filter(sentence))];

const b = await chromium.launch();
const p = await b.newPage();
const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto(`${PAGE}?seed=42&t=0&pause`);
await p.waitForFunction('typeof window.__warp === "function"');
await p.evaluate((t) => { window.__reseed(); if (t > 0) window.__warp(t, 1 / 30); refreshStats(); }, WARP);

/* the widest thing that can land in a PLACE slot, asked of the page */
const insert = await p.evaluate(() => {
  const pool = [];
  try { SPECIES.forEach(s => pool.push(s.name)); } catch {}
  try { VANES.forEach(v => pool.push(v.name)); } catch {}
  pool.push('south-west');
  // NOUNS only: the `+ expr +` slots in this corpus take a crop, a vane or a
  // compass bearing. (REED_WORDS is prose and is announced whole, so it is in the
  // corpus already — dropping it in HERE would report one line inside another.)
  return pool.filter(x => typeof x === 'string' && x.length < 24).sort((a, b) => b.length - a.length)[0] || 'chrysanthemum';
});
const corpus = corpusRaw.map(t => t.split(PLACE).join(insert));

const SIZES = [[1600, 950], [1440, 900], [1280, 800], [1024, 700], [900, 700], [860, 700], [768, 700], [700, 700], [641, 700]];
const rows = [];
for (const [w, h] of SIZES){
  await p.setViewportSize({ width: w, height: h });
  await p.waitForTimeout(60);
  const r = await p.evaluate((list) => {
    const t = document.getElementById('ticker');
    const cs = getComputedStyle(t);
    if (cs.display === 'none') return { hidden: true };
    const box = t.getBoundingClientRect().width;
    const m = document.createElement('span');
    m.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;left:-9999px;top:0';
    m.style.font = cs.font; m.style.letterSpacing = cs.letterSpacing;
    document.body.appendChild(m);
    const wide = s => { m.textContent = s; return m.offsetWidth; };
    const widths = list.map(wide);
    /* What the surface would ACTUALLY show, and whether the cut lands inside a word.
     * With the fix in place that is the page's own fitLine(); on HEAD there is no such
     * function and the cut is the CSS ellipsis's, which is the longest prefix that fits
     * beside a '…' — so simulate exactly that and ask the same question of it. */
    const has = typeof fitLine === 'function';
    // the slot the LINE gets is the box less whatever the counts can still grow into
    const room = has && typeof tickRoom === 'function' ? tickRoom() : box;
    const cuts = list.map((txt, i) => {
      if (widths[i] <= room - (has ? 2 : 0)) return { cut: false, mid: false };
      let body;
      if (has){
        const shown = fitLine(txt, room); body = shown.replace(/…$/, '');
        // a box too narrow for even ONE word is still the CSS's to cut, so say so
        if (wide(shown) > room) return { cut: true, mid: true, still: true, body };
      }
      else {
        let lo = 0, hi = txt.length, k = 0;
        while (lo <= hi){ const mm = (lo + hi) >> 1; if (wide(txt.slice(0, mm) + '…') <= room){ k = mm; lo = mm + 1; } else hi = mm - 1; }
        body = txt.slice(0, k);
      }
      const nxt = txt[body.length];
      return { cut: body.length < txt.length, mid: body.length < txt.length && !!nxt && !/[\s.,;:!?—]/.test(nxt), body };
    });
    m.remove();
    return { slot: box, room, widths, cuts, has };
  }, corpus);
  if (r.hidden){ rows.push({ w, h, hidden: true }); continue; }
  const pairs = corpus.map((t, i) => ({ t, px: r.widths[i], ...r.cuts[i] })).sort((a, b) => b.px - a.px);
  rows.push({ w, h, has: r.has, slot: r.slot, room: r.room, max: pairs[0].px,
    over: pairs.filter(x => x.cut).length, mid: pairs.filter(x => x.mid).length, pairs });
}

console.log(`warped ${WARP}s - counts read "${await p.evaluate(() => document.getElementById('stats').textContent)}"`);
{
  const px = [...rows.find(r => !r.hidden).pairs].map(x => x.px).sort((a, b) => a - b);
  const q = f => px[Math.floor(f * (px.length - 1))];
  console.log(`corpus widths: p25 ${q(0.25).toFixed(0)}  median ${q(0.5).toFixed(0)}  p75 ${q(0.75).toFixed(0)}  p95 ${q(0.95).toFixed(0)}  max ${q(1).toFixed(0)}`);
}
console.log(`corpus: ${corpus.length} sentences - insert placeholder "${insert}"`);
console.log(`composer: ${rows.find(r => !r.hidden).has ? 'fitLine() (this build)' : 'CSS text-overflow:ellipsis'}`);
console.log('size        slot px  room px   widest px    shortened     CUT MID-WORD');
let midTotal = 0;
for (const r of rows){
  if (r.hidden){ console.log(`${(r.w + 'x' + r.h).padEnd(11)} (ticker hidden)`); continue; }
  midTotal += r.mid;
  console.log(`${(r.w + 'x' + r.h).padEnd(11)} ${r.slot.toFixed(1).padStart(7)} ${r.room.toFixed(1).padStart(8)} ${r.max.toFixed(0).padStart(11)}   ${String(r.over).padStart(4)}/${corpus.length}      ${String(r.mid).padStart(4)}/${corpus.length}`);
}
console.log(`mid-word cuts, all sizes: ${midTotal}`);
const first = rows.find(r => !r.hidden);
console.log(`\nlongest ${TOPN} at ${first.w}x${first.h} (slot ${first.slot.toFixed(0)}):`);
for (const x of first.pairs.slice(0, TOPN)) console.log(`  ${x.px.toFixed(0).padStart(5)} ${x.mid ? 'MID ' : x.cut ? 'cut ' : '    '} ${x.cut ? x.body + '|' : x.t}`);
if (errs.length) console.log('PAGE ERRORS: ' + errs.length + ' ' + errs[0]);
await b.close();
