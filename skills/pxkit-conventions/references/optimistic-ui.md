# Optimistic UI

The UI reflects the user's action immediately; the API response is the final authority — whatever the server answers is what the UI ends up showing. Build on React's primitives — `useOptimistic` for the overlay, a transition to keep it alive — and keep components clean: the machinery lives in a shared hook, never inline.

## When to use / when not to use

**Use it when** the write almost always succeeds and the user expects instant feedback: toggles (favorite, read/unread, follow), counters (likes), reordering, inline renames — low stakes, instantly reversible, and the client can predict the result.

**Skip it when** being wrong is worse than being slow:

- Destructive or irreversible actions (delete, send, publish) — confirm, then show the real state.
- Money, permissions, auth — the user must see the *server's* answer, not a guess.
- The server decides the outcome (complex validation, allocation, pricing) — the client can't predict the result to show it.
- Consequences the UI can't fake (a toggle that recalculates a whole list server-side).

For those, render `isPending` and wait for the response.

## Standard optimistic update

The canonical value is server-owned (a prop the action revalidates), so success needs no manual commit. On failure the transition settles without one and React reverts to the canonical value by itself:

```tsx
const [optimistic, setOptimistic] = useOptimistic(serverValue);
const [isPending, startTransition] = useTransition();

const handleToggle = (next: boolean) =>
  startTransition(async () => {
    setOptimistic(next); // instant UI
    const result = await toggleFavorite(next); // action revalidates → serverValue updates on success
    if (!result.ok) toast.error(errorCopy[result.errorKey]); // no commit — auto-revert + announce
  });
```

## Coalesced optimistic update — one shared hook

Rapid re-fires (toggle spam, steppers) are debounced *inside* the transition — outside it the overlay snaps back during the wait. That machinery (delay, superseded-call token) is written once as a hook:

```ts
// hooks/use-optimistic-value.ts
export const useOptimisticValue = <T>(
  serverValue: T,
  commit: (value: T) => Promise<Result<null>>,
  delayMs = 0,
) => {
  const [optimistic, setOptimistic] = useOptimistic(serverValue);
  const [isPending, startTransition] = useTransition();
  const latestCallId = useRef(0);

  const mutate = (next: T) => {
    const callId = ++latestCallId.current;
    startTransition(async () => {
      setOptimistic(next); // instant UI
      if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs)); // coalesce window — inside the transition, so the overlay stays up
      if (callId !== latestCallId.current) return; // superseded — the newest interaction wins
      const result = await commit(next);
      if (!result.ok) toast.error(errorCopy[result.errorKey]); // settle without commit → auto-revert
    });
  };

  return { value: optimistic, isPending, mutate };
};
```

Call sites are one line:

```tsx
const favorite = useOptimisticValue(thread.isFavorite, toggleFavorite, 750);

<ToggleButton checked={favorite.value} onCheckedChange={favorite.mutate} />
```

## Rules

- **The canonical value has one owner** — a server prop the action revalidates, or client state committed only on server acknowledgment. Never `useState(serverValue)` with manual sync; the copy goes stale on the first refetch.
- **Everything awaits inside the transition.** The overlay only shows while a transition is pending — a `setTimeout`/debounce outside it flashes the old value back during the wait.
- **Revert is automatic and exact** — a transition that settles without committing falls back to the canonical value. Never negate by hand (`setChecked(!value)` guesses what the previous state was).
- **Announce rollbacks** with a toast fed by the `errorKey` (see [errors.md](errors.md)) — a silent snap-back looks like a glitch.
- **Don't lose the pending write** — flush on unmount, `keepalive: true` if it can fire around tab close (fetch hygiene, [services.md](services.md)).
- `setOptimistic` outside a transition or form action is dropped by React with a warning.
- Same roles with a server-cache library: patch the cache optimistically, reconcile from the response, restore the snapshot on failure.
