#!/usr/bin/env node
/* context-budget.mjs — what does one worker iteration have to read before it can
 * do any work?
 *
 *   node context-budget.mjs           report
 *   node context-budget.mjs --terse
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
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const terse = process.argv.includes('--terse');

/* ~3.6 bytes per token for English prose with markdown. Close enough to steer by. */
const BPT = 3.6;
const CAP = 46 * 1024;          // total worker read budget
const LAWS_CAP = 12 * 1024;     // the file read on EVERY iteration — the tightest cap
const LAWS_MAX = 60;            // and a count cap, because bytes alone let laws sprawl

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
