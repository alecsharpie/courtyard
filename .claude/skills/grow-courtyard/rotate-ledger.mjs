#!/usr/bin/env node
/* rotate-ledger.mjs — keep the loop's memory inside its budget.
 *
 *   node rotate-ledger.mjs            rotate LEDGER.md, warn on LAWS.md
 *   node rotate-ledger.mjs --keep 12
 *
 * Entries past the last N move to LEDGER-archive.md. Nothing is ever deleted —
 * the archive is the manager's history, and the only reason the worker's context
 * can stay flat while the run gets longer.
 *
 * LAWS.md is only WARNED about, never trimmed automatically. Which law to cut is a
 * judgement about what the loop still needs to know; a script that guessed would
 * quietly delete the one law standing between this run and a repeated mistake.
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LEDGER = join(HERE, 'LEDGER.md');
const ARCHIVE = join(HERE, 'LEDGER-archive.md');
const LAWS = join(HERE, 'LAWS.md');

const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const KEEP = +arg('--keep', '8');
const LAWS_CAP = 12 * 1024, LAWS_MAX = 60;

if (!existsSync(LEDGER)) { console.error('rotate: no LEDGER.md'); process.exit(1); }
const txt = readFileSync(LEDGER, 'utf8');

/* Entries are `## Iteration N — …`. The header and template above the first one
 * are not entries and never rotate. */
const marks = [...txt.matchAll(/^## Iteration \d+.*$/gm)];
if (marks.length <= KEEP) {
  console.log(`rotate: ${marks.length} entries, keeping ${KEEP} — nothing to move.`);
} else {
  const cutAt = marks[marks.length - KEEP].index;
  const firstEntry = marks[0].index;
  const head = txt.slice(0, firstEntry);
  const moving = txt.slice(firstEntry, cutAt);
  const keeping = txt.slice(cutAt);

  if (!existsSync(ARCHIVE)) {
    writeFileSync(ARCHIVE, '# The Courtyard — ledger archive\n\nEntries rotated out of `LEDGER.md`. Append-only. **Only the manager reads this** —\na worker that opens it to "catch up" spends its whole context on history.\n\n');
  }
  appendFileSync(ARCHIVE, moving);
  writeFileSync(LEDGER, head + keeping);
  console.log(`rotate: moved ${marks.length - KEEP} entries to LEDGER-archive.md, kept the last ${KEEP}.`);
}

if (existsSync(LAWS)) {
  const laws = readFileSync(LAWS, 'utf8');
  const n = (laws.match(/^- \*\*/gm) || []).length;
  const bytes = statSync(LAWS).size;
  const overN = n > LAWS_MAX, overB = bytes > LAWS_CAP;
  console.log(`laws: ${n}/${LAWS_MAX} laws, ${(bytes / 1024).toFixed(1)}/${(LAWS_CAP / 1024).toFixed(0)} KB${overN || overB ? '   ← OVER BUDGET' : ''}`);
  if (overN || overB) {
    console.log('\n  LAWS.md is read in FULL by every worker iteration, so this is the most');
    console.log('  expensive file in the repo. Distil it now, in this manager pass:');
    console.log('    · merge laws that say the same thing in different words');
    console.log('    · replace a law that a newer one supersedes — do not stack them');
    console.log('    · delete laws whose subject no longer exists in the source');
    console.log('  Adding without cutting is how the previous loop reached 62% laws by volume.');
    process.exit(2);
  }
}
