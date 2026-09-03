#!/usr/bin/env node
/* context-budget.mjs — what does one worker iteration have to read before it can
 * do any work?
 *
 *   node context-budget.mjs           report the TOTAL, against the 46 KB cap
 *   node context-budget.mjs --terse
 *   node context-budget.mjs --additions   what THIS iteration added, against its quota
 *   node context-budget.mjs --additions --since HEAD~1     ... after it has committed
 *
 * This exists because of the single most expensive mistake in the previous loop.
 * Each iteration is a fresh process with an empty context, so everything it must
 * read is paid for again, every time. Its memory files were allowed to grow
 * without a cap: the laws list reached 62% of a 3,900-line skill file and was read
 * in full on every one of hundreds of runs. Cost per iteration went $5.45 -> $13.72
 * while output fell. Capping the prose ledger alone did not help — it just pushed
 * the growth into the file that was read MORE often.
 *
 * So the budget is measured, and it is the manager's job to stay under it.
 *
 * And that is the whole reason for --additions. The TOTAL is the manager's number:
 * a worker that reads OVER cannot fix it inside its own iteration, so it wrote
 * "OVER 50.2 of 46" into its ledger entry and shipped — twenty-five opens running,
 * five manager resets, no worker ever bound by it. What a worker CAN be held to is
 * what it ADDS. The total grows because every iteration appends and nothing bounds
 * the append; --additions bounds the append, at the step where the worker is already
 * writing (log, state, commit), by diffing the working tree against HEAD.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const terse = process.argv.includes('--terse');
const additions = process.argv.includes('--additions');
/* The baseline ref. HEAD while the worker is still writing; HEAD~1 for the runner,
 * checking the same quota AFTER the commit — otherwise the gate is honour-system and
 * ends up exactly where the total is. */
const SINCE = (i => (i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : 'HEAD'))(process.argv.indexOf('--since'));

/* ~3.6 bytes per token for English prose with markdown. Close enough to steer by. */
const BPT = 3.6;
const CAP = 46 * 1024;          // total worker read budget
const LAWS_CAP = 12 * 1024;     // the file read on EVERY iteration — the tightest cap
const LAWS_MAX = 60;            // and a count cap, because bytes alone let laws sprawl

/* ONE iteration's own quota. Counts first, because the counts are what make the
 * total climb: a second ledger entry or a third cue is a whole new line read on
 * every future open, where a long line is only a fat one. Over the count is not a
 * "trim it" — it is MERGE, into the entry or the line that is already there. */
const ADD = {
  entry: { max: 1, bytes: Math.round(1.8 * 1024), what: 'ledger entry' },
  inv:   { max: 1, bytes: 250,                    what: 'inventory line' },
  cue:   { max: 1, bytes: 250,                    what: 'cue note' },
};

const sz = f => (existsSync(f) ? statSync(f).size : 0);

