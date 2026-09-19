# UI/UX Design

How to make frontend decisions once markup and logic are in place.

## Design consistency

- **Reuse before inventing.** Reuse existing UI patterns, tokens, components, and layouts instead of introducing new variations. A new spacing value, color, or layout shape is a last resort, not a first draft.
- **Every decision is part of one system.** A screen should not read as if a different designer built it. When in doubt, match the nearest existing pattern over inventing a locally "better" one.

## Visual hierarchy & spacing

- **Hierarchy communicates priority.** Size, weight, and color should track importance — the primary action or piece of information must be the clearest thing on screen, not the loudest.
- **Use the spacing scale, not eyeballed values.** Consistent rhythm (via the design system's spacing tokens) over one-off margins/padding chosen to "look right" in isolation.
- **Alignment is deliberate.** Elements line up to a shared grid/edge; stray offsets are bugs, not style.

## Responsiveness

- **Responsive behavior is explicit, not incidental.** State how a layout adapts at each breakpoint rather than letting it reflow by accident. If a component only works at one size, say so.
- **Design for the full range**, not just desktop-then-shrink: verify narrow/mobile layouts don't clip, overlap, or hide critical actions.

## Full user journey

Every UI decision should account for the whole journey, not just the success/default state:

- **Interactions** — hover, focus, active, disabled states are defined, not left to browser defaults.
- **Loading** — skeletons/spinners for anything not instant; no blank flashes.
- **Errors** — every failure path has a visible, actionable state (see [errors.md](errors.md) for error copy/keys).
- **Success feedback** — confirm the outcome of an action (toast, inline state, redirect) so the user isn't left guessing.
- **Transitions** — state changes animate deliberately when it aids comprehension; no jarring layout jumps.
