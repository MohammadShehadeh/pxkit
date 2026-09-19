<!--
Copy this into a project root as CLAUDE.md.

Preferred setup: install the pxkit-* skills (plugin install, or copy skills/* into
.claude/skills/) — they load the full rules on demand, keeping this file tiny.

Fallback (no skills): copy skills/pxkit-conventions/references/ into the repo as
rules/ and uncomment the @-imports below. This injects ~1,200 lines into every
session — prefer the skills.
-->

# Code Conventions

House conventions ship as the `pxkit-conventions` skill (with `pxkit-debug`, `pxkit-nextjs-page`, `pxkit-feature`, `pxkit-form`, `pxkit-service` for their workflows). Follow them for all TypeScript/React/Next.js code in this repo.

**Adapt to this repo** — match existing layout, aliases, UI layer, and toolchain before adding new patterns. The skills describe house style, not a mandate to restructure unrelated code.

Non-negotiables: plan before coding and confirm the approach; be concise; say "I don't know" instead of guessing; simplest code that works; surgical diffs only.

<!-- Fallback @-imports — only if the skills are not installed:
@rules/core-principles.md
@rules/naming.md
@rules/typescript.md
@rules/components.md
@rules/hooks-state.md
@rules/forms.md
@rules/nextjs.md
@rules/styling.md
@rules/ui-composition.md
@rules/ui-ux.md
@rules/icons.md
@rules/services.md
@rules/data.md
@rules/optimistic-ui.md
@rules/errors.md
@rules/structure.md
@rules/testing.md
-->