/* LEDGER.md: a worker reads the last ~3 entries, not the file. Price it that way. */
function ledgerTail(n = 3) {
  const f = join(HERE, 'LEDGER.md');
  if (!existsSync(f)) return 0;
  const txt = readFileSync(f, 'utf8');
  const idx = [...txt.matchAll(/^## /gm)].map(m => m.index);
  if (idx.length <= n) return Buffer.byteLength(txt);
  return Buffer.byteLength(txt.slice(idx[idx.length - n]));
}

function inventoryBytes() {
  const f = join(HERE, 'state.json');
  if (!existsSync(f)) return 0;
  try {
    const s = JSON.parse(readFileSync(f, 'utf8'));
    return Buffer.byteLength(JSON.stringify({ inventory: s.inventory, openCues: s.openCues, watch: s.watch }));
  } catch { return sz(f); }
}


/* ---------------------------------------------------------------- --additions --
 * The baseline is HEAD, not a stored file, because the thing being measured is
 * exactly "what has this iteration not committed yet". A worker that has already
 * committed reads 0 added, which is correct: its additions are HEAD's now, and the
 * TOTAL is where they are answered for.
 *
 * Three surfaces, because these are the three a worker writes and every one of them
 * is read again on every future open: the ledger tail, the inventory, the cues.
 * LAWS.md and SKILL.md are the manager's, so growth there is REPORTED and not
 * charged — a worker editing the protocol (this iteration did) should see the byte
 * cost without being failed for it.
 */
function atHead(rel) {
  try { return execFileSync('git', ['show', `${SINCE}:./${rel}`], { cwd: HERE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch { return null; }   // untracked, no repo, or no such ref — no baseline to diff against
}

/* Entries keyed by their heading line, so an entry that is EDITED in place is not a
 * new one — but if it grew, the growth is charged to whoever grew it. */
function ledgerEntries(txt) {
  const m = {};
  if (txt == null) return null;
  const idx = [...txt.matchAll(/^## .*$/gm)];
  idx.forEach((h, i) => {
    const body = txt.slice(h.index, i + 1 < idx.length ? idx[i + 1].index : txt.length);
    m[h[0].trim()] = Buffer.byteLength(body);
  });
  return m;
}

function stateBits(txt) {
  if (txt == null) return null;
  let s; try { s = JSON.parse(txt); } catch { return null; }
  const inv = new Map(), cues = new Map();
  /* inventory carries a `note` STRING beside the domain arrays — iterating that as a
   * list yields one entry per CHARACTER. Take arrays only. */
  for (const [dom, lines] of Object.entries(s.inventory || {})) {
    if (!Array.isArray(lines)) continue;
    for (const l of lines) inv.set(dom + ' | ' + l, { dom, text: l, bytes: Buffer.byteLength(l) });
  }
  for (const c of s.openCues || []) cues.set(c.id, { text: c.note || '', bytes: Buffer.byteLength(c.note || '') });
  return { inv, cues };
}

if (additions) {
  const fails = [], notes = [];
  const clip = t => (t.length > 96 ? t.slice(0, 93) + '…' : t).replace(/\s+/g, ' ');

  const wtL = ledgerEntries(existsSync(join(HERE, 'LEDGER.md')) ? readFileSync(join(HERE, 'LEDGER.md'), 'utf8') : null);
  const hdL = ledgerEntries(atHead('LEDGER.md'));
  const wtS = stateBits(existsSync(join(HERE, 'state.json')) ? readFileSync(join(HERE, 'state.json'), 'utf8') : null);
  const hdS = stateBits(atHead('state.json'));

  if (!hdL && !hdS) {
    console.log(`additions: no ${SINCE} baseline for LEDGER.md or state.json — nothing to diff.`);
    console.log('(--additions compares the working tree against a ref; run it BEFORE you commit,');
    console.log(' or with --since HEAD~1 after.)');
    process.exit(0);
  }

  console.log(`this iteration's ADDITIONS — working tree vs ${SINCE}\n`);

  /* --- ledger --- */
  const newEntries = [], grown = [];
  if (wtL && hdL) {
    for (const [k, b] of Object.entries(wtL)) {
      if (!(k in hdL)) newEntries.push([k, b]);
      else if (b > hdL[k]) grown.push([k, b - hdL[k], b, hdL[k]]);
    }
  }
  console.log(`  ${'ledger entries added'.padEnd(26)} ${String(newEntries.length).padStart(3)}  (max ${ADD.entry.max})`);
  for (const [k, b] of newEntries) {
    const bad = b > ADD.entry.bytes;
    console.log(`      ${bad ? '✗' : '·'} ${(b / 1024).toFixed(2)} KB  ${clip(k)}`);
    if (bad) fails.push(`ledger entry ${(b / 1024).toFixed(2)} KB over the ${(ADD.entry.bytes / 1024).toFixed(1)} KB cap — ${clip(k)}`);
  }
  if (newEntries.length > ADD.entry.max) fails.push(`${newEntries.length} new ledger entries; one iteration writes ONE. Merge them.`);
  /* An entry that was ALREADY over at HEAD is not this iteration's debt — charge the
   * edit only where it is what CROSSED the cap, or the gate hands a worker somebody
   * else's fat entry to answer for and gets ignored the way the total already is. */
  for (const [k, d, b, was] of grown) {
    const crossed = was <= ADD.entry.bytes && b > ADD.entry.bytes;
    console.log(`      ${crossed ? '✗' : '~'} +${d} B (now ${(b / 1024).toFixed(2)} KB)  ${clip(k)}   [edited, not new]`);
    if (crossed) fails.push(`edit pushed a ledger entry to ${(b / 1024).toFixed(2)} KB, over the ${(ADD.entry.bytes / 1024).toFixed(1)} KB cap — ${clip(k)}`);
  }

  /* --- inventory + cues --- */
  for (const [key, label, q] of [['inv', 'inventory lines added', ADD.inv], ['cues', 'cues raised', ADD.cue]]) {
    if (!wtS || !hdS) { console.log(`  ${label.padEnd(26)}   ?  (state.json unreadable at one end)`); continue; }
    const fresh = [...wtS[key]].filter(([k]) => !hdS[key].has(k)).map(([, v]) => v);
    console.log(`  ${label.padEnd(26)} ${String(fresh.length).padStart(3)}  (max ${q.max}, ${q.bytes} B each)`);
    for (const v of fresh) {
      const bad = v.bytes > q.bytes;
      console.log(`      ${bad ? '✗' : '·'} ${String(v.bytes).padStart(4)} B  ${v.dom ? '[' + v.dom + '] ' : ''}${clip(v.text)}`);
      if (bad) fails.push(`${q.what} ${v.bytes} B over the ${q.bytes} B cap — ${clip(v.text)}`);
    }
    if (fresh.length > q.max) fails.push(`${fresh.length} ${q.what}s added; one iteration adds at most ${q.max}. MERGE into the line already there.`);
  }

  /* --- the manager's files: reported, never charged --- */
  for (const f of ['LAWS.md', 'SKILL.md']) {
    const h = atHead(f); if (h == null || !existsSync(join(HERE, f))) continue;
    const d = sz(join(HERE, f)) - Buffer.byteLength(h);
    if (d) notes.push(`${f} ${d > 0 ? '+' : ''}${d} B (the manager's file — reported, not charged)`);
  }
  if (notes.length) { console.log(''); for (const n of notes) console.log(`  note: ${n}`); }

  if (fails.length) {
    console.log('\nOVER QUOTA:');
    for (const f of fails) console.log('  ✗ ' + f);
    console.log('\nThis is the append the TOTAL is made of. Merge, do not append: fold the second');
    console.log('finding into the entry you already wrote, the second noun into the inventory line');
    console.log('that already names its domain, the second loose end into the cue it belongs to.');
    process.exit(3);
  }
  console.log('\nOK — this iteration is inside its own quota.');
  process.exit(0);
}

const items = [
  ['SKILL.md (worker protocol)', sz(join(HERE, 'SKILL.md')), null],
  ['LAWS.md', sz(join(HERE, 'LAWS.md')), LAWS_CAP],
  ['state.json — inventory + cues', inventoryBytes(), null],
  ['LEDGER.md (last 3 entries)', ledgerTail(3), null],
  ['current-brief.json', sz(join(HERE, 'current-brief.json')), null],
];

const total = items.reduce((a, [, b]) => a + b, 0);

let laws = 0;
if (existsSync(join(HERE, 'LAWS.md'))) laws = (readFileSync(join(HERE, 'LAWS.md'), 'utf8').match(/^- \*\*/gm) || []).length;

if (terse) {
  console.log(`${(total / 1024).toFixed(1)}KB/${(CAP / 1024).toFixed(0)}KB laws=${laws}/${LAWS_MAX} ${total <= CAP && laws <= LAWS_MAX ? 'OK' : 'OVER'}`);
  process.exit(total <= CAP && laws <= LAWS_MAX ? 0 : 2);
}

console.log('worker context budget — read fresh on EVERY iteration\n');
for (const [name, bytes, cap] of items) {
  const flag = cap && bytes > cap ? '  ← OVER CAP' : '';
  console.log(`  ${name.padEnd(32)} ${(bytes / 1024).toFixed(1).padStart(6)} KB  ~${Math.round(bytes / BPT).toString().padStart(5)} tok${flag}`);
}
console.log(`  ${'—'.repeat(32)} ${'—'.repeat(6)}`);
console.log(`  ${'TOTAL'.padEnd(32)} ${(total / 1024).toFixed(1).padStart(6)} KB  ~${Math.round(total / BPT)} tok   (cap ${(CAP / 1024).toFixed(0)} KB)`);
console.log(`\n  laws: ${laws} / ${LAWS_MAX}`);
console.log('\n  Not counted: the courtyard.html seam a worker greps. That is the work itself.');
console.log('  Counted: everything it must read before the work starts. Keep this flat as');
console.log('  the run grows — a rising line here is the loop paying rent on its own memory.\n');

const over = [];
if (total > CAP) over.push(`total ${(total / 1024).toFixed(1)} KB over the ${(CAP / 1024).toFixed(0)} KB cap`);
if (laws > LAWS_MAX) over.push(`${laws} laws over the ${LAWS_MAX} cap`);
const lawBytes = sz(join(HERE, 'LAWS.md'));
if (lawBytes > LAWS_CAP) over.push(`LAWS.md ${(lawBytes / 1024).toFixed(1)} KB over its ${(LAWS_CAP / 1024).toFixed(0)} KB cap`);

if (over.length) {
  console.log('OVER: ' + over.join('; '));
  console.log('Manager: distil now, this pass. Merge superseded laws, archive old entries,');
  console.log('compress the inventory to nouns. Deferring this is how the last loop died.');
  process.exit(2);
}
console.log('OK — inside budget.');
