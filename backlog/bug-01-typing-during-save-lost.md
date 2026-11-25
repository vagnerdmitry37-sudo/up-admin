# Bug 1: Typing during save is silently lost

**Severity:** Medium
**Where:** `src/app/shared/entity/entity-edit-page/entity-edit-page.ts` (`updateEntities`), `src/app/shared/entity/entity-form/entity-form.ts` (reset effect)

## Problem

Forms stay editable while saving. `save` captures the changed forms when it starts. When the update finishes, `entities.reload()` delivers new entity objects, and the `EntityForm` effect calls `form().reset(value)` on every tab.

## Steps to reproduce

1. Open two records (`?ids=1,2`).
2. Edit tab A and click Save.
3. While the PUT is running, switch to tab B and type.
4. When the save ends, tab B's typing is replaced by the server values. No warning is shown.

## Proposed fix

Disable the forms while `saving()` is true (for example, expose `saving` and call `form.disable()` / `enable()` in `EntityForm`). Alternatively, reset only forms that are still pristine, or only the forms that were saved.
