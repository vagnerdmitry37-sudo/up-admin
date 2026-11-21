# Bug 6: Reopening a closed id shows stale data

**Severity:** Low
**Where:** `src/app/shared/entity-edit-page/entity-edit-page.ts` (`containsAll`, `loadedIds`)

## Problem

`loadedIds` ignores subsets so that closing a tab does not reload the records. As a side effect, if the same page instance goes from `?ids=1,2` to `?ids=1` and later back to `?ids=2`, record 2 is not loaded again and shows the data from the first load.

## Steps to reproduce

Only reachable through browser Back/Forward on the same page instance, because closing tabs uses `replaceUrl`. Rare.

## Proposed fix

Accept it and document it, or reset the loaded ids whenever an id that was closed comes back.
