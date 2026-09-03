#!/bin/bash
# quota-gate.sh — does the RUNNER actually run the memory quota, and report it?
#
#   bash .claude/skills/grow-courtyard/probes/quota-gate.sh
#
# #149 built `context-budget.mjs --additions` and nothing ever CALLED it, so for
# thirty iterations the quota bound only a worker that chose to obey SKILL.md. This
# asserts the caller exists and still works, in both directions:
#
#   clean tree  -> step 4 is SILENT and exits 0
#   over-quota  -> step 4 names the offender on all THREE surfaces, exit 3
#
# It runs step 4 of run-loop.sh VERBATIM (extracted, minus the runlog call), so it
# fails if someone deletes or renames the block rather than passing a copy of it.
# It writes to LEDGER.md and state.json and restores them on any exit.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
LOG="$(mktemp)"
log() { printf '%s  %s\n' "$(date '+%H:%M:%S')" "$*" | tee -a "$LOG"; }
PRE_SHA="$(git -C "$REPO" rev-parse HEAD)"

BLOCK="$(awk '/^  # ---- 4\. the memory quota/{f=1} /^  # ---- 5\. record/{f=0} f' "$HERE/run-loop.sh")"
if ! grep -qE 'context-budget\.mjs.* --additions' <<<"$BLOCK"; then
  echo "FAIL: run-loop.sh has no step-4 block calling context-budget.mjs --additions."
  echo "      The quota is back to being honour-system. This is the whole point of #153."
  exit 1
fi

# The restore is a `git checkout --`, so it would silently destroy a real
# iteration's uncommitted ledger entry. Refuse to run on top of one.
if [ -n "$(git -C "$REPO" status --porcelain -- "$HERE/LEDGER.md" "$HERE/state.json")" ]; then
  echo "REFUSING: LEDGER.md or state.json is already dirty — this probe writes to both"
  echo "          and restores them with git checkout. Commit or stash first."
  exit 1
fi
restore() { git -C "$REPO" checkout -- "$HERE/LEDGER.md" "$HERE/state.json" 2>/dev/null; }
trap restore EXIT

fails=0
say() { echo; echo "--- $1 ---"; }

say "clean tree"
# NOT `out=$(eval ...)`: a command substitution is a subshell, so the block's own
# quota_rc would never reach us. Run it HERE and read the output back off disk.
cap="$(mktemp)"; eval "$BLOCK" > "$cap" 2>&1; rc=$quota_rc; out="$(cat "$cap")"
[ "$rc" = "0" ] || { echo "FAIL: clean tree exited $rc, want 0"; fails=$((fails+1)); }
[ -z "$out" ] || { echo "FAIL: clean iteration is not silent:"; echo "$out"; fails=$((fails+1)); }
[ "$rc" = "0" ] && [ -z "$out" ] && echo "ok — silent, exit 0"

say "over-quota tree"
python3 - "$HERE" <<'PY'
import json, sys, os
h = sys.argv[1]
p = os.path.join(h, 'LEDGER.md')
open(p, 'a').write(
  "\n## Iteration 999 — a deliberately fat probe entry (probe) [Probe x Harness]\n\n"
  + "Filler prose that exists only to cross the 1.8 KB cap. " * 45
  + "\n\n## Iteration 998 — a second entry, which one iteration may not write (probe)\n\nShort.\n")
p = os.path.join(h, 'state.json')
st = json.load(open(p))
st['inventory']['sky'].append('a short probe inventory line')
st['inventory']['lane'].append('a deliberately long probe inventory line: ' + 'x' * 260)
st['openCues'].append({'id': 'c900', 'note': 'a short probe cue', 'raisedBy': 999, 'seenBy': 0})
st['openCues'].append({'id': 'c901', 'note': 'a deliberately long probe cue: ' + 'y' * 260, 'raisedBy': 999, 'seenBy': 0})
json.dump(st, open(p, 'w'), indent=1)
PY
cap="$(mktemp)"; eval "$BLOCK" > "$cap" 2>&1; rc=$quota_rc; out="$(cat "$cap")"
echo "$out"
[ "$rc" = "3" ] || { echo "FAIL: over-quota exited $rc, want 3"; fails=$((fails+1)); }
for surface in 'ledger entry' 'inventory line' 'cue note'; do
  grep -q "✗ $surface .* over the " <<<"$out" || { echo "FAIL: no named offender on the $surface surface"; fails=$((fails+1)); }
done
grep -q 'reported, not reverted' <<<"$out" || { echo "FAIL: the runner did not say it is only reporting"; fails=$((fails+1)); }

echo
if [ "$fails" -eq 0 ]; then echo "quota-gate: PASS — the runner runs the quota and names the offender."; exit 0; fi
echo "quota-gate: $fails FAILURE(S)."; exit 1
