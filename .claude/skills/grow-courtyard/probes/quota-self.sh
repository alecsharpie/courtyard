#!/bin/bash
# quota-self.sh — does runlog.mjs take the memory-quota reading ITSELF when
# the runner hands nothing over?  #153 wired step 4 into run-loop.sh and every row
# since is `quota: null`, because the live bash loop still holds pre-#153 text.  So
# the reading must not depend on its caller.
#
# Staged: a throwaway git repo holding a courtyard.html and a copy of the skill dir,
# so nothing here touches the real RUNLOG.  HEAD's runlog.mjs is the control — it is
# run on the same staged repo and must produce the null this iteration removes.
#   bash .claude/skills/grow-courtyard/probes/quota-self.sh
set -u
SKILL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
pass=0; fail=0
ok(){ if [ "$2" = "$3" ]; then echo "  ✓ $1: $2"; pass=$((pass+1)); else echo "  ✗ $1: got [$2] want [$3]"; fail=$((fail+1)); fi; }

stage(){ # $1 = dir, $2 = which runlog (cur|head)
  rm -rf "$1"; mkdir -p "$1/.claude/skills/grow-courtyard"; D="$1/.claude/skills/grow-courtyard"
  cp "$SKILL/context-budget.mjs" "$D/"
  if [ "$2" = head ]; then git -C "$SKILL" show HEAD:./runlog.mjs > "$D/runlog.mjs"
  else cp "$SKILL/runlog.mjs" "$D/"; fi
  printf '<html>the town</html>\n' > "$1/courtyard.html"
  printf '# Laws\n' > "$D/LAWS.md"; printf '# SKILL\n' > "$D/SKILL.md"
  printf '# Ledger\n\n## Iteration 899 — before (2026-01-01) [x]\n\nold.\n' > "$D/LEDGER.md"
  cat > "$D/state.json" <<'J'
{ "lastIteration": 899, "inventory": { "lane": ["a kiosk"] }, "openCues": [{"id":"c1","note":"a loose end"}], "watch": [] }
J
  printf '{"id":"b900","domain":"D","kind":"Harness","nextIter":900,"status":"active","attempts":1}\n' > "$D/current-brief.json"
  : > "$D/RUNLOG.jsonl"
  git -C "$1" init -q; git -C "$1" config user.email p@p; git -C "$1" config user.name p
  git -C "$1" add -A; git -C "$1" commit -qm "Iter 899: baseline"
}

# what the iteration APPENDS, on top of the staged baseline
L(){ echo "$1/.claude/skills/grow-courtyard/LEDGER.md"; }
append_one(){ printf '\n## Iteration 900 — did a thing (2026-09-03) [D x Harness]\n\n**Did.** one line.\n' >> "$(L "$1")"; }
append_three(){ for n in 900 901 902; do printf '\n## Iteration %s — a thing (2026-09-03) [D x Harness]\n\n**Did.** one line.\n' "$n" >> "$(L "$1")"; done; }
q(){ node -e 'const l=require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n").filter(Boolean);const r=JSON.parse(l[l.length-1]);const s=process.argv[2];console.log(s==="q"?(r.quota===null?"null":JSON.stringify({rc:r.quota.rc,over:(r.quota.over||[]).length,source:r.quota.source})):r.evidence.preSha?"has-preSha":"no-preSha")' "$1/.claude/skills/grow-courtyard/RUNLOG.jsonl" "${2:-q}"; }

T=$(mktemp -d)

echo "1. clean iteration, no --quota-out — the reading must arrive anyway"
stage "$T/a" cur; append_one "$T/a"
git -C "$T/a" add -A; git -C "$T/a" commit -qm "Iter 900: did a thing"
node "$T/a/.claude/skills/grow-courtyard/runlog.mjs" --repo "$T/a" --elapsed 600 >/dev/null 2>&1
ok "quota" "$(q "$T/a")" '{"rc":0,"over":0,"source":"self"}'
ok "preSha recorded" "$(q "$T/a" p)" "has-preSha"

echo "2. same repo, HEAD's runlog.mjs — the control"
stage "$T/b" head; append_one "$T/b"
git -C "$T/b" add -A; git -C "$T/b" commit -qm "Iter 900: did a thing"
node "$T/b/.claude/skills/grow-courtyard/runlog.mjs" --repo "$T/b" --elapsed 600 >/dev/null 2>&1
ok "control is null" "$(q "$T/b")" "null"

echo "3. a BREACH — three ledger entries, one iteration"
stage "$T/c" cur; append_three "$T/c"
git -C "$T/c" add -A; git -C "$T/c" commit -qm "Iter 900: did three things"
node "$T/c/.claude/skills/grow-courtyard/runlog.mjs" --repo "$T/c" --elapsed 600 >/dev/null 2>&1
ok "quota rc/over/source" "$(q "$T/c")" '{"rc":3,"over":1,"source":"self"}'

echo "4. BEFORE the commit — the worker's own call, additions still in the tree"
stage "$T/d" cur; append_three "$T/d"
node "$T/d/.claude/skills/grow-courtyard/runlog.mjs" --repo "$T/d" --elapsed 600 >/dev/null 2>&1
ok "uncommitted breach seen" "$(q "$T/d")" '{"rc":3,"over":1,"source":"self"}'

echo "5. the runner DID hand one over — no second measurement"
stage "$T/e" cur; append_three "$T/e"
git -C "$T/e" add -A; git -C "$T/e" commit -qm "Iter 900: did three things"
printf 'this iteration ADDITIONS\n\nOK — this iteration is inside its own quota.\n' > "$T/e/qout.txt"
# if it re-ran context-budget.mjs the report would say OVER; it must read the handover instead
node "$T/e/.claude/skills/grow-courtyard/runlog.mjs" --repo "$T/e" --elapsed 600 --quota-out "$T/e/qout.txt" --quota-rc 0 >/dev/null 2>&1
ok "handover wins, not re-run" "$(q "$T/e")" '{"rc":0,"over":0,"source":"runner"}'

echo "6. a MANAGER pass is not a worker append — stays unmeasured"
stage "$T/f" cur; append_one "$T/f"
git -C "$T/f" add -A; git -C "$T/f" commit -qm "Manager: plan refresh"
node "$T/f/.claude/skills/grow-courtyard/runlog.mjs" --repo "$T/f" --elapsed 600 --kind manager >/dev/null 2>&1
ok "manager quota" "$(q "$T/f")" "null"

echo "7. a ref that does not resolve — NOT MEASURED, and NOT a clean pass"
stage "$T/g" cur; append_three "$T/g"
# --additions exits 0 with 'nothing to diff' here; recording that as rc 0 would log
# a breach as a pass, which is the exact confusion #164's law is about.
node "$T/g/.claude/skills/grow-courtyard/runlog.mjs" --repo "$T/g" --elapsed 600 --pre-sha 0000000000000000000000000000000000000000 >/dev/null 2>&1
ok "unresolvable ref" "$(q "$T/g")" "null"

echo "8. no repo at all"
stage "$T/h" cur; append_three "$T/h"; rm -rf "$T/h/.git"
node "$T/h/.claude/skills/grow-courtyard/runlog.mjs" --repo "$T/h" --elapsed 600 >/dev/null 2>&1
ok "no-repo quota" "$(q "$T/h")" "null"

rm -rf "$T"
echo; echo "quota-self: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
