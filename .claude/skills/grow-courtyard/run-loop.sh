#!/bin/bash
# The grow-courtyard runner: a manager Claude and a worker Claude, taking turns.
#
#   ./run-loop.sh                 run until stopped
#   MAX_ITERS=5 ./run-loop.sh     five landed iterations, then exit
#   ./run-loop.sh --status        how is it going?
#   touch .../grow-courtyard/STOP graceful stop after the current iteration
#
# Each iteration is a fresh `claude -p` with an empty context. The next starts when
# the previous exits — event-based, no fixed interval. Two roles:
#
#   MANAGER  reads the accumulated stats, ledger and state; writes a queue of
#            briefs; curates the loop's memory. Runs when the queue empties, or
#            early when a stall signal fires.
#   WORKER   takes the next brief, builds it, proves it, logs it, commits, exits.
#
# The manager is the whole point. The previous version of this loop had only
# workers: each one picked its own vector from a static menu using a state header
# it had itself written. It ran well for ~330 iterations and then spent its last
# thirty either thrashing (80% reverts) or re-proving that it had run out of ideas
# — nine consecutive iterations that each surveyed the world, concluded everything
# already existed, and exited. Nobody's job was to notice the pattern and change
# the frame. That is now a separate process with its own prompt and its own log.
#
# Env:
#   PERM         permission mode (default: auto). See the note below.
#   MODELS       comma-separated model priority list (default: opus,sonnet). The loop
#                runs on the first; when a usage limit rejects THAT model it drops to
#                the next and retries immediately, and only sleeps when the whole list
#                is spent. MODELS=opus pins one model and restores the sleep-only
#                behaviour; MODELS= (empty) inherits whatever `claude` defaults to.
#   MAX_ITERS    stop after this many COMPLETED worker iterations (default: unlimited)
#   VERBOSE      0 = boundaries only, 1 = live action feed (default), 2 = full prose
#   LOG          log file (default: ~/Library/Logs/courtyard-grow.log)
#   PUSH         1 = push to origin after each landed iteration (default: 1)
#   MANAGER_GAP  min worker iterations between stall-triggered manager runs (default: 2)
#   DRY_RUN      1 = print the first manager decision and exit (tests the gap logic)
#
# Permissions: `auto` still blocks on anything .claude/settings.json does not allow,
# and a blocked prompt in -p mode reads as a denied tool. If iterations stall on
# permissions, either allow the needed Bash patterns in settings.json, or set
# PERM=bypassPermissions — which turns off every permission check for this loop.
# That is a real decision, not a default: this loop runs git commits, git push and
# a browser, unattended. Read it twice.

set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"

PERM="${PERM:-auto}"
MAX_ITERS="${MAX_ITERS:-0}"
LOG="${LOG:-$HOME/Library/Logs/courtyard-grow.log}"
PUSH="${PUSH:-1}"
MANAGER_GAP="${MANAGER_GAP:-2}"
# A usage limit is per MODEL, not per account: on 2026-09-01 the loop sat in a
# 30-minute sleep/retry cycle for hours against an exhausted Fable 5 while every
# other model was free, and burned 16 re-issues of one brief doing it. So the model
# is a LIST, and a limit walks down it before it ever sleeps.
MODELS="${MODELS-opus,sonnet}"
VERBOSE="${VERBOSE:-1}"

STOP_FILE="$HERE/STOP"
# The lock lives OUTSIDE the repo on purpose: an in-repo lock dir is an untracked
# file, which trips the clean-tree preflight — the runner would refuse to start
# because of its own lock.
LOCK_DIR="${TMPDIR:-/tmp}/courtyard-grow-$(echo "$REPO" | cksum | cut -d' ' -f1).lock"
RATE_FILE="${TMPDIR:-/tmp}/courtyard-grow-rate.json"

