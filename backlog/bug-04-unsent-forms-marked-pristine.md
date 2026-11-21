# Bug 4: Unsent forms marked as saved

**Severity:** Low
**Where:** `src/app/shared/entity-edit-page/entity-edit-page.ts` (`updateEntities`)

## Problem

`changes` leaves out any form whose entity is not found in `entities.value()`, but `markAsPristine()` still runs on all of `changedForms`. A skipped form's edits are never sent, yet its tab no longer looks dirty and Save disappears.

Also, when `entities.hasValue()` is false, `updateEntities` returns without telling the user anything.

## Steps to reproduce

Hard to trigger today: the loaded list must not contain the form's id while saving (for example, a reload is in progress).

## Proposed fix

Mark as pristine only the forms that were actually in `changes`. If some forms did not match, report it through `AppMessageService.error` instead of dropping them silently.
