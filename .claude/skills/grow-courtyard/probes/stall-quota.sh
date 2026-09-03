#!/bin/bash
# stall-quota.sh — does stall.mjs SEE the memory quota, and does it stay quiet when
# there is nothing to see?
#
#   bash .claude/skills/grow-courtyard/probes/stall-quota.sh
#
# #153 put `quota {rc, over[]}` on every row and stall.mjs greped it zero times, so
# a worker could append over the read budget on every iteration and never appear in
# the report the manager plans from. This stages three RUNLOGs in a temp directory
# and runs BOTH stall.mjs's over each: the working tree's, and HEAD's, which is the
# control — a signal that HEAD also prints is not a signal this change added.
#
#   breached   -> quotaBreach fires, names the SURFACE, exit 2   (HEAD: silent)
#   unmeasured -> quotaUnmeasured fires, advisory, exit 0        (HEAD: silent)
#   clean      -> NEITHER fires                 <- the zero that makes the two above
#                                                  evidence rather than a stuck bit
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

cp "$HERE/stall.mjs" "$TMP/stall.mjs"
git -C "$REPO" show "HEAD:.claude/skills/grow-courtyard/stall.mjs" > "$TMP/stall-head.mjs" || exit 1

# The rows are synthetic and DULL on purpose: shipped, source moved, 60-line diffs,
# rotating domains, flat cost. Every other signal in the file is written to stay
# quiet on a run like this, so anything that fires is the quota reader or a bug.
stage() {   # stage <mode>  -> writes $TMP/RUNLOG.jsonl
  python3 - "$TMP/RUNLOG.jsonl" "$1" <<'PY'
import json, sys
out, mode = sys.argv[1], sys.argv[2]
doms = ['Courtyard & garden', 'Lane & market', 'River & far bank', 'Roofs & skyline']
rows = []
for i in range(140, 164):
    r = {'iter': i, 'kind': 'worker', 'domain': doms[i % 4], 'changeKind': 'Deepen',
         'verdict': 'shipped', 'selfVerdict': 'shipped', 'secs': 1500, 'costUsd': 6.0,
         'evidence': {'srcChanged': True, 'srcLines': 60, 'sha': 'deadbee'}, 'quota': None}
    if mode == 'clean':
        r['quota'] = {'rc': 0, 'over': None}
    elif mode == 'breach':
        r['quota'] = {'rc': 0, 'over': None}
        if i >= 162:
            r['quota'] = {'rc': 3, 'over': [
                'ledger entry 2.50 KB over the 1.8 KB cap — ## Iteration %d — a fat entry' % i,
                'cue note 291 B over the 250 B cap — a loose end nobody merged']}
    rows.append(r)
open(out, 'w').write('\n'.join(json.dumps(r) for r in rows) + '\n')
PY
}

fails=0
check() { # check <label> <file> <want-exit> <grep-or-EMPTY> ...
  local label="$1" mjs="$2" want="$3"; shift 3
  local out rc
  out="$(node "$mjs" --report 2>&1)"; rc=$?
  echo "  [$label] exit $rc"
  [ "$rc" = "$want" ] || { echo "  FAIL: $label exited $rc, want $want"; fails=$((fails+1)); }
  for pat in "$@"; do
    if [[ "$pat" == !* ]]; then
      grep -q -- "${pat:1}" <<<"$out" && { echo "  FAIL: $label should NOT print '${pat:1}'"; fails=$((fails+1)); }
    else
      grep -q -- "$pat" <<<"$out" || { echo "  FAIL: $label does not print '$pat'"; fails=$((fails+1)); }
    fi
  done
  LAST_OUT="$out"
}

echo "=== 1. two iterations in a row over the quota ==="
stage breach
check "HEAD   " "$TMP/stall-head.mjs" 0 '!quota'
check "cand   " "$TMP/stall.mjs"      2 'quotaBreach' '2 iterations in a row appended over the memory quota' 'ledger x2' 'cue x2' '#163'
grep -E 'memory quota|quotaBreach' <<<"$LAST_OUT" | sed 's/^/      /'

echo
echo "=== 2. the field present and never filled (what HEAD's own RUNLOG looks like) ==="
stage unmeasured
check "HEAD   " "$TMP/stall-head.mjs" 0 '!quota'
check "cand   " "$TMP/stall.mjs"      0 'quotaUnmeasured' 'measured nothing for 24 iterations' '!quotaBreach'
grep -E 'memory quota|quotaUnmeasured' <<<"$LAST_OUT" | sed 's/^/      /'

echo
echo "=== 3. measured and clean — the control that makes the two above mean something ==="
stage clean
check "cand   " "$TMP/stall.mjs" 0 '!quotaBreach' '!quotaUnmeasured' 'memory quota: 24/24 rows measured, 0 over'
grep -E 'memory quota' <<<"$LAST_OUT" | sed 's/^/      /'

echo
echo "=== 4. the disk table degrades without a repo (this temp dir is not one) ==="
grep -q 'the loop on disk' <<<"$LAST_OUT" || { echo "  FAIL: no disk table"; fails=$((fails+1)); }
grep -qE 'RUNLOG.jsonl +[0-9.]+ KB' <<<"$LAST_OUT" || { echo "  FAIL: no size for RUNLOG.jsonl"; fails=$((fails+1)); }
grep -E 'the loop on disk|RUNLOG' <<<"$LAST_OUT" | sed 's/^/      /'
echo "  ...and WITH a repo, in the real skill directory:"
node "$HERE/stall.mjs" --json > "$TMP/real.json"
python3 - "$TMP/real.json" <<'PY' || fails=$((fails+1))
import json, sys
d = json.load(open(sys.argv[1]))
print('      slope over %d iterations (#%s -> #%s):' % (d['disk']['iters'], d['disk']['from'], d['disk']['to']))
for f in d['disk']['files']:
    print('        %-18s %7.1f KB  %+.2f KB/iter' % (f['file'], f['bytes'] / 1024, f['perIter'] / 1024))
print('      quota:', json.dumps(d['quota']))
PY

echo
if [ "$fails" -eq 0 ]; then echo "stall-quota: PASS — the quota is visible in the report, and silent when clean."; exit 0; fi
echo "stall-quota: $fails FAILURE(S)."; exit 1
