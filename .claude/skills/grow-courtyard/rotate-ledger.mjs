#!/usr/bin/env node
/* rotate-ledger.mjs — keep the loop's memory inside its budget.
 *
 *   node rotate-ledger.mjs            rotate LEDGER.md + state.json, warn on LAWS.md
 *   node rotate-ledger.mjs --keep 12
 *   node rotate-ledger.mjs --prune-only      just state.json's closed cues
 *
 * #175 gave the three files on the MANAGER's side of the loop the same treatment:
 * LEDGER-archive.md, RUNLOG.jsonl and MANAGER-LOG.md are bounded to a stated tail
 * and the rest moves to an append-only archive beside each (see archives.mjs, the
 * one place that knows a file has two halves). Rotation, never deletion — every
 * byte that was on disk before is still on disk after, and `stall.mjs --report`
 * states the rule it is bounded by.
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
import { ARCHIVE_OF } from './archives.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const LEDGER = join(HERE, 'LEDGER.md');
const ARCHIVE = join(HERE, 'LEDGER-archive.md');
const LAWS = join(HERE, 'LAWS.md');

const arg = (n, d) => { const i = process.argv.indexOf(n); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const KEEP = +arg('--keep', '8');
const KEEP_CLOSED = +arg('--keep-closed', '40');
/* The manager's three. Each is a CEILING set at what the file measured when the
 * bound went in (#175), not a trajectory — the point of a cap is that the growth
 * has to stop somewhere a reader can name, and the archive beside it means
 * choosing the number costs nothing that cannot be got back. */
const KEEP_ARCHIVE = +arg('--keep-archive', '60');   // LEDGER-archive.md, prose entries
const KEEP_ROWS = +arg('--keep-rows', '80');         // RUNLOG.jsonl, rows (manager tails 40)
const KEEP_PASSES = +arg('--keep-passes', '16');     // MANAGER-LOG.md, decision lines
const PRUNE_ONLY = process.argv.includes('--prune-only');
const LAWS_CAP = 12 * 1024, LAWS_MAX = 60;

if (!existsSync(LEDGER)) { console.error('rotate: no LEDGER.md'); process.exit(1); }
const txt = readFileSync(LEDGER, 'utf8');

/* Entries are `## Iteration N — …`. The header and template above the first one
 * are not entries and never rotate. */
