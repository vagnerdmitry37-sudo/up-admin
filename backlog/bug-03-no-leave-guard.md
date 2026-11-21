# Bug 3: No unsaved-changes guard when leaving the page

**Severity:** Medium (already there before the review)
**Where:** Edit routes in `src/app/app.routes.ts`, `src/app/shared/entity-edit-page/entity-edit-page.ts`

## Problem

Closing a tab asks first (Discard / Keep editing). But leaving the page by any other way throws away every dirty form with no warning: the nav menu, browser Back, a reload or closing the browser tab. There is no `canDeactivate` guard or `beforeunload` handler anywhere in `src`.

## Steps to reproduce

1. Open a record and change a field.
2. Click a different page in the nav menu (or press Back, or reload).
3. The changes are gone and nothing asked first.

## Proposed fix

- Add a `canDeactivate` guard to the three edit routes that asks when `changedForms().length > 0`, using the same Discard / Keep editing dialog.
- Add a `beforeunload` listener for reloads and for closing the browser tab.
- Apply it to orders, products and customers together (entity features must stay mirrors).
