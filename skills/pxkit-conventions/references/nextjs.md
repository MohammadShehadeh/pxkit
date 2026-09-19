# Next.js App Router

## Server-first

- **Server Components by default; `'use client'` only when needed, pushed to the leaves.** Sections of a page stay server-side; interactivity lives in small leaf wrappers.
- **Centralize client boundaries in re-export files** instead of scattering `'use client'`: a `components/motion.tsx` exporting `MotionDiv`/`MotionSpan` is the single client boundary for animation. (Icons need no boundary — import them directly from the icon library; see [icons.md](icons.md).)
- **`'use client'` is justified by:** event handlers and local interactivity, browser APIs, stateful hooks, client-only libraries. **Not by:** rendering data (stay server), animation (`motion.tsx` boundary), icons (server-safe) — and never higher than the leaf that needs it.

## Routing & page composition

- **Route groups `(folder)` organize by domain** without affecting URLs — `(marketing)`, `(dashboard)`, `(content)` — each with its own `layout.tsx`.
- **Pages are thin server components that compose named section components** — semantic `<section>` (or the project's layout wrapper) per block; no business logic in the page file:

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

Use the repo's layout/container component when one exists — do not introduce a parallel wrapper pattern.

- **Feature-colocated modules**: a self-contained route folder (or `features/<name>/`) holds its own `components/`, `lib/`, `hooks/`, `constants/`, plus colocated `*.test.ts`. Only cross-feature code goes to top-level shared folders.
- Use the framework's file conventions (`not-found.tsx`, `global-error.tsx`, `sitemap.ts`, `manifest.json`, `robots.txt`, route handlers) instead of hand-rolling.

## Metadata & SEO

- Root layout defines `metadataBase: new URL(siteConfig.url)` — relative `openGraph`/canonical paths break without it — and `title: { template: '%s - Site Name', default: 'Site Name — tagline' }`; pages set a bare `title` (home omits it and falls back to `default` — with a comment saying why).
- Every page ships full `openGraph` + `twitter` + `alternates.canonical`.
- **Repetitive metadata goes through a factory** — one config object per route, not copy-pasted metadata blocks:

```ts
// lib/page-metadata.ts (path follows the repo)
interface PageMetaConfig {
  title: string;
  description: string;
  path: string;
}

export const createPageMetadata = ({ title, description, path }: PageMetaConfig): Metadata => ({
  title,
  description,
  alternates: { canonical: path },
  openGraph: { title, description, url: path, images: ['/og.jpg'] },
  twitter: { card: 'summary_large_image', title, description },
});
```

- JSON-LD structured data via a plain `<script>` tag (not `next/script`), built by a sibling factory (`createPageJsonLd(config)`) and injected by the shared page layout — escape `<` against XSS:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
/>
```

- **`sitemap.ts` and nav share one typed routes config** — a single source of truth module (wherever the repo keeps site structure); both derive from it.

## Data & env

- Static content lives in typed data modules (`NavigationItem[]` or equivalent); use `.tsx` data files when entries embed JSX/icons.
- Env vars are typed and validated with zod (e.g. `@t3-oss/env-nextjs`, single `env.ts`) — never raw `process.env` reads scattered across files.
- Use the project's path aliases (`@/*` or equivalent) — do not add a second alias scheme.
