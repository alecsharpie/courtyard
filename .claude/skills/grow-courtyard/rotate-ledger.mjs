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

/* The last 3 entries are read by EVERY worker, so their length is charged three
 * times over. Pass #20 answered that with a 3.5 KB advisory cap in the ledger's
 * own template; all three of the next three entries came in at 4.3-5.7 KB and
 * three more workers opened OVER budget. An advisory cap that nobody enforces is
 * a comment. So it is measured here, in the script the manager runs every pass,
 * and it names the entry — condensing it is the manager's job and nobody else's. */
{
  const cur = readFileSync(LEDGER, 'utf8');
  const m = [...cur.matchAll(/^## Iteration \d+.*$/gm)];
  const ENTRY_CAP = 2.5 * 1024;
  const last3 = m.slice(-3);
  let hot = 0, sum = 0;
  console.log('\nread by every worker — the last 3 entries:');
  for (let i = 0; i < last3.length; i++) {
    const start = last3[i].index;
    const end = i + 1 < last3.length ? last3[i + 1].index : cur.length;
    const bytes = Buffer.byteLength(cur.slice(start, end));
    sum += bytes;
    if (bytes > ENTRY_CAP) hot++;
    console.log(`  ${(bytes / 1024).toFixed(1)} KB  ${last3[i][0].slice(3, 60)}${bytes > ENTRY_CAP ? '   ← over 3 KB' : ''}`);
  }
  console.log(`  ${(sum / 1024).toFixed(1)} KB total`);
  if (hot) {
    console.log(`\n  ${hot} of the last 3 entries is over the 2.5 KB per-entry cap.`);
    console.log('  Condense them IN PLACE this pass: append the full text to LEDGER-archive.md');
    console.log('  first, then cut what stays to the brief, the change, the gate verdicts and');
    console.log('  the surprise. Laws belong in LAWS.md and loose ends in state.json — neither');
    console.log('  is worth a worker re-reading three times.');
  }
}

/* state.json's inventory is the other file a worker reads whole, and it is the only
 * one that grows by construction — every landed iteration adds a system to it. It had
 * no cap at all until pass #30, by which point it was the single largest item in the
 * budget (11.4 KB, larger than LAWS.md). Same fix as the ledger: a per-entry byte cap,
 * measured here, with the offenders named. An entry over it is carrying measurements,
 * and measurements belong in the ledger. Cues get a count cap for the same reason —
 * a cue that nobody will ever promote is a brief or a deletion, not a resident. */
{
  const f = join(HERE, 'state.json');
  const INV_ENTRY_CAP = 300, CUES_MAX = 8;
  if (existsSync(f)) {
    try {
      const s = JSON.parse(readFileSync(f, 'utf8'));
      const fat = [];
      let n = 0, bytes = 0;
      for (const [dom, list] of Object.entries(s.inventory || {})) {
        if (!Array.isArray(list)) continue;
        for (const e of list) {
          n++; const b = Buffer.byteLength(e); bytes += b;
          if (b > INV_ENTRY_CAP) fat.push(`${dom}: ${b} B — ${e.slice(0, 52)}…`);
        }
      }
      const cues = (s.openCues || []).length;
      console.log(`\ninventory: ${n} entries, ${(bytes / 1024).toFixed(1)} KB; open cues ${cues}/${CUES_MAX}`);
      for (const line of fat) console.log(`  ← over ${INV_ENTRY_CAP} B  ${line}`);
      if (fat.length) console.log(`  ${fat.length} inventory entries over cap. They are NOUNS — a number in one is ledger text.`);
      if (cues > CUES_MAX) console.log(`  ${cues - CUES_MAX} cues over cap. Promote one to a brief or close it with a reason.`);
    } catch { /* state.json is the manager's problem elsewhere */ }
  }
}

if (existsSync(LAWS)) {
  const laws = readFileSync(LAWS, 'utf8');
  const n = (laws.match(/^- \*\*/gm) || []).length;
  const bytes = statSync(LAWS).size;
  const overN = n > LAWS_MAX, overB = bytes > LAWS_CAP;
  console.log(`\nlaws: ${n}/${LAWS_MAX} laws, ${(bytes / 1024).toFixed(1)}/${(LAWS_CAP / 1024).toFixed(0)} KB${overN || overB ? '   ← OVER BUDGET' : ''}`);
  /* A single law that sprawls is how the file gets to its cap without anybody
   * deciding to spend the bytes. 900 B is about a paragraph — past that it is two
   * laws pretending to be one, and it should be split or cut. */
  {
    const idx = [...laws.matchAll(/^- \*\*/gm)].map(m => m.index);
    for (let i = 0; i < idx.length; i++) {
      const end = i + 1 < idx.length ? idx[i + 1] : laws.length;
      const b = Buffer.byteLength(laws.slice(idx[i], end));
      if (b > 900) console.log(`  ← ${b} B, over 900: ${laws.slice(idx[i] + 4, idx[i] + 56).replace(/\n\s*/g, ' ')}…`);
    }
  }
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
