# Bug 2: Layout jumps after Create

**Severity:** Medium
**Where:** `src/app/shared/entity-edit-page/entity-edit-page.ts` (`createEntity`, `tabs`)

## Problem

After create, `ids` changes from nothing to `[newId]`, so `rxResource` gets new params. While it loads, `hasValue()` is false, `tabs()` is `undefined`, and the template's `@if` removes the whole tab bar until the load ends.

`CLAUDE.md` says create mode has its own tab "so the layout does not jump when saving turns it into the record's tab". In practice the tab bar disappears and then comes back.

## Steps to reproduce

1. Open `/edit-products-page` (no `ids`).
2. Fill in the form and click Save.
3. The tab bar and form disappear briefly, then the record's tab appears.

## Proposed fix

Keep the previous tabs while the new records load (keep the last value of `openEntities` while `entities.isLoading()`). Or render the tab bar with a loading state instead of removing it.
