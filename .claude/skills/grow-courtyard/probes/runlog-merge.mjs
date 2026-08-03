#!/usr/bin/env node
/* probes/runlog-merge.mjs — does a second runlog.mjs call MERGE, refuse, or duplicate?
 *
 * An iteration is recorded twice on purpose: the worker knows its ledger and
 * census, run-loop.sh knows its wall time, cost, turns and true pre-blob. The
 * second call used to be REFUSED, so the only one carrying real numbers was thrown
 * away and every worker row read $0.00 / 0m / 0 turns. (#11)
 *
 * Runs the real runlog.mjs against a scratch copy of the skill dir — RUNLOG.jsonl,
 * current-brief.json and LEDGER.md are throwaway, so this never writes the real
 * log — while pointing --repo at the real repo, so the git evidence is genuine.
 *
 *   node .claude/skills/grow-courtyard/probes/runlog-merge.mjs     # exit 0 = all pass
 */
import { mkdtempSync, writeFileSync, readFileSync, copyFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = resolve(SKILL, '../../..');
let pass = 0, fail = 0;
const ok = (c, m, extra = '') => { c ? (pass++, console.log(`  ✔ ${m}`)) : (fail++, console.log(`  ✗ ${m}   ${extra}`)); };

function sandbox({ seedRows = [], ledger = '', brief = null }) {
  const d = mkdtempSync(join(tmpdir(), 'rl-'));
  copyFileSync(join(SKILL, 'runlog.mjs'), join(d, 'runlog.mjs'));
  copyFileSync(join(SKILL, 'census-history.jsonl'), join(d, 'census-history.jsonl'));
  writeFileSync(join(d, 'RUNLOG.jsonl'), seedRows.map(r => JSON.stringify(r)).join('\n') + (seedRows.length ? '\n' : ''));
  writeFileSync(join(d, 'LEDGER.md'), ledger);
  if (brief) writeFileSync(join(d, 'current-brief.json'), JSON.stringify(brief, null, 2));
  return d;
}
const run = (d, args) => execFileSync('node', [join(d, 'runlog.mjs'), '--repo', REPO, ...args], { encoding: 'utf8' }).trim();
const read = d => readFileSync(join(d, 'RUNLOG.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse);

/* a fake `claude -p --output-format stream-json` tail */
function rawStream(dOrPath, { cost, turns }) {
  const p = dOrPath.endsWith('.jsonl') ? dOrPath : join(dOrPath, 'raw.jsonl');
  writeFileSync(p, [
    JSON.stringify({ type: 'assistant', message: { model: 'claude-opus-5' } }),
    JSON.stringify({ type: 'result', total_cost_usd: cost, num_turns: turns, usage: { input_tokens: 900, output_tokens: 12000, cache_read_input_tokens: 1_400_000, cache_creation_input_tokens: 60000 } }),
  ].join('\n') + '\n');
  return p;
}

const BRIEF = { id: 'bX', domain: 'Test', kind: 'Polish', nextIter: 99, attempts: 1, status: 'active' };
const LEDGER = '## Iteration 99 — a thing (2026-08-03) [Test × Polish]\n\n**Verdict:** shipped\n';
/* real blobs from the repo's own history, so srcChanged is genuine evidence */
const g = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' }).trim();
const NOW = g('hash-object', 'courtyard.html');
/* Walk back to the newest commit whose courtyard.html DIFFERS from the working
 * copy. Derived, not a pinned HEAD~n — the loop commits several times per
 * iteration, so any fixed offset rots within the hour. */
const OLD = (() => {
  for (const h of g('log', '-40', '--format=%H').split('\n')) {
    const b = g('rev-parse', `${h}:courtyard.html`);
    if (b && b !== NOW) return b;
  }
  throw new Error('no differing blob in the last 40 commits');
})();

console.log('\n1. worker records itself, then the runner records the same iteration');
{
  const d = sandbox({ brief: { ...BRIEF }, ledger: LEDGER });
  console.log('   worker: ' + run(d, ['--pre-blob', OLD]));
  const after1 = read(d);
  ok(after1.length === 1, 'worker call appends one row');
  ok(after1[0].secs === 0 && after1[0].costUsd === 0, 'worker row has no metrics (it cannot know them)');

  const raw = rawStream(d, { cost: 2.4211, turns: 41 });
  console.log('   runner: ' + run(d, ['--elapsed', '733', '--raw', raw, '--pre-blob', OLD, '--rc', '0']));
  const after2 = read(d);
  ok(after2.length === 1, 'runner call did NOT duplicate the row', `got ${after2.length} rows`);
  const r = after2[0];
  ok(r.secs === 733, 'secs merged in', `secs=${r.secs}`);
  ok(Math.abs(r.costUsd - 2.4211) < 1e-6, 'costUsd merged in', `cost=${r.costUsd}`);
  ok(r.turns === 41, 'turns merged in', `turns=${r.turns}`);
  ok(r.tokens && r.tokens.out === 12000, 'tokens merged in', JSON.stringify(r.tokens));
  ok(r.model === 'claude-opus-5', 'model merged in', String(r.model));
  ok(r.merges === 1 && !!r.updated, 'merge is marked (merges/updated)', JSON.stringify({ m: r.merges, u: r.updated }));
  ok(r.when < r.updated, 'when keeps the first sighting');
  ok(r.evidence.logged === true && r.selfVerdict === 'shipped', 'ledger evidence survives the merge');
  ok(r.verdict === 'shipped', 'verdict recomputed from merged evidence', r.verdict);
  ok(r.evidence.srcLines > 0, 'srcLines counted from the two-blob diff', `srcLines=${r.evidence.srcLines}`);
  rmSync(d, { recursive: true });
}

console.log('\n2. the two-blob numstat is real, not the HEAD~1 fallback');
{
  /* HEAD~1 is the manager plan commit, which does not touch courtyard.html — so
   * the old fallback path would report 0 here while the two-blob diff reports the
   * true count across four commits. */
  const fallback = (g('diff', '--numstat', 'HEAD~1', 'HEAD', '--', 'courtyard.html').match(/^(\d+)\s+(\d+)/) || []);
  const truth = g('diff', '--numstat', OLD, NOW).match(/^(\d+)\s+(\d+)/);
  const want = +truth[1] + +truth[2];
  const d = sandbox({ brief: { ...BRIEF }, ledger: LEDGER });
  run(d, ['--pre-blob', OLD]);
  const got = read(d)[0].evidence.srcLines;
  ok(got === want, `srcLines is the blob-to-blob count (${want}), not HEAD~1's (${fallback.length ? +fallback[1] + +fallback[2] : 0})`, `got=${got}`);
  rmSync(d, { recursive: true });
}

console.log('\n3. no --pre-blob: a hand-run worker recovers its own baseline');
{
  /* Replay the real moment. A worker calls runlog just after its own commit, so
   * HEAD is `Iter 10: …`. Checked out detached at 761a1c7 (iteration 10's source
   * commit), which really did move courtyard.html by 68 lines — the old code
   * scored that `no-ship` for want of a --pre-blob. */
  const wt = join(tmpdir(), 'rl-wt-iter10');
  rmSync(wt, { recursive: true, force: true });
  execFileSync('git', ['-C', REPO, 'worktree', 'add', '--detach', '-q', wt, '761a1c7'], { stdio: 'ignore' });
  try {
    const d = sandbox({ brief: { ...BRIEF, nextIter: 10 }, ledger: '## Iteration 10 — the ticker holds its line\n\n**Verdict:** shipped\n' });
    const out = execFileSync('node', [join(d, 'runlog.mjs'), '--repo', wt], { encoding: 'utf8' }).trim();
    console.log('   ' + out);
    const r = read(d)[0];
    ok(r.evidence.preBlob !== '', 'a baseline was recovered with no --pre-blob', JSON.stringify(r.evidence.preFrom));
    ok(String(r.evidence.preFrom).startsWith('fallback:'), 'and it is marked as a fallback, not runner truth', String(r.evidence.preFrom));
    ok(r.evidence.srcLines === 68, 'and it counts iteration 10\'s real 68 lines', `srcLines=${r.evidence.srcLines}`);
    ok(r.verdict === 'shipped', 'so a hand-run iteration 10 scores shipped, not no-ship', r.verdict);
    rmSync(d, { recursive: true });
  } finally {
    execFileSync('git', ['-C', REPO, 'worktree', 'remove', '--force', wt], { stdio: 'ignore' });
  }
}

console.log('\n4. a manager pass gets NO fallback (HEAD~1 is the previous worker)');
{
  const d = sandbox({ brief: { ...BRIEF, nextIter: 98 }, ledger: '' });
  run(d, ['--kind', 'manager', '--elapsed', '300']);
  const r = read(d)[0];
  ok(r.evidence.preBlob === '' && r.verdict === 'no-ship', 'manager row stays evidence-free on source', `${r.evidence.preBlob}/${r.verdict}`);
  rmSync(d, { recursive: true });
}

console.log('\n5. an unknown never erases a known, in either order');
{
  const raw0 = mkdtempSync(join(tmpdir(), 'raw-'));
  const d = sandbox({ brief: { ...BRIEF }, ledger: LEDGER });
  const raw = rawStream(raw0, { cost: 1.11, turns: 9 });
  run(d, ['--elapsed', '600', '--raw', raw, '--pre-blob', OLD]);   // metrics FIRST
  run(d, ['--pre-blob', OLD]);                                      // bare call SECOND
  const r = read(d)[0];
  ok(read(d).length === 1, 'still one row');
  ok(r.secs === 600 && r.turns === 9 && Math.abs(r.costUsd - 1.11) < 1e-6, 'the bare second call did not zero the metrics', JSON.stringify({ s: r.secs, c: r.costUsd, t: r.turns }));
  ok(r.tokens && r.tokens.out === 12000, 'nor the tokens');
  rmSync(d, { recursive: true }); rmSync(raw0, { recursive: true });
}

console.log('\n6. two REAL runs on one iter accumulate; the same run measured twice does not');
{
  /* run-loop.sh re-runs the manager while the queue stays empty, up to MAX_FAILS
   * times, and `iter` does not advance — so two rows' worth of real spend land on
   * one row. Maxing would report the largest single pass and hide the spiral. */
  const raws = mkdtempSync(join(tmpdir(), 'raw-'));
  const d = sandbox({ brief: { ...BRIEF, nextIter: 97 }, ledger: '' });
  const a = rawStream(join(raws, 'a.jsonl'), { cost: 2.50, turns: 30 });
  const b = rawStream(join(raws, 'b.jsonl'), { cost: 2.20, turns: 26 });
  run(d, ['--kind', 'manager', '--elapsed', '300', '--raw', a]);
  run(d, ['--kind', 'manager', '--elapsed', '420', '--raw', b]);
  const r = read(d)[0];
  ok(read(d).length === 1, 'two manager passes stay one row');
  ok(Math.abs(r.costUsd - 4.70) < 1e-6, 'their cost is summed, not maxed', `cost=${r.costUsd}`);
  ok(r.secs === 720 && r.turns === 56, 'as are secs and turns', JSON.stringify({ s: r.secs, t: r.turns }));
  rmSync(d, { recursive: true }); rmSync(raws, { recursive: true });
}
{
  /* ...but the worker/runner pair is ONE run, and must not be double-counted. */
  const raws = mkdtempSync(join(tmpdir(), 'raw-'));
  const d = sandbox({ brief: { ...BRIEF }, ledger: LEDGER });
  run(d, ['--pre-blob', OLD]);                                                        // worker: no metrics
  run(d, ['--elapsed', '733', '--raw', rawStream(raws, { cost: 2.42, turns: 41 }), '--pre-blob', OLD]);
  const r = read(d)[0];
  ok(Math.abs(r.costUsd - 2.42) < 1e-6 && r.secs === 733 && r.turns === 41,
    'a zero side carries over rather than adding', JSON.stringify({ s: r.secs, c: r.costUsd, t: r.turns }));
  rmSync(d, { recursive: true }); rmSync(raws, { recursive: true });
}

console.log('\n7. a line this version cannot parse survives a rewrite');
{
  const d = sandbox({ brief: { ...BRIEF }, ledger: LEDGER });
  writeFileSync(join(d, 'RUNLOG.jsonl'), 'this is not json\n');
  run(d, ['--pre-blob', OLD]);
  run(d, ['--elapsed', '120', '--pre-blob', OLD]);
  const txt = readFileSync(join(d, 'RUNLOG.jsonl'), 'utf8').split('\n').filter(Boolean);
  ok(txt.length === 2 && txt[0] === 'this is not json', 'the unparseable line is still line 1', JSON.stringify(txt.slice(0, 1)));
  ok(JSON.parse(txt[1]).secs === 120, 'and the merge still landed');
  rmSync(d, { recursive: true });
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
