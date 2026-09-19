# Components

- **Named arrow-function `const` components with named exports. No default exports** — the only exception is Next.js file conventions (`page.tsx`, `layout.tsx`, `sitemap.ts`), which use `export default function`.
- Props destructured inline in the signature, typed with a `<Component>Props` interface (see [typescript.md](typescript.md)). Tiny local helpers may use an inline object type:

```tsx
export const SubmitButton = ({ label, onSubmit }: SubmitButtonProps) => { ... };

const StatItem = ({ value, label }: { value: string; label: string }) => ( ... );
```

- **Props model only what the component reads.** Don't accept a whole entity to use two fields — declare those two, or derive with `Pick<User, 'id' | 'name'>`. A fat props interface couples the component to data it never touches.
- `children` is `React.ReactNode` in the props interface, or `PropsWithChildren` for simple wrappers.
- `'use client'` / `'use server'` is always the first line of the file when needed.
- **Compound components as flat named exports from one file** (shadcn style — `Card`/`CardHeader`, never `Card.Header`). No namespaced statics: attaching parts as properties drags every part into every import and defeats tree-shaking:

```tsx
export const PageLayout = ({ children }: PageLayoutProps) => ( ... );
export const PageLayoutSidebar = ({ children }: PageLayoutSidebarProps) => ( ... );
export const PageLayoutContent = ({ children }: PageLayoutContentProps) => ( ... );

// usage
<PageLayout>
  <PageLayoutSidebar>...</PageLayoutSidebar>
  <PageLayoutContent>...</PageLayoutContent>
</PageLayout>
```

- **Compound parts — when to use:** the consumer arranges multiple slots with layout meaning (Card, PageLayout, Field). **When not:** a component with a couple of props — don't explode `<Stat value label />` into `Stat`/`StatValue`/`StatLabel` nobody rearranges.
- **Data-driven rendering**: content lives in typed `const items = [...] as const` arrays (or `src/data/*` modules) and components `.map()` over them — content separated from markup. New entry = new array item, not new JSX.
- `memo` only for measured hot render paths, always with an explicit `displayName`.
- Don't sprinkle `useMemo`/`useCallback` by reflex. In React Compiler projects, skip them entirely; otherwise reserve them for genuinely expensive derivations.

## Flat component trees

**Design for the flattest tree possible.** Tracing where a prop comes from must never take 3–6 file jumps.

- Target depth on a page: **page → section → primitive**. Anything deeper needs a reason.
- **No pass-through wrappers.** A component that only forwards props to a single child gets deleted.
- **No prop drilling past one intermediate.** If data has to cross more than one layer, restructure instead of threading it through:

```tsx
// Bad — `user` drills through 3 components that don't use it
<Dashboard user={user} />
// Dashboard → Sidebar → Menu → finally <Avatar user={user} />

// Good — compose at the top; each piece receives its data directly
<Dashboard
  sidebar={
    <Sidebar>
      <UserMenu user={user} />
    </Sidebar>
  }
/>
```

- Alternatives to drilling, in order of preference: **compose via `children`/slot props** (above); **read data where it's used** (a Server Component fetches its own data; a leaf reads context); **lift state only to the lowest common owner**, never to a global "just in case".
