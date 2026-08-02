# probes

Per-feature measurement scripts that earned their keep.

An ad-hoc probe is born at the repo root as `probe-*.mjs`, where `.gitignore`
ignores it. When a ledger entry cites one, `git mv` it in here and it becomes
tracked source like anything else.

That pattern exists because of a bug in the previous loop: its root ignore rule
was unanchored, so it matched at *every* depth, and every probe worth keeping
needed `git add -f`. For about twenty iterations the ledger cited probes the repo
did not actually contain. The rule here is anchored to the root — check
`.gitignore` before you move the next one.
