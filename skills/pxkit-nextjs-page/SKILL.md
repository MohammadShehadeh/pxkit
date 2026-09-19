---
name: pxkit-nextjs-page
description: Build a Next.js App Router page, route group, or landing section the pxkit way — a thin server page composing section components, client boundaries pushed to leaf re-export files, metadata through the root title template and a createPageMetadata factory, routes registered in one typed config. Use whenever the user asks for a new page, route, landing/marketing section, hero, pricing or about page, layout, route group, SEO metadata, or sitemap entry — even when they only say "add a page for X".
---

# pxkit Next.js Page

Full detail in [references/nextjs.md](references/nextjs.md). Load `pxkit-conventions` for component, styling, and boundary rules. **Match the repo's** layout wrappers, routes config location, and path aliases before writing a line.

## Gates

- **The page file only composes sections.** No business logic, no markup beyond layout.
- **No `'use client'` on a page or section.** A client page drags every section into the client bundle; interactivity lives in a leaf.
- **No layout wrapper or section "base component" invented for one page.** Use the repo's container; otherwise plain `<section>`.
- **No metadata block copy-pasted between sibling pages** once there are three; they go through the factory.
- **No route added without registering it in the typed routes config** when the repo has one; nav and `sitemap.ts` derive from it.

## Recipe

1. **Page = thin server component** (`export default function`, the one place a default export is allowed) composing named section components:

```tsx
export default function Home() {
  return (
    <>
      <section><Hero /></section>
      <section><WhatIDo /></section>
    </>
  );
}
```

Wrap sections in the project's layout/container component when one exists.

2. **Sections are server components**: kebab-case files, named arrow-const exports, colocated with the route (shared `components/` only when used by 2+ routes). Content is a typed `as const` array mapped to markup. **Keep the tree flat**: page → section → primitive; no pass-through wrappers, no prop drilled past one intermediate. A section's markup should be readable in its own file without following imports.

3. **Interactivity goes to the leaves.** A section needing animation imports `MotionDiv` from the `components/motion.tsx` client boundary; it does not become a client component itself. Icons import directly from the project's icon library (they render fine server-side).

4. **Metadata**: the root layout owns `metadataBase` and `title: { template: '%s - Site Name', default: '...' }`; the page exports a static `Metadata` object with bare `title`, `description`, full `openGraph` + `twitter`, and `alternates.canonical`. Repeated route families go through a `createPageMetadata(config)` factory plus a JSON-LD factory injected as a plain `<script type="application/ld+json">` with `<` escaped (snippets in [references/nextjs.md](references/nextjs.md)).

5. **Routing**: group by domain with `(folder)` route groups, each with its own `layout.tsx`. A self-contained feature owns its `components/`, `lib/`, `hooks/`, and colocated tests. Use the framework's file conventions (`not-found.tsx`, `error.tsx`, `loading.tsx`, `sitemap.ts`) instead of hand-rolling them.

6. **Register the route** in the repo's typed routes/navigation config; nav and `sitemap.ts` both derive from that single source.

## Verify

- `rg "'use client'" <route folder>` matches only leaf files, never `page.tsx`, `layout.tsx`, or a section.
- `rg "export default" <route folder>` matches only Next.js file conventions.
- Every section that loads data has its empty, loading, and error state.
- Metadata resolves through the root template (check the rendered `<title>`), and the canonical URL is absolute.
- The route appears in nav and `sitemap.ts` without a second hardcoded path.
- The repo's `typecheck` and `lint` scripts pass.
