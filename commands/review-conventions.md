---
description: Review the current diff (or given files) against the house conventions and report violations
argument-hint: [files or leave empty for working diff]
---

Review against house conventions: $ARGUMENTS (default: the current working diff via `git diff` + `git diff --staged`; fall back to the last commit if clean).

Load the `pxkit-conventions` skill, then read `${CLAUDE_PLUGIN_ROOT}/skills/pxkit-conventions/references/review-checklist.md` and check each changed file against it — ground rules, check order, and output format all come from the checklist. Consult the topic rule files in the same `references/` directory when a finding needs the full rule.
