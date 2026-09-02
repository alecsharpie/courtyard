#!/usr/bin/env node
/* state.mjs — read and update state.json from the command line.
 *
 *   node state.mjs --show                          compact digest (manager)
 *   node state.mjs --inventory                     just the inventory (worker)
 *   node state.mjs --add-inventory <domain> "…"    the town now contains this
 *   node state.mjs --cue "…"                       a loose end, for the manager
 *   node state.mjs --close-cue <id> "reason"
 *   node state.mjs --record <iter> <domain> <kind> mark a cell covered
 *   node state.mjs --saturate <domain> <kind> "why"
 *
 * state.json is STRUCTURED on purpose. The previous loop kept the same information
 * as a maintained prose header, and after a few hundred iterations it had collapsed
 * into an unreadable run-on paragraph of abbreviations — technically still updated,
 * no longer carrying signal. A schema cannot rot that way.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, 'state.json');
const s = JSON.parse(readFileSync(FILE, 'utf8'));
const argv = process.argv.slice(2);
const has = f => argv.includes(f);
const after = (f, n = 1) => { const i = argv.indexOf(f); return i === -1 ? null : argv.slice(i + 1, i + 1 + n); };
const save = () => { s.updated = new Date().toISOString().slice(0, 10); writeFileSync(FILE, JSON.stringify(s, null, 2) + '\n'); };

const domainIds = s.menu.domains.map(d => d.id);
const kindIds = s.menu.kinds.map(k => k.id);
const bad = (what, v, list) => { console.error(`state: unknown ${what} "${v}". Known: ${list.join(', ')}`); process.exit(1); };

if (has('--inventory')) {
  for (const d of s.menu.domains) {
    const inv = s.inventory[d.id] || [];
    console.log(`${d.name}: ${inv.join(' · ')}`);
  }
  process.exit(0);
}

if (has('--show')) {
  console.log(`state.json — phase=${s.phase}  updated=${s.updated}  lastIteration=${s.lastIteration}`);
  console.log('\nCOVERAGE (domain x kind -> iterations)');
  const w = Math.max(...s.menu.domains.map(d => d.name.length));
  const kw = kindIds.map(k => Math.max(6, k.length));
  console.log(' '.repeat(w + 2) + kindIds.map((k, i) => k.padEnd(kw[i])).join(' '));
  for (const d of s.menu.domains) {
    const row = s.coverage[d.id] || {};
    const cells = kindIds.map((k, i) => {
      const v = row[k] || [];
      const sat = (s.saturation[`${d.id}x${k}`] ? '!' : '');
      return ((v.length ? String(v.length) + sat : '·')).padEnd(kw[i]);
    });
    /* Last touched BY THE LOOP. Pre-loop work is recorded as `pre28` etc., and
     * stripping the letters made "pre28" read as iteration 28 — which reported
     * the most starved domain as the freshest one, in the exact grid the manager
     * rotates from. Count only entries that are actually numbers. */
    const nums = Object.values(row).flat().filter(v => typeof v === 'number');
    const last = nums.length ? Math.max(...nums) : null;
    const age = last === null ? '' : `  (${s.lastIteration - last} back)`;
    console.log(d.name.padEnd(w + 2) + cells.join(' ') + `  last=${last ?? 'pre-loop'}${age}`);
  }
  console.log('\n(counts, not iteration numbers; "!" = marked saturated; open state.json for detail)');

  if (Object.keys(s.saturation).length) {
    console.log('\nSATURATED');
    for (const [k, v] of Object.entries(s.saturation)) console.log(`  ${k}  since #${v.since}: ${v.why}`);
  }
  console.log('\nOPEN CUES');
  if (!s.openCues.length) console.log('  (none)');
  for (const c of s.openCues) console.log(`  ${c.id} (#${c.raisedBy}, seen by ${c.seenBy || 0} manager passes): ${c.note}`);
  console.log('\nWATCH');
  for (const w2 of s.watch) console.log(`  · ${typeof w2 === "string" ? w2 : w2.note}`);
  console.log('\nINVENTORY (counts)');
  for (const d of s.menu.domains) console.log(`  ${d.name.padEnd(w)}  ${(s.inventory[d.id] || []).length} entries`);
  process.exit(0);
}

if (has('--add-inventory')) {
  const [dom, ...rest] = after('--add-inventory', 99) || [];
  const text = rest.join(' ').trim();
  if (!dom || !text) { console.error('usage: --add-inventory <domain> "the town now contains …"'); process.exit(1); }
  if (!domainIds.includes(dom)) bad('domain', dom, domainIds);
  (s.inventory[dom] ||= []).push(text);
  save(); console.log(`state: inventory[${dom}] += "${text}"`);
  process.exit(0);
}

if (has('--cue')) {
  const note = (after('--cue', 99) || []).join(' ').trim();
  if (!note) { console.error('usage: --cue "…"'); process.exit(1); }
  /* Max existing id + 1, never a count: a count re-issues an id whenever a cue has
   * been absorbed or renamed (c61 collided at pass #37, c64 at iter 38). */
  const used = [...s.openCues, ...(s.closedCues || [])].map(c => parseInt(String(c.id).slice(1), 10) || 0);
  const id = 'c' + (Math.max(0, ...used) + 1);
  s.openCues.push({ id, note, raisedBy: s.lastIteration, seenBy: 0 });
  save(); console.log(`state: cue ${id} raised.`);
  process.exit(0);
}

if (has('--close-cue')) {
  const [id, ...rest] = after('--close-cue', 99) || [];
  const i = s.openCues.findIndex(c => c.id === id);
  if (i === -1) { console.error(`state: no open cue "${id}"`); process.exit(1); }
  const [c] = s.openCues.splice(i, 1);
  (s.closedCues ||= []).push({ ...c, closedBy: s.lastIteration, reason: rest.join(' ') });
  save(); console.log(`state: cue ${id} closed.`);
  process.exit(0);
}

if (has('--record')) {
  const [iter, dom, kind] = after('--record', 3) || [];
  if (!iter || !dom || !kind) { console.error('usage: --record <iter> <domain> <kind>'); process.exit(1); }
  if (!domainIds.includes(dom)) bad('domain', dom, domainIds);
  if (!kindIds.includes(kind)) bad('kind', kind, kindIds);
  ((s.coverage[dom] ||= {})[kind] ||= []).push(+iter);
  s.lastIteration = Math.max(s.lastIteration, +iter);
  save(); console.log(`state: coverage[${dom}][${kind}] += #${iter}`);
  process.exit(0);
}

if (has('--saturate')) {
  const [dom, kind, ...rest] = after('--saturate', 99) || [];
  if (!domainIds.includes(dom)) bad('domain', dom, domainIds);
  if (!kindIds.includes(kind)) bad('kind', kind, kindIds);
  s.saturation[`${dom}x${kind}`] = { since: s.lastIteration, why: rest.join(' ') };
  save(); console.log(`state: ${dom} x ${kind} marked saturated.`);
  process.exit(0);
}

console.log(readFileSync(join(HERE, 'state.mjs'), 'utf8').split('\n').slice(2, 17).join('\n'));
