/* archives.mjs — the one place that knows a rotated file has two halves.
 *
 * `rotate-ledger.mjs` bounds the three files that grow by construction, the same
 * way it already bounds LEDGER.md and state.json's closed cues: the tail stays
 * where every reader looks for it, the rest moves to an append-only archive
 * beside it, and NOTHING is deleted. That is only safe if every consumer that
 * wanted the whole history still gets the whole history — otherwise rotation is
 * deletion with a nicer name, and the dashboard silently loses its first hundred
 * iterations the first time the pruner runs.
 *
 * So the split lives here and nowhere else. A reader that needs everything calls
 * these; a reader that only needs the recent tail (runlog.mjs's merge, pop-brief's
 * next-iteration, stall.mjs's rung streak) goes on reading the live file directly,
 * which is exactly what the bound is FOR.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/* live file -> the append-only archive it rotates into. Both halves are on disk,
 * always; the pair is the record, and `archived + live` is what it used to be. */
export const ARCHIVE_OF = {
  'RUNLOG.jsonl': 'RUNLOG-archive.jsonl',
  'MANAGER-LOG.md': 'MANAGER-LOG-archive.md',
  'LEDGER-archive.md': 'LEDGER-deep.md',
};

const read = f => (existsSync(f) ? readFileSync(f, 'utf8') : '');

/* Archive first, then live: both halves are append-ordered, and the archive holds
 * what fell off the FRONT, so concatenating in that order restores the original
 * order exactly. Any reader that sorts by iteration is unaffected either way; the
 * ones that read positionally (a tail, a "last N") depend on it. */
export function wholeText(dir, file) {
  const a = ARCHIVE_OF[file];
  const head = a ? read(join(dir, a)) : '';
  const live = read(join(dir, file));
  if (!head) return live;
  return head.endsWith('\n') || !head ? head + live : head + '\n' + live;
}

export function runlogLines(dir) {
  return wholeText(dir, 'RUNLOG.jsonl').split('\n').filter(l => l.trim());
}

export function runlogRows(dir) {
  return runlogLines(dir).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}