const marks = [...txt.matchAll(/^## Iteration \d+.*$/gm)];
if (PRUNE_ONLY) {
  /* --prune-only exists so a worker can take the state.json prune without also
   * rotating the ledger. Which entries the worker still needs in front of it is
   * the MANAGER's judgement, made with the archive open; a worker reaching for
   * the pruner should not silently make it. */
} else if (marks.length <= KEEP) {
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
if (!PRUNE_ONLY) {
  const cur = readFileSync(LEDGER, 'utf8');
  const m = [...cur.matchAll(/^## Iteration \d+.*$/gm)];
  const ENTRY_CAP = 1.8 * 1024;   // #120: was 2.5; three entries at 2.5 are 18% of the worker's whole read budget
  const last3 = m.slice(-3);
  let hot = 0, sum = 0;
  console.log('\nread by every worker — the last 3 entries:');
  for (let i = 0; i < last3.length; i++) {
    const start = last3[i].index;
    const end = i + 1 < last3.length ? last3[i + 1].index : cur.length;
    const bytes = Buffer.byteLength(cur.slice(start, end));
    sum += bytes;
    if (bytes > ENTRY_CAP) hot++;
    console.log(`  ${(bytes / 1024).toFixed(1)} KB  ${last3[i][0].slice(3, 60)}${bytes > ENTRY_CAP ? '   ← over cap' : ''}`);
  }
  console.log(`  ${(sum / 1024).toFixed(1)} KB total`);
  if (hot) {
    console.log(`\n  ${hot} of the last 3 entries is over the 1.8 KB per-entry cap.`);
    console.log('  Condense them IN PLACE this pass: append the full text to LEDGER-archive.md');
    console.log('  first, then cut what stays to the brief, the change, the gate verdicts and');
    console.log('  the surprise. Laws belong in LAWS.md and loose ends in state.json — neither');
    console.log('  is worth a worker re-reading three times.');
  }
}

/* state.json is the other thing a worker reads whole, and it is the only one that grows
 * by construction — every landed iteration adds a system to the inventory and two or
 * three cues to the pile. It had no cap at all until pass #30, by which point it was
 * the single largest item in the budget (11.4 KB, larger than LAWS.md).
 *
 * Pass #30 capped the per-entry bytes and the cue COUNT, and pass #33 found the budget
 * back over anyway: with only a count cap, cues had grown to 390 B each and the whole
 * state block was 15.2 KB. That is the Solvista shape for the third time — cap one
 * dimension and the growth moves to the neighbouring one. So every dimension is capped
 * here, and each cap is a CEILING rather than a trajectory: 8 domains x 8 entries x
 * 300 B, 8 cues x 250 B, 4 watch items x 420 B. Add a ninth entry to a full domain and
 * two existing ones have to merge, which is what "the inventory is nouns, not history"
 * means in practice. */
{
  const f = join(HERE, 'state.json');
  const INV_ENTRY_CAP = 300, INV_PER_DOMAIN = 8, INV_CAP = 9.5 * 1024;
  const CUES_MAX = 8, CUE_CAP = 250, WATCH_MAX = 4, WATCH_CAP = 420;
  if (existsSync(f)) {
    try {
      const s = JSON.parse(readFileSync(f, 'utf8'));
      const fat = [];
      let n = 0, bytes = 0;
      for (const [dom, list] of Object.entries(s.inventory || {})) {
        if (!Array.isArray(list)) continue;
        if (list.length > INV_PER_DOMAIN) fat.push(`${dom}: ${list.length} entries — over ${INV_PER_DOMAIN}; merge two`);
        for (const e of list) {
          n++; const b = Buffer.byteLength(e); bytes += b;
          if (b > INV_ENTRY_CAP) fat.push(`${dom}: ${b} B — ${e.slice(0, 52)}…`);
        }
      }
      const cues = s.openCues || [], watch = s.watch || [];
      const state = Buffer.byteLength(JSON.stringify({ i: s.inventory, c: cues, w: watch }));
      console.log(`\nstate.json (worker-read): ${(state / 1024).toFixed(1)} KB`);
      console.log(`  inventory ${n} entries, ${(bytes / 1024).toFixed(1)}/${(INV_CAP / 1024).toFixed(1)} KB${bytes > INV_CAP ? '   ← OVER' : ''}`);
      console.log(`  cues ${cues.length}/${CUES_MAX}   watch ${watch.length}/${WATCH_MAX}`);
      for (const line of fat) console.log(`  ← over cap  ${line}`);
      if (fat.length) console.log(`  ${fat.length} inventory offenders. Entries are NOUNS — a number in one is ledger text.`);
      if (cues.length > CUES_MAX) console.log(`  ${cues.length - CUES_MAX} cues over cap. Promote one to a brief or close it with a reason.`);
      for (const c of cues) if (Buffer.byteLength(c.note || '') > CUE_CAP)
        console.log(`  ← over ${CUE_CAP} B  cue ${c.id}: ${Buffer.byteLength(c.note)} B — a cue is a POINTER; its evidence is in the ledger entry that raised it.`);
      if (watch.length > WATCH_MAX) console.log(`  ${watch.length - WATCH_MAX} watch items over cap. One is spent — a watch item ends when a brief lands on it.`);
      for (const w of watch) if (Buffer.byteLength(w.note || '') > WATCH_CAP)
        console.log(`  ← over ${WATCH_CAP} B  watch since #${w.since}: ${Buffer.byteLength(w.note)} B`);
    } catch { /* state.json is the manager's problem elsewhere */ }
  }
}

/* ---- closed cues: the fourth unbounded file ---------------------------------
 * The block above caps every dimension a WORKER reads. `closedCues` is none of
 * them and had no cap at all: 232 notes, 85 KB of a 117 KB state.json, in the file
 * the manager opens first and state.mjs rewrites whole on every `--cue` and every
 * `--close-cue`. It grows by construction — a cue is closed and never removed —
 * which is the same shape rotate() already answers for the ledger, so it gets the
 * same answer rather than a new one: the tail stays, the rest moves to an
 * append-only archive, nothing is deleted.
 *
 * The tail, by ARRAY POSITION, because `closedCues` is append-ordered by CLOSING
 * and that is the order a manager reads it back in — not by id, which is the order
 * they were RAISED in and would shuffle the recent decisions.
 *
 * `cueSeq` is the one thing a prune could genuinely lose. state.mjs allocates the
 * next cue id as max-id-ever + 1, read off open + closed, and a cue raised early
 * and closed late carries a low id in a late slot — so pruning by position CAN
 * carry the maximum out of the file and re-issue a live id. The high-water mark is
 * therefore written back into state.json as the prune happens, and state.mjs reads
 * it alongside the two lists. */
{
  const f = join(HERE, 'state.json');
  const CUE_ARCHIVE = join(HERE, 'closed-cues-archive.jsonl');
  if (existsSync(f)) {
    try {
      const s = JSON.parse(readFileSync(f, 'utf8'));
      const closed = Array.isArray(s.closedCues) ? s.closedCues : [];
      const idOf = c => {
        const m = /c(\d+)/.exec(typeof c === 'string' ? c : String((c && c.id) || ''));
        return m ? +m[1] : 0;
      };
      const seq = Math.max(s.cueSeq || 0, ...closed.map(idOf), ...(s.openCues || []).map(idOf));
      const was = Buffer.byteLength(JSON.stringify(closed));
      if (closed.length > KEEP_CLOSED) {
        const moving = closed.slice(0, closed.length - KEEP_CLOSED);
        appendFileSync(CUE_ARCHIVE, moving.map(c => JSON.stringify(c)).join('\n') + '\n');
        s.closedCues = closed.slice(closed.length - KEEP_CLOSED);
        s.cueSeq = seq;
        writeFileSync(f, JSON.stringify(s, null, 2) + '\n');
        const now = Buffer.byteLength(JSON.stringify(s.closedCues));
        console.log(`\nclosed cues: moved ${moving.length} to closed-cues-archive.jsonl, kept the last ${KEEP_CLOSED}`);
        console.log(`  ${(was / 1024).toFixed(1)} KB -> ${(now / 1024).toFixed(1)} KB   (state.json now ${(statSync(f).size / 1024).toFixed(1)} KB, cueSeq ${seq})`);
      } else if (s.cueSeq !== seq) {
        s.cueSeq = seq;
        writeFileSync(f, JSON.stringify(s, null, 2) + '\n');
        console.log(`\nclosed cues: ${closed.length}/${KEEP_CLOSED} — nothing to move (cueSeq ${seq}).`);
      } else {
        console.log(`\nclosed cues: ${closed.length}/${KEEP_CLOSED} — nothing to move.`);
      }
    } catch (e) { console.log(`\nclosed cues: state.json unreadable — ${e.message}`); }
  }
}

/* ---- the MANAGER's three: bound by rotation, never by deletion ---------------
 * Everything above bounds what a WORKER opens. Nothing bounded what a MANAGER
 * does, and `stall.mjs --report` said so in as many words while printing the
 * slope: LEDGER-archive.md +1.47 KB/iter, RUNLOG.jsonl +1.24, MANAGER-LOG.md
 * +0.52, ~1.0 MB between them at #174 and rising ~7 KB every twenty iterations.
 *
 * These are not the worker's problem and they are not the same problem. What a
 * manager pays for RUNLOG.jsonl is `tail -40`, which is FLAT (36.4 KB at row 40,
 * 38.5 KB at row 211) however big the file gets — so the cost of an unbounded file
 * here is not context, it is that every tool parses the whole thing on every
 * iteration and that a manager grepping for history works a haystack that only
 * grows. Both are real and neither is fixed by deleting anything.
 *
 * So: the same answer the ledger and the closed cues already got. A stated tail
 * stays where every reader looks for it; the rest moves to an append-only archive
 * beside it; `archives.mjs` is the single place that knows a file has two halves,
 * and the readers that want the whole history (build-stats.mjs's charts and
 * decision list, stall.mjs's run counts) go through it. Every byte that was on
 * disk before this ran is on disk after it — the totals are printed so that claim
 * is checkable rather than asserted. */
/* Runs under --prune-only too, on the same criterion the closed-cue prune passes:
 * it moves bytes between two files NO WORKER OPENS, so it cannot change what any
 * iteration reads or reasons from. Rotating LEDGER.md is a judgement about what a
 * worker still needs in front of it and stays the manager's; this is bookkeeping. */
{
  const bytesOf = f => (existsSync(f) ? statSync(f).size : 0);

  /* One rotation, three files. `split` returns the offsets of the units this file
   * is counted in — prose entries, JSON rows, decision lines — and everything
   * before the first offset is a HEAD that belongs to the live file and never
   * moves. A file with no head (a .jsonl) simply has its first offset at 0. */
  const rotate = (name, { split, keep, unit, archiveHead }) => {
    const f = join(HERE, name), a = join(HERE, ARCHIVE_OF[name]);
    if (!existsSync(f)) return null;
    const text = readFileSync(f, 'utf8');
    const at = split(text);
    const before = Buffer.byteLength(text) + bytesOf(a);
    if (at.length <= keep) {
      console.log(`  ${name.padEnd(18)} ${String(at.length).padStart(4)}/${keep} ${unit} — nothing to move`);
      return { name, moved: 0, before, after: before };
    }
    const cut = at[at.length - keep];
    const head = text.slice(0, at[0]);
    /* An archive created here starts with a header explaining what it is, and
     * those bytes are NEW — they are not rotated content. Count them on the
     * BEFORE side or the conservation check below reads its own explanatory
     * prose as a discrepancy and cries wolf on the one claim that matters. */
    let born = 0;
    if (!existsSync(a)) { writeFileSync(a, archiveHead); born = Buffer.byteLength(archiveHead); }
    appendFileSync(a, text.slice(at[0], cut));
    writeFileSync(f, head + text.slice(cut));
    const after = bytesOf(f) + bytesOf(a);
    console.log(`  ${name.padEnd(18)} moved ${String(at.length - keep).padStart(4)} ${unit} to ${ARCHIVE_OF[name]}, kept ${keep}` +
      `   ${(Buffer.byteLength(text) / 1024).toFixed(1)} -> ${(bytesOf(f) / 1024).toFixed(1)} KB`);
    return { name, moved: at.length - keep, before: before + born, after, born };
  };

  /* Offsets of `## Iteration …` / `- <date> …` / every non-blank line. */
  const byMark = re => text => [...text.matchAll(re)].map(m => m.index);
  /* CODE UNITS, not bytes: these offsets are handed to `String.prototype.slice`,
   * and RUNLOG.jsonl is full of em-dashes and ticks. Measuring the cut in bytes
   * put it mid-character, which split one row into two unparseable fragments —
   * both silently dropped by every reader, so the run lost an iteration while the
   * byte-conservation check below still read ✓. Conservation is necessary and not
   * sufficient; the A/B on the readers is what caught it. */
  const byLine = text => {
    const at = []; let i = 0;
    for (const l of text.split('\n')) { if (l.trim()) at.push(i); i += l.length + 1; }
    return at;
  };

  console.log('\nthe manager’s files — rotation, nothing deleted:');
  const done = [
    rotate('LEDGER-archive.md', {
      split: byMark(/^## Iteration \d+.*$/gm), keep: KEEP_ARCHIVE, unit: 'entries',
      archiveHead: '# The Courtyard — deep ledger archive\n\nEntries rotated out of `LEDGER-archive.md`, which itself keeps only the last\n' +
        `${KEEP_ARCHIVE} \`## Iteration\` entries. Append-only; nothing is ever deleted. This is the\n` +
        'bottom of the loop’s memory — grep it, do not open it.\n\n',
    }),
    rotate('RUNLOG.jsonl', {
      split: byLine, keep: KEEP_ROWS, unit: 'rows', archiveHead: '',
    }),
    rotate('MANAGER-LOG.md', {
      split: byMark(/^- \d{4}-\d{2}-\d{2} .*$/gm), keep: KEEP_PASSES, unit: 'passes',
      archiveHead: '# Manager decisions — archive\n\nLines rotated out of `MANAGER-LOG.md`, which keeps the last ' + KEEP_PASSES + '.\n' +
        'Append-only. `build-stats.mjs` reads this half too, so the decision list on\n' +
        'stats.html stays the whole history.\n\n',
    }),
  ].filter(Boolean);

  /* The one claim rotation has to make good on. If these two ever disagree, a
   * "rotation" lost something and is a deletion wearing its name. */
  const before = done.reduce((a, d) => a + d.before, 0), after = done.reduce((a, d) => a + d.after, 0);
  console.log(`  ${'—'.repeat(18)}`);
  const born = done.reduce((a, d) => a + (d.born || 0), 0);
  console.log(`  live + archive: ${(before / 1024).toFixed(1)} KB before, ${(after / 1024).toFixed(1)} KB after` +
    `${born ? ` (incl. ${born} B of new archive headers)` : ''}` +
    `   ${before === after ? '✓ every byte still on disk' : `✗ ${Math.abs(before - after)} B ${before > after ? 'LOST — rotation must never delete' : 'UNACCOUNTED'}`}`);
  if (before !== after) process.exitCode = 2;

  /* MANAGER-LOG.md's own rule is "one line per manager pass", and it has never been
   * measured: 36 entries averaging 2.4 KB and reaching 5.1 KB, which is not a line.
   * The ledger's advisory cap went the same way at pass #20 — "an advisory cap that
   * nobody enforces is a comment" — so this one is measured, in the script the
   * manager runs anyway, and it names the pass. Reported and not enforced: the
   * entries already over are somebody else's debt and failing on them is how a gate
   * gets ignored. What it must catch is the NEXT one. */
  {
    const f = join(HERE, 'MANAGER-LOG.md');
    const PASS_CAP = 1.5 * 1024;
    if (existsSync(f)) {
      const t = readFileSync(f, 'utf8');
      const at = [...t.matchAll(/^- \d{4}-\d{2}-\d{2} .*$/gm)].map(m => m.index);
      const b = at.map((x, i) => Buffer.byteLength(t.slice(x, i + 1 < at.length ? at[i + 1] : t.length)));
      const over = b.filter(x => x > PASS_CAP).length;
      const lastB = b.length ? b[b.length - 1] : 0;
      console.log(`\nMANAGER-LOG.md: ${b.length} passes kept, ${over} over the ${(PASS_CAP / 1024).toFixed(1)} KB per-pass cap` +
        `${b.length ? `, newest ${(lastB / 1024).toFixed(1)} KB${lastB > PASS_CAP ? '   ← over cap' : ''}` : ''}`);
      if (lastB > PASS_CAP) console.log('  A decision line records WHY, in a sentence. The evidence behind it is in the\n' +
        '  ledger entries and the runlog rows this pass read — write the reason, not the read.');
    }
  }
}

if (!PRUNE_ONLY && existsSync(LAWS)) {
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
