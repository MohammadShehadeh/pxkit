# UI Composition

**The component layer is [shadcn/ui](https://ui.shadcn.com) when the project uses it.** Base UI lives in `components/ui` (or the repo's shared UI package), added via the CLI (`npx shadcn@latest add <component>`) — never hand-written and never replaced with another library unless the repo already chose one. Features compose these primitives; these rules are about *how* to compose them. For version-specific APIs, consult the current shadcn docs/skill rather than memory. (Form markup lives in [forms.md](forms.md); icon rules in [icons.md](icons.md).)

## Use the full composition API

A multi-part component gets its full anatomy — never dump everything into one slot, and never rebuild a part with raw divs:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Team Members</CardTitle>
    <CardDescription>Manage your team.</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>
    <Button>Invite</Button>
  </CardFooter>
</Card>
```

- **Items always live inside their Group/List wrapper**: `SelectItem` inside `SelectGroup`, `DropdownMenuItem` inside `DropdownMenuGroup`, `TabsTrigger` inside `TabsList`, `CommandItem` inside `CommandGroup` — never directly in the content container.
- **Existing primitive over custom markup**:

| Instead of | Use |
| --- | --- |
| `<hr>` or `<div className="border-t">` | `<Separator />` |
| `<div className="animate-pulse">` + styled divs | `<Skeleton className="h-4 w-3/4" />` |
| `<span className="rounded-full bg-green-100 ...">` | `<Badge variant="secondary">` |
| Styled `div` callout | `<Alert>` + `AlertTitle` + `AlertDescription` |

## Choosing overlays

| Use case | Component |
| --- | --- |
| Focused task that requires input | `Dialog` |
| Destructive action confirmation | `AlertDialog` |
| Side panel with details or filters | `Sheet` |
| Mobile-first bottom panel | `Drawer` |
| Quick info on hover | `HoverCard` |
| Small contextual content on click | `Popover` |

## Accessibility invariants

- `Dialog`, `Sheet`, and `Drawer` **always** get a `Title` — `className="sr-only"` if visually hidden.
- `Avatar` **always** includes `AvatarFallback` for when the image fails:

```tsx
<Avatar>
  <AvatarImage src="/avatar.png" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

- Buttons have no `isLoading` prop — compose: `<Button disabled><Spinner /> Saving...</Button>`.
