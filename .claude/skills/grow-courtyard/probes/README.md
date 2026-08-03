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

**`git mv` it, don't just commit it where it lies.** Iteration 9 put
`parapet-and-boat.mjs` in a *second* `probes/` directory at the repo root. Nothing
ignored it — it was tracked the whole time — but it was not here, so #10 read it as
missing and blamed a `.gitignore` line that has never existed. Two directories with
the same name is its own failure mode. There is one `probes/`, and this is it.
Probes resolve the artifact as `../../../../courtyard.html`. (moved at #11)
