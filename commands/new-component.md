---
description: Design and build a React component the house way — role and states first, props API before markup, composition over new primitives, no speculative flexibility
argument-hint: <ComponentName> [where / notes]
---

Create a component: $ARGUMENTS

Load the `pxkit-conventions` skill. Think through phases 1–3 before writing any markup.

## 1. Understand — role before markup

- **Place it in the tree**: is this a page-level section, a block inside one, or a primitive? It must sit at page → section → primitive depth — if it only forwards props downward, it shouldn't exist.
- **Search first**: an existing shadcn/ui primitive or house component may already do this. Compose or extend before creating; a new shared primitive is the last resort, only when no shared one fits.
- **Enumerate its states up front**: default, hover/focus, loading, empty, error, disabled — whichever apply. Every visible state must trace to a prop or state in the design; discovering states mid-build is how boolean props sneak in.
- **Name it by business meaning**: `MessageRow`, `PlanCard` — not `ListItem2`, `Wrapper`.

## 2. Design the props API — before the markup

- **Minimal**: only the props today's call sites need. No speculative variants, sizes, or flags — the flexibility nobody asked for is the review comment you'll get.
- **Composition over configuration**: `children`/slot props over render-config props; compound components over prop-heavy ones (`Card` + `CardHeader`, never `<Card header={...} footer={...} />`).
- **Variants are a typed union prop** backed by a lookup map or CVA — never a pile of booleans (`isPrimary`, `isLarge`).
- **State stays with its owner**: the component receives values and emits `on*` callbacks (`onArchive`, `onSelect`); it does not fetch or own state its siblings also need. Booleans read `is/has/should`; internal handlers are `handle*`.
- Declare `interface <Component>Props` (no `I` prefix), destructured in the signature; `children: React.ReactNode` when composed.

## 3. Decide server vs client

- Server component unless it needs interactivity — and then `'use client'` at this leaf only, never hoisted.
- Animation comes from the `motion.tsx` client boundary; icons import directly from the icon library as component objects (server-safe, no string keys, no sizing classes inside the component).

## 4. Build

- File: kebab-case matching the export (`SubmitButton` → `submit-button.tsx`), colocated with its feature (route or package `components/`) — top-level shared only if genuinely cross-feature. Named arrow-const export, no default export, no barrel `index.ts`.
- Compose shadcn/ui primitives with their full anatomy (Card Header/Content/Footer, `FieldGroup`/`Field` for form markup, items inside their Group) — never rebuild `Separator`/`Skeleton`/`Badge`/`Alert` with raw divs. Dialog/Sheet/Drawer get a Title; Avatar gets a Fallback.
- Tailwind only, merged with `cn()`; semantic tokens, no arbitrary hex, no inline styles; `gap-*` not `space-*`; customize via the ladder (variant → layout-only `className` → token → new variant → wrapper).
- Lists render from a typed `as const` array — content out of markup.
- Failures render from a typed `errorKey` resolved at render time — never a hardcoded error string.
- A11y: `focus-visible:` styles, ARIA label if icon-only, `aria-hidden` on decorative elements, `role="alert"` on error output.

## 5. Verify

- Every state from phase 1 renders correctly — including empty, loading, and error.
- The tree stayed flat: no new pass-through layer, no prop drilled past one intermediate.
- Typecheck and lint pass. Final test: would a senior engineer call this overcomplicated?