SPIN_GUARD="${SPIN_GUARD:-10}"      # floor between iterations, so a fast-crashing claude cannot spin
MAX_FAILS="${MAX_FAILS:-5}"
BACKOFF_BASE="${BACKOFF_BASE:-60}"
BACKOFF_CAP="${BACKOFF_CAP:-900}"
# A rate limit is the expected end of a long unattended run, not a failure.
LIMIT_FALLBACK="${LIMIT_FALLBACK:-1800}"
LIMIT_RETRY="${LIMIT_RETRY:-120}"
LIMIT_MAX="${LIMIT_MAX:-21600}"

mkdir -p "$(dirname "$LOG")"
log() { printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG"; }

IFS=',' read -ra MODEL_LIST <<< "$MODELS"
[ ${#MODEL_LIST[@]} -eq 0 ] && MODEL_LIST=("")
model_i=0; MODEL_NOW="${MODEL_LIST[0]}"

# A long wait must still answer the STOP file. `touch STOP` during a 30-minute
# rate-limit sleep used to sit unread until the sleep ended — up to half an hour
# after the runner looked, to the person watching, like it had ignored them.
nap() {
  local left="$1"
  while [ "$left" -gt 0 ]; do
    if [ -f "$STOP_FILE" ]; then log "    STOP file appeared during the wait — cutting it short."; return 0; fi
    sleep $(( left > 15 ? 15 : left ))
    left=$(( left - 15 ))
  done
}

# ---- --status ----------------------------------------------------------------
if [ "${1:-}" = "--status" ]; then
  if [ -f "$LOCK_DIR/pid" ] && kill -0 "$(cat "$LOCK_DIR/pid")" 2>/dev/null; then
    echo "grow-courtyard: RUNNING (pid $(cat "$LOCK_DIR/pid"))"
    running=1
  else
    echo "grow-courtyard: stopped"; running=0
  fi
  echo "  repo: $(git -C "$REPO" rev-parse --short HEAD 2>/dev/null) $(git -C "$REPO" log -1 --format=%s 2>/dev/null | cut -c1-52)"
  if [ -n "$(git -C "$REPO" status --porcelain 2>/dev/null | grep -v 'census-history\.jsonl$')" ]; then
    if [ "$running" = "1" ]; then
      echo "  · working tree dirty — an iteration is in flight (expected)"
    else
      echo "  ⚠ working tree DIRTY and no runner is live — an iteration died mid-flight."
      echo "    The commit is the LAST thing an iteration does, so this may be finished,"
      echo "    gate-passing work. Re-run census.mjs; do not reflexively discard it."
    fi
  fi
  echo
  node "$HERE/stall.mjs" --report 2>/dev/null
  echo
  node "$HERE/context-budget.mjs" --terse 2>/dev/null | sed 's/^/  context: /'
  echo "  last log:  $(grep -E 'iteration [0-9]+ (starting|landed|FAILED)|manager|session limit|giving up|runner exiting' "$LOG" 2>/dev/null | tail -1 | sed 's/^[0-9-]* //')"
  exit 0
fi

# ---- single writer -----------------------------------------------------------
# Never run two of these. The census is a differential measurement against a
# baseline pinned just before an edit; two concurrent editors make every diff
# meaningless, and the CA is chaotic enough that the damage is not obvious.
DRY_RUN="${DRY_RUN:-0}"
if [ "$DRY_RUN" = "1" ]; then
  # No lock, no preflight, no claude: just the loop's first decision, printed.
  LOCK_DIR="${TMPDIR:-/tmp}/courtyard-grow-dry-$$.lock"; mkdir -p "$LOCK_DIR"
elif ! mkdir "$LOCK_DIR" 2>/dev/null; then
  if [ -f "$LOCK_DIR/pid" ] && kill -0 "$(cat "$LOCK_DIR/pid")" 2>/dev/null; then
    log "another runner is live (pid $(cat "$LOCK_DIR/pid")) — refusing to start."
    exit 1
  fi
  log "clearing stale lock from pid $(cat "$LOCK_DIR/pid" 2>/dev/null || echo '?')"
  rm -rf "$LOCK_DIR" && mkdir "$LOCK_DIR" || { log "could not take lock"; exit 1; }
fi
echo $$ > "$LOCK_DIR/pid"
cleanup() { rm -rf "$LOCK_DIR"; log "runner exiting."; }
trap cleanup EXIT
trap 'log "interrupted — stopping after signal."; exit 0' INT TERM

# ---- preflight ---------------------------------------------------------------
cd "$REPO" || exit 1
[ "$DRY_RUN" = "1" ] || command -v claude >/dev/null || { log "claude not on PATH"; exit 1; }
git rev-parse --git-dir >/dev/null 2>&1 || { log "$REPO is not a git repo — the loop needs commits to revert and to measure."; exit 1; }

# An iteration killed mid-flight leaves its work uncommitted. That is often a
# COMPLETE, gate-passed iteration that only missed its `git commit`. Surface it;
# do not start a new one on top of it, and do not discard it.
# census-history.jsonl is append-only and grows on ANY census run — including a
# diagnostic one a human does to inspect this very situation — so it is not
# evidence of a dead iteration.
dirty() { git -C "$REPO" status --porcelain | grep -v -e 'census-history\.jsonl$' -e '^?? shots/'; }
if [ "$DRY_RUN" != "1" ] && [ -n "$(dirty)" ]; then
  log "REFUSING: $REPO has uncommitted changes. They may be a dead iteration's"
  log "finished work, or they may be yours. Look before you start the loop:"
  log "    git -C $REPO status && git -C $REPO diff"
  exit 1
fi

# Not on a dry run: it takes its own lock and can therefore run BESIDE a live
# runner, and clearing the file out from under one would silently cancel a stop
# the person watching had already asked for.
[ "$DRY_RUN" = "1" ] || rm -f "$STOP_FILE"
log "=== grow-courtyard runner up. repo=$REPO perm=$PERM max_iters=${MAX_ITERS:-unlimited} push=$PUSH ==="

# ---- one `claude -p` invocation ----------------------------------------------
# Sets: rc, elapsed, raw   — and handles nothing else, so the manager and worker
# paths share exactly one definition of "run Claude and notice a rate limit".
run_claude() {
  local prompt="$1" label="$2" started
  started=$(date +%s)
  raw="$(mktemp)"; : > "$RATE_FILE"
  local margs=()
  [ -n "$MODEL_NOW" ] && margs=(--model "$MODEL_NOW")
  claude -p "$prompt" --permission-mode "$PERM" ${margs[@]+"${margs[@]}"} \
         --output-format stream-json --verbose < /dev/null 2>&1 \
    | tee -a "$raw" \
    | VERBOSE="$VERBOSE" node "$HERE/fmt-stream.mjs" --rate-file "$RATE_FILE" \
    | tee -a "$LOG"
  rc=${PIPESTATUS[0]}
  elapsed=$(( $(date +%s) - started ))
}

# Returns 0 and sets `wait_s` if the last run hit a usage limit.
rate_limited() {
  local rl_status="" rl_resets="" rl_limited="" limit_line=""
  if [ -s "$RATE_FILE" ]; then
    rl_status="$(node -e 'try{const j=require(process.argv[1]);process.stdout.write(j.status??"")}catch{}' "$RATE_FILE" 2>/dev/null || true)"
    rl_resets="$(node -e 'try{const j=require(process.argv[1]);process.stdout.write(String(j.resetsAt??""))}catch{}' "$RATE_FILE" 2>/dev/null || true)"
    rl_limited="$(node -e 'try{const j=require(process.argv[1]);process.stdout.write(j.limited===true?"1":"")}catch{}' "$RATE_FILE" 2>/dev/null || true)"
  fi
  # `allowed` fires on EVERY run and `allowed_warning` means "close to a limit,
  # request still served". Neither stopped the work — testing != "allowed" once put
  # a healthy, shipped iteration to sleep for half an hour and never counted it.
  if [ "$rl_limited" = "1" ]; then limit_line="rate_limit_event: status=$rl_status"
  elif [ -n "$rl_status" ]; then
    case "$rl_status" in allowed|allowed_*) ;; *) limit_line="rate_limit_event: status=$rl_status";; esac
  elif [ "$rc" -ne 0 ]; then
    # No structured event (older CLI): fall back to the English message, but only on
    # a nonzero exit — otherwise a run that merely READS this file matches itself.
    limit_line="$(grep -m1 -iE "hit your (session|usage) limit|rate limit exceeded" "$raw" || true)"
  fi
  [ -z "$limit_line" ] && return 1

  local reset="" why=""
  wait_s=""
  if [ -n "$rl_resets" ] && [ "$rl_resets" -gt "$(date +%s)" ] 2>/dev/null; then
    wait_s=$(( rl_resets - $(date +%s) ))
    reset="$(date -r "$rl_resets" '+%-I:%M%p' 2>/dev/null || echo "$rl_resets")"
  else
    # "resets 6:40pm (Australia/Melbourne)" -> seconds until that clock time.
    # grep -oiE, not `sed …I`: the case-insensitive sed flag is GNU-only.
    reset="$(grep -oiE '[0-9]{1,2}:[0-9]{2} ?[apm]{2}|[0-9]{1,2} ?[apm]{2}' <<<"$(grep -m1 -iE 'resets' "$raw" 2>/dev/null || echo)" | head -1)"
    if [ -n "$reset" ]; then
      local norm target
      norm="$(tr -d ' ' <<<"$reset" | tr '[:lower:]' '[:upper:]')"
      [[ "$norm" != *:* ]] && norm="${norm%[AP]M}:00${norm##*[0-9]}"
      target="$(date -j -f "%I:%M%p" "$norm" "+%s" 2>/dev/null || true)"
      [ -n "$target" ] && wait_s=$(( target - $(date +%s) ))
    fi
  fi
  # Every branch must leave a SANE wait. A reset time that has already passed used
  # to wrap to +86400 and sleep the loop for 23.9 hours — alive, growing nothing.
  if   [ -z "$wait_s" ];                 then wait_s=$LIMIT_FALLBACK; why="couldn't parse a reset time"
  elif [ "$wait_s" -lt 0 ];              then wait_s=$LIMIT_RETRY;    why="reset time already passed"
  elif [ "$wait_s" -gt "$LIMIT_MAX" ];   then wait_s=$LIMIT_FALLBACK; why="reset >${LIMIT_MAX}s away, polling instead"
  else wait_s=$(( wait_s + 60 )); why="reset at $reset"
  fi
  log "    \"$(tr -d '\n' <<<"$limit_line" | cut -c1-70)\""
  log "    sleeping $(( wait_s / 60 ))m ($why). Not a failure; nothing is retried but the wait."
  return 0
}

# A limit answered by a cheaper model is not a wait at all. Returns 0 (and re-points
# MODEL_NOW) when there is another model to drop to; the caller retries immediately.
next_model() {
  [ $(( model_i + 1 )) -lt ${#MODEL_LIST[@]} ] || return 1
  model_i=$(( model_i + 1 )); MODEL_NOW="${MODEL_LIST[$model_i]}"
  log "    the limit is on the MODEL, not the account: dropping to ${MODEL_NOW:-the CLI default} and retrying now (no sleep)."
  return 0
}
# After a real sleep the top of the list has had its reset — start there again, so a
# single hour on the fallback does not pin the whole run to it.
reset_model() {
  [ "$model_i" -eq 0 ] && return 0
  model_i=0; MODEL_NOW="${MODEL_LIST[0]}"
  log "    back to ${MODEL_NOW:-the CLI default} after the wait."
}

# ---- the loop ----------------------------------------------------------------
done_ok=0        # landed worker iterations — what MAX_ITERS counts
fails=0
unlaunched=""    # the last cycle ended before a worker ever read the brief (a limit
                 # rejected the launch): the next pop re-issues it WITHOUT counting an
                 # attempt. 16 of b93's 17 "attempts" were this — sleep, reject, bump.
last_manager=0   # worker-iteration index of the last manager pass. Baselined at the
                 # start, not -99: with -99 the stall check ran BEFORE the first landed
                 # iteration whatever MANAGER_GAP said. A fresh start now honours the gap.

while :; do
  if [ -f "$STOP_FILE" ]; then
    log "STOP file present — stopping cleanly after $done_ok iteration(s)."
    # A dry run must not CONSUME it either — see the note by the startup clear.
    [ "$DRY_RUN" = "1" ] || rm -f "$STOP_FILE"
    exit 0
  fi
  if [ "$MAX_ITERS" -gt 0 ] && [ "$done_ok" -ge "$MAX_ITERS" ]; then
    log "reached MAX_ITERS=$MAX_ITERS — stopping."; exit 0
  fi

  # ---- 1. does the manager need to step in? ----------------------------------
  need_manager=0; why_manager=""
  if ! node "$HERE/pop-brief.mjs" --peek >/dev/null 2>&1; then
    need_manager=1; why_manager="queue empty"
  elif [ $(( done_ok - last_manager )) -ge "$MANAGER_GAP" ]; then
    # Stall signals fire the manager EARLY — this is the whole difference from the
    # previous loop, which reviewed on a fixed cadence and so could burn ten
    # iterations before anyone noticed the run had gone sideways. Rate-limited by
    # MANAGER_GAP so a persistent signal cannot summon a manager every iteration.
    sig="$(node "$HERE/stall.mjs" 2>/dev/null)"
    if [ -n "$sig" ] && [ "$sig" != "ok" ]; then need_manager=1; why_manager="stall signals: $sig"; fi
  fi
  if [ "$DRY_RUN" = "1" ]; then
    echo "dry-run: done_ok=$done_ok last_manager=$last_manager gap=$MANAGER_GAP -> need_manager=$need_manager${why_manager:+ ($why_manager)}"
    exit 0
  fi

  if [ "$need_manager" = "1" ]; then
    log "--- manager pass ($why_manager) ---"
    run_claude "/courtyard-manager" manager
    if rate_limited; then
      rm -f "$raw"
      if next_model; then continue; fi
      nap "$wait_s"; reset_model; continue
    fi
    node "$HERE/runlog.mjs" --repo "$REPO" --elapsed "$elapsed" --raw "$raw" --rc "$rc" --kind manager 2>&1 | tee -a "$LOG" || true
    rm -f "$raw"
    last_manager=$done_ok
    if ! node "$HERE/pop-brief.mjs" --peek >/dev/null 2>&1; then
      fails=$((fails + 1))
      log "manager finished but the queue is STILL empty [$fails/$MAX_FAILS]."
      log "  The manager's one hard rule is that it may never leave an empty queue —"
      log "  saturation is a reason to climb the escalation ladder, not to stop."
      if [ "$fails" -ge "$MAX_FAILS" ]; then log "giving up. Check $LOG and plan.json."; exit 1; fi
      nap 60; continue
    fi
    # A manager pass may commit its plan; land it before the worker starts so the
    # worker's own diff is only its own work.
    if [ -n "$(dirty)" ]; then
      git -C "$REPO" add -A ".claude/skills/grow-courtyard" && git -C "$REPO" commit -q -m "Manager: plan refresh" || true
    fi
  fi

  # ---- 2. claim the next brief ------------------------------------------------
  if ! node "$HERE/pop-brief.mjs" ${unlaunched:+--no-bump} 2>&1 | tee -a "$LOG"; then
    log "pop-brief failed unexpectedly — backing off."; nap 60; continue
  fi
  unlaunched=""

  # The artifact's blob hash BEFORE the iteration. This is what makes the verdict
  # evidence rather than self-report: whatever the worker writes about itself, this
  # hash either changed or it did not.
  PRE_BLOB="$(git -C "$REPO" hash-object courtyard.html)"

  # ---- 3. the worker ----------------------------------------------------------
  log "--- iteration $((done_ok + 1)) starting${MODEL_NOW:+ (model: $MODEL_NOW)} ---"
  run_claude "/grow-courtyard" worker
  if rate_limited; then
    rm -f "$raw"
    # Under 30 s with a limit event is a REJECTED LAUNCH: no worker read the brief, so
    # the re-issue must not count as an attempt. A limit that lands mid-iteration
    # (#93 died at 855 s with work on disk) is a real attempt and still counts.
    [ "$elapsed" -lt 30 ] && unlaunched=1
    log "--- iteration $((done_ok + 1)) hit a session limit after ${elapsed}s (brief stays claimed${unlaunched:+, launch rejected — not counted as an attempt}) ---"
    if next_model; then continue; fi
    nap "$wait_s"; reset_model; continue
  fi

  # ---- 4. record what actually happened --------------------------------------
  node "$HERE/runlog.mjs" --repo "$REPO" --elapsed "$elapsed" --raw "$raw" \
       --pre-blob "$PRE_BLOB" --rc "$rc" 2>&1 | tee -a "$LOG" || true
  rm -f "$raw"

  if [ "$rc" -ne 0 ]; then
    fails=$((fails + 1))
    # runlog.mjs decides whether a worker ever STARTED (rc!=0 with no tokens, or
    # seconds long = the CLI died, not the worker). In that case it leaves the
    # brief `active` and the pop at the top of the next loop re-issues the SAME
    # brief; only a worker that actually ran and failed retires its brief.
    #
    # A worker that DID run (tokens > 0, > 30 s) and exited non-zero is the third
    # case. The rule, decided at #43: ONE retry, then retire. runlog.mjs leaves the
    # brief `active` with a `retry` note on attempt 1 (pop-brief re-issues it as
    # attempt 2, under a fresh iteration number — the crash was a real run and
    # keeps its row, verdict `failed`, rc in the row); on attempt 2 it retires the
    # brief. Half-done work on disk is the retry's problem: it starts from a tree
    # the crashed run may have left dirty, which is what the worker's "check the
    # brief against reality" step is for.
    if grep -q '"status": "active"' "$HERE/current-brief.json" 2>/dev/null; then
      if grep -q '"retry":' "$HERE/current-brief.json" 2>/dev/null; then
        log "--- iteration $((done_ok + 1)) FAILED (exit $rc) after ${elapsed}s — worker ran; brief re-issued ONCE [$fails/$MAX_FAILS] ---"
      else
        log "--- iteration $((done_ok + 1)) never launched (exit $rc after ${elapsed}s) — brief stays claimed, re-issued next loop [$fails/$MAX_FAILS] ---"
      fi
    else
      log "--- iteration $((done_ok + 1)) FAILED (exit $rc) after ${elapsed}s — brief retired (second attempt, or launch check said the worker ran) [$fails/$MAX_FAILS] ---"
    fi
    if [ "$fails" -ge "$MAX_FAILS" ]; then log "$MAX_FAILS consecutive failures — giving up. Check $LOG."; exit 1; fi
    backoff=$(( BACKOFF_BASE * (1 << (fails - 1)) ))
    [ "$backoff" -gt "$BACKOFF_CAP" ] && backoff=$BACKOFF_CAP
    log "backing off ${backoff}s."
    nap "$backoff"; continue
  fi

  fails=0
  done_ok=$((done_ok + 1))
  log "--- iteration $done_ok landed in ${elapsed}s ---"

  # ---- 5. publish -------------------------------------------------------------
  # The dashboard is regenerated HERE, in bash, and never inside the `claude -p`
  # agent: if an iteration rebuilt its own scoreboard, that work would inflate the
  # very cost and time the page reports.
  node "$HERE/build-stats.mjs" 2>&1 | tee -a "$LOG" || true
  if [ -n "$(git -C "$REPO" status --porcelain -- stats.html .claude/skills/grow-courtyard)" ]; then
    git -C "$REPO" add stats.html .claude/skills/grow-courtyard
    git -C "$REPO" commit -q -m "stats: refresh dashboard (after iteration $done_ok)" || true
  fi
  if [ "$PUSH" = "1" ]; then
    git -C "$REPO" push -q origin HEAD 2>/dev/null \
      || log "warn: push failed (GitHub Pages will lag until the next successful push)"
  fi

  # Event-based: the next iteration starts now. The floor exists only so an
  # iteration that dies instantly cannot spin the CPU.
  [ "$elapsed" -lt "$SPIN_GUARD" ] && sleep $(( SPIN_GUARD - elapsed ))
done
