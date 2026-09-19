# pxkit

Strict, opinionated house conventions packaged for Claude Code — self-contained `pxkit-*` skills, thin commands, and a reviewer agent, extracted from real production TypeScript/React/Next.js codebases.

## What's inside

```text
skills/       Self-contained skills — each installs standalone into any repo
  pxkit-conventions/
    SKILL.md             Workflow (inspect → read the topic reference → plan → self-review), task→reference map,
                         condensed cheat sheet, and the non-negotiables a reviewer rejects on sight
    references/          The full rules, one topic per file:
      core-principles      How to work: adapt to the repo, plan by discovering shared layers at scale, be concise, simplest code that works
      naming               kebab-case files, is/has/should booleans, handle*/on*, no barrels
      typescript           interface vs type, status unions, derive-don't-restate, inference-first
      components           Named arrow-const components, compound flat exports, flat trees
      hooks-state          Object-returning hooks, one status union, safe context
      forms                RHF + zod logic, Field/FieldGroup markup, control chooser
      nextjs               Server-first, leaf client boundaries, metadata factories
      styling              Tailwind v4 + cn(), semantic tokens, variants, a11y
      ui-composition       shadcn/ui composition API, overlay chooser, a11y invariants
      ui-ux                Reuse over inventing, hierarchy & spacing, responsive, full journey states
      icons                Direct imports, component objects, no sizing classes inside components
      services             Service layer, one shared http client, DTO mapping, zod at boundaries
      data                 Parse once at the boundary, format at the edge, server-first search/sort/paginate
      optimistic-ui        useOptimistic + useTransition overlay, debounce + reconcile
      errors               SCREAMING error keys, guard clauses, 'Error in <fn>::' logging
      structure            Feature modules (colocated default), optional packages, no barrels
      testing              Colocated tests on pure logic, match repo toolchain
      review-checklist     Canonical review list — shared by the command and the agent
  pxkit-debug/              Gates (no fix without repro / root cause / consumer list), localize → gather → trace → blast radius → verify, report format
  pxkit-nextjs-page/        Thin server page → sections → leaf client boundaries, metadata factory, typed routes (+ references/nextjs.md)
  pxkit-feature/            Feature module — colocated by default, package only at 2+ consumers, grep-checked verify (+ references/structure.md)
  pxkit-form/               Form — schema & error keys first, control chooser, Field markup, RHF, Result submit (+ references/forms.md)
  pxkit-service/            Service boundary — operation contract, shared http client, DTO map, narrowed Result (+ references/services.md, errors.md)

commands/     Slash commands over the skills
  /plan-task             Restate task as verifiable targets, confirm before coding
  /new-component         Design and build a component: role & states → props API →
                         server/client → build → verify
  /new-form              Schema & error keys → controls → Field markup → RHF → Result submit → verify
  /new-service           Operation contract → schema → service → action/handler → verify
  /new-feature           Plan and build a feature end to end: user journey & business
                         logic → atomic UI decomposition (page → section → primitive) →
                         state/communication map → home (route vs features/ vs package) →
                         structure → boundaries → no premature abstraction → verify
  /review-conventions    Review the current diff against review-checklist.md

agents/       Subagents
  conventions-reviewer   Ranked violation report for a diff or files (reads review-checklist.md)

templates/    Slim CLAUDE.md template for projects (skills carry the rules; @-imports as fallback)
```

### Naming scheme

- **Skills** are `pxkit-` + noun (`pxkit-conventions`, `pxkit-debug`) — a prefix nobody else uses, so they never collide with another marketplace's `conventions` or `debug` skill when installed standalone; each is self-contained with its own `references/`.
- **Every workflow skill opens with Gates** — the handful of rules that must hold before the agent may proceed (no code before the plan is confirmed, no fix without a reproduction, no raw `fetch` in a service) — and closes with a **Verify** list whose checks are commands, not prose.
- **Commands** are verb-first imperatives (`/new-component`, `/review-conventions`). They lean on the skills for the rules; `/new-feature` additionally carries the end-to-end build workflow.
- **One word per concept**: "conventions" (plural) and "review" everywhere — skill `pxkit-conventions`, command `/review-conventions`, agent `conventions-reviewer`, reference `review-checklist.md`.
- `pxkit-nextjs-page`, `pxkit-feature`, `pxkit-form`, and `pxkit-service` carry copies of the rule files they need so they install alone; each copy is marked with a keep-in-sync note pointing at the original in `pxkit-conventions/references/`. A copy's prose and cross-skill links may differ from the canonical, but its code blocks must not — `scripts/check-doc-sync.mjs` (run in CI via `.github/workflows/doc-sync.yml`) fails the build if any copy's fenced code drifts from its source.

## Install

**As a plugin** (everything at once — skills, commands, agent):

```text
/plugin marketplace add MohammadShehadeh/pxkit
/plugin install pxkit
```

**Skills only, anywhere** — each skill directory is self-contained (Agent Skills format). Copy any of them into `~/.claude/skills/` (personal) or a repo's `.claude/skills/` (per project):

```text
skills/pxkit-conventions/     →  .claude/skills/pxkit-conventions/
skills/pxkit-debug/           →  .claude/skills/pxkit-debug/
...
```

**Commands & agent** require the plugin install — they resolve the checklist via `${CLAUDE_PLUGIN_ROOT}`. If you copy them out instead, replace that variable with the real path to `skills/pxkit-conventions/`.

**Per project (no skills at all)** — copy `skills/pxkit-conventions/references/` into the repo as `rules/` and use `templates/CLAUDE.md` with its fallback @-imports uncommented.

## The style in one paragraph

Inspect the repo before imposing patterns; named arrow-const components with no default exports and no barrel files; kebab-case filenames; props as `<Component>Props` interfaces; one `status` union per async flow (booleans derived, never stored); **flat component trees** (page → section → primitive, no prop drilling); Tailwind v4 through `cn()` with semantic tokens and the variant → token → wrapper customization ladder; **full composition APIs over raw markup** (Field/FieldGroup forms, Group wrappers, direct icon imports as component objects); server-first Next.js with client boundaries pushed to leaf re-export files; every external system behind a service that maps DTOs and returns `{ ok, data | errorKey }`, with one shared `http` client owning base URL, auth, timeout and error mapping so services never re-type `fetch`; wire values parsed to domain types once at the boundary and formatted at the edge, search/sort/paginate server-first; server state in a query cache (TanStack Query) with `refetchInterval`/invalidation for live updates, never `useState`+`fetch` or hand-rolled polling; optimistic UI on `useOptimistic` + `useTransition`, reconciled by the API response, never a forked copy; **errors are typed SCREAMING_SNAKE codes, never sentences**; guard clauses over conditional mazes; feature modules colocated in the app by default, packages only when shared; plan before coding, simplest code that works, surgical diffs only.

## License

MIT © Mohammad Shehadeh — see [LICENSE.md](LICENSE.md).
