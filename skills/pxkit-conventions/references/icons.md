# Icons

- **Import icons directly from the project's configured icon library** (`lucide-react`, `@tabler/icons-react`, …). Check which one the project uses — never assume. Icons render fine in Server Components — no client boundary needed.
- **Pass icons as component objects, never string keys to a lookup map**:

```tsx
// Bad
const iconMap = { check: CheckIcon, alert: AlertIcon };
interface StatusBadgeProps { icon: keyof typeof iconMap }
const StatusBadge = ({ icon }: StatusBadgeProps) => { const Icon = iconMap[icon]; return <Icon />; };

// Good
import { CheckIcon } from 'lucide-react';
interface StatusBadgeProps { icon: React.ComponentType }
const StatusBadge = ({ icon: Icon }: StatusBadgeProps) => <Icon />;
<StatusBadge icon={CheckIcon} />
```

- **No sizing or spacing classes on icons inside components that already size their own** — `Button`, `DropdownMenuItem`, `Alert`, etc. size (`[&_svg]:size-4`) and space (`gap-2`) direct icon children via CSS. Drop the icon in bare; don't add `size-4` or `mr-2`:

```tsx
// Bad — fighting styles the component already applies
<Button><SearchIcon className="mr-2 size-4" /> Search</Button>

// Good — bare child; the component sizes it, its gap spaces it
<Button><SearchIcon /> Search</Button>
<Button>Next <ArrowRightIcon /></Button>
```

Sizing classes are correct when the icon stands alone (`<CheckIcon className="size-5 text-primary" />`) — outside a component that manages its own icons, you own the size.
