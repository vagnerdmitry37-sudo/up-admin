# Bug 5: Back after Create returns to an empty form

**Severity:** Low
**Where:** `src/app/shared/entity-edit-page/entity-edit-page.ts` (`createEntity`)

## Problem

After create, the navigation to `?ids=<id>` does not use `replaceUrl`, so the empty create page stays in history.

## Steps to reproduce

1. Open `/edit-products-page`, fill in the form, click Save.
2. Press browser Back.
3. An empty "New product" form opens. A user who expects to go back to the record can fill it in again and create a duplicate.

## Proposed fix

Add `replaceUrl: true` to the navigation in `createEntity`, matching what closing a tab does.
