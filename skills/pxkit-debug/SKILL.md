---
name: pxkit-debug
description: The pxkit debugging method for TypeScript, React, and Next.js — reproduce, localize top-down (page → section → block → component), map references both ways, trace to the root cause (interrogating where/why/how for wrong-value bugs), and account for the blast radius before fixing. Use whenever the user reports a bug, regression, crash, flaky behavior, "wrong value", "it used to work", or asks why something renders or computes incorrectly — even when they only ask for a quick fix.
---

# pxkit Debug

Bugs are found by **narrowing location**, fixed by **tracing causation**, and shipped by **checking the blast radius**. The first place a bug is visible is rarely where it lives. Work the five steps in order and report in the format at the end.

## Gates

- **No fix without a reproduction.** If you cannot reproduce, say so and ask for the input, route, or account state that triggers it.
- **No edit before the root cause is named** as "correct input becomes wrong output at `file:line` because <assumption that doesn't hold>".
- **No edit to shared code before its consumers are listed** (step 4).
- **No fix that adds a flag to a shared function** so two callers can disagree. That is two functions; duplicate it.

## 1. Localize — walk the tree down

Reproduce first. Then narrow along the render hierarchy:

**page → section → block → component**

At each level ask "does the bug still reproduce below this point?" and descend. Flat trees (`pxkit-conventions`: `components` rule) keep this walk short; if localizing takes more than a few jumps, that is itself a finding worth reporting.

The result is the **defect site**: where the bug *reproduces*, not yet where it *lives*.

## 2. Gather — map references in both directions

References are many-to-many: the defect component is used by many consumers and itself uses many dependencies. Before touching anything, build the local graph:

- **Inbound (who references it)**: grep the file's import path. Direct imports with no barrels (`pxkit-conventions`: `structure` rule) mean every consumer is one grep away: `rg "components/date-range-picker"` returns the complete consumer list.
- **Outbound (what it references)**: its imports — hooks, services, context, constants, lib.

## 3. Trace — follow references to the root cause

Walk outbound from the defect site toward the data: component → hook → service → boundary. The bug usually lives where a **decision** is made (pure logic), not where its result is rendered.

- The greppable log prefix (`'Error in <fn>::'`, `pxkit-conventions`: `errors` rule) tells you which layer produced the bad value.
- Stop at the first place where correct input becomes wrong output. That is the bug; everything downstream is symptom.

### Wrong-value bugs: interrogate where / why / how

A crash hands you a stack trace; a **wrong value** ("the table shows the wrong total") does not, so prune the candidate set by intent instead of reading every line. At each site on the path from step 2's graph, ask:

- **Where** does this value come from? Every transform between boundary and render is a candidate: the DTO mapper, a `??` default, a cast, a `new Date(...)`, a `.find()`, a cache, an optimistic overlay.
- **Why** is it shaped this way *here*? Each transform encodes an **assumption** (this field is always present; this string is a parseable date; this list has the row). Name the assumption. The one that doesn't hold for the failing input is the bug.
- **How** does each consumer use it, and as the producer intended? A value correct at its source but read in the wrong unit / shape / timezone by one consumer is a **coupling** bug, not a production bug; carry it to step 4.

Each assumption you *confirm* eliminates that site; the one you cannot confirm is where to look. Most branches rule themselves out before you touch code.

## 4. Blast radius — account before you fix

The root cause often sits in shared code, and the higher the abstraction, the more consumers one edit touches. Before editing:

- List every inbound reference of the file you are about to change (step 2's grep, run on the *cause* file).
- For each consumer: does the fix change a contract they rely on, or only the broken behavior?
- Fix once at the shared root; a guard in the shared function beats a patch in every caller.
- If some consumers depend on the "broken" behavior, the shared thing was two things. Split the abstraction. Do not add a flag to keep everyone happy; that papers over wrong coupling.

## 5. Verify

- The original reproduction path is clean: page → section → block → component.
- Every consumer from step 4's list still behaves: typecheck, tests, and a look at the screens sharing the code.
- Add the regression test where the decision lives (pure logic, `pxkit-conventions`: `testing` rule), not where the symptom rendered.
- The diff contains only the fix and its test. No opportunistic cleanup rode along.

## Report format

Report in this shape:

```text
Reproduction: <route / input / state> → <observed> (expected <…>)
Defect site:  <file:line> — where it reproduces
Root cause:   <file:line> — <assumption that doesn't hold for this input>
Blast radius: <N consumers of the cause file> — <unchanged | contract change: …>
Fix:          <one line>
Regression:   <test file> — <what it pins>
```
