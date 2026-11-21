# UPAdmin

## Entity operations go only through the action menu

Create, edit, save, delete and any other operation on an entity are done only through the footer action menu (`app-edit-menu`), registered with `EditActionsService.register`. Do not add in-page buttons that perform these operations: not in empty states, forms, table rows or page toolbars. To draw attention to an action, register it with `suggested: true` and, if needed, point to it in text.

### Click actions and hold actions

Each action is defined in one place, `ACTIONS` in `layout/edit-menu/edit-menu.ts` (a `Record<EditAction, …>` with label, icon and trigger kind, in arc order), so a new `EditAction` without a full entry fails the build. The trigger kind is: `click` (create, edit) runs on a normal click; `hold` (save, delete) runs only after the button is pressed and held for `DEFAULT_HOLD_DURATION_MS` (800 ms). Releasing, leaving the button or losing focus before then cancels it. Keyboard users hold Enter or Space. Registrations never choose the kind: they only supply `click`, and the menu decides how it is triggered.

The input handling lives in `shared/action-trigger` (`ActionTrigger`, `[appActionTrigger]="kind"`, emits `triggered`). While holding it adds `action-trigger-holding`, sets `--action-trigger-hold-progress` (0 to 1) on the host and exposes `holding()` and `holdProgress()` (`exportAs: 'actionTrigger'`). While holding, `EditMenu` shows `<app-progress-ring [value]="trigger.holdProgress()" />`, a ring that fills clockwise from the top, so the user sees how much of the hold is left; once the action runs it switches to the spinning ring (see below). It can be put on any button that needs a hold.

### Running state of an action

There is one running flag for the whole menu: `EditActionsService.runningAction`. An action's `click` returns the promise of its request (Save: `save()`, Delete: `deleteEntities(ids)` or the image `delete`); `EditActionsService.run` sets `runningAction` to that action, awaits the promise and clears it in `finally`. Components never keep their own `saving` / `deleting` flags. While an action runs:

- the menu draws `app-progress-ring` around its button and sets `aria-busy`;
- the action stays listed even if its page now marks it not `visible` (Save after the forms turn pristine, Delete after the selection is cleared);
- `run` ignores every action, so nothing runs twice or alongside it;
- `EntityEditPage` disables closing tabs (`actionRunning`).

Saving with Enter in a form goes through the same path: `EntityForm` calls `EntityEditPage.submit`, which calls `run('save')`.

`shared/progress-ring` (`ProgressRing`, `app-progress-ring`) is a ring in the primary color flush with its parent's edge, with no gap, so it reads as the button's own border. Without `value` it is the Optimus `p-progress-spinner` (work of unknown length); with `value` (0 to 1) it is its own SVG ring filled to that fraction over a border-colored track, because Optimus has no determinate circular progress. It is decorative (`aria-hidden`); the parent must be `position: relative` and set `aria-busy` itself, and the ring must be a sibling of a button, not its child, because Optimus buttons have `overflow: hidden` and would clip it (`EditMenu` wraps each button in `.edit-menu-action`). Use it for any round button that shows work in progress.

## Request errors are shown globally

There are exactly two kinds of error display:

- **Form validation errors** are shown in the form, at the invalid field (`app-field-frame`'s reserved error line).
- **Every other error** (failed requests, rejected uploads, unexpected exceptions) is shown only as a toast through `AppMessageService.error(summary, detail)` (`core/app-message.service.ts`). It wraps Optimus's `MessageService`, which is injected only there; app code never calls `MessageService.add` directly. Warning and info methods will be added to `AppMessageService` the same way when needed. How long a toast stays is set once for the whole app by `messageLife` (8 s) on the `p-toast` in `Shell`; messages never pass their own `life`. Such errors are never shown as an inline message, banner or error block in a page. After such an error a page falls back to a neutral state (for example an empty table), not a blank screen. Uncaught exceptions reach `core/app-error-handler.ts` (`AppErrorHandler`, registered as Angular's `ErrorHandler`), which shows a generic toast; it skips `HttpErrorResponse` because the interceptor below already showed one.

Every failed API request is turned into one Optimus toast (`p-toast` in `Shell`, fed through `AppMessageService.error`) by `core/error.interceptor.ts`, so pages never catch HTTP errors to show a message. The interceptor maps the status to a plain-language summary: 0 no connection, 400 the validation messages, 403 not allowed, 404 refresh and try again, 409 the server `detail`, 5xx try again later. It skips 401 and `auth/` requests, which `authInterceptor` and `SessionService` handle, except `auth/login`: there it skips only 400, which `LoginPage` shows inline as rejected credentials, so a failed login (no connection, 5xx) still gets a toast; and rethrows the error so callers still stop. Write server `detail` texts for 409 so a user can read them.

## Entity features are mirrors: orders, products, customers

`src/app/features/orders`, `src/app/features/products` and `src/app/features/customers` are the same feature built for three entities. They must stay structurally identical. Any change to one of them is applied to all three in the same change, unless the entity truly cannot support it; in that case say so explicitly to the user instead of silently diverging.

### Shared shape (`<entity>` = order | product | customer)

| Piece      | Location               | Convention                                                                                                                                                                                                                                                                  |
| ---------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List route | `app.routes.ts`        | `path: '<entity>s'`, title `<Entity>s · UP`, `data: { heading: '<Entity>s' } satisfies PageHeadingData`                                                                                                                                                                     |
| Edit route | `app.routes.ts`        | `path: 'edit-<entity>s-page'`, no path params, `data: { heading: '<Entity>s', editPage: true } satisfies PageHeadingData`                                                                                                                                                   |
| List page  | `<entity>s-page/`      | `loadPage = <Entity>sService.list`, `deleteEntities = <Entity>sService.delete` and `columns`; template is only `<app-entity-list-page [loadPage]="loadPage" [deleteEntities]="deleteEntities" [columns]="columns" editPath="/edit-<entity>s-page" entityName="<entity>" />` |
| Edit page  | `edit-<entity>s-page/` | `readonly ids = input<string>()`, `load<Entity>s = <Entity>sService.get`, `<entity>Name`, `<entity>Writer` (`EntityWriter` with `create` and `update`); template is only `<app-entity-edit-page>` with one `<ng-template let-<entity>>` holding the form                    |
| Service    | `<entity>s.service.ts` | same method names across entities                                                                                                                                                                                                                                           |
| Form       | `<entity>-form/`       | used by the edit page                                                                                                                                                                                                                                                       |

The footer shows the page heading next to the nav menu button (`layout/page-heading`, `PageHeading`). It reads `heading` from the deepest active route's data, so nested components such as the order items table cannot change it. On a route with `editPage: true` it adds the current action as a muted word after a separator: `Orders / Edit` when the URL has `ids`, `Orders / New` when it has none. The action is text, not an icon in a circle, because round elements in the footer are buttons. Routes without `heading` (not found) show no heading.

Selected IDs travel as the `ids` query param (`/edit-products-page?ids=1,2`), bound to the edit page's `ids` input by `withComponentInputBinding()`. Do not add `:id` path params: the edit pages open several records as tabs, and a required path segment would break `/edit-products-page` without IDs.

### Developer steps for any change touching one entity feature

1. Make the change in the entity you were asked about.
2. Apply the equivalent change to the other two entities: routes, list page, edit page, service, form, templates, styles.
3. Keep names parallel (`ProductsPage` / `OrdersPage` / `CustomersPage`, `productName` / `orderNumber` / `customerName`, and so on).
4. Search all three features for the old name, path or pattern to confirm nothing was left behind.
5. Report which entity could not follow and why, if any.

### Known gaps between the three (close them, do not copy them)

- None open.

### Deleting lives in `EntityListPage`

Entities are deleted only from the list table: select one or more rows, hold Delete in the action menu (registered by `EntityTable`, which runs its `deleteRows` input). There is no confirmation dialog: the press-and-hold is the safeguard. The list page's `delete` then calls `deleteEntities(ids)` (one bulk DELETE), clears the selection and reloads the table; Delete shows the running ring until that finishes (see Running state of an action). Customers that still have orders are refused by the API with 409.

### Edit page logic lives in `EntityEditPage`

`shared/entity-edit-page` owns everything the three edit pages share; entity pages only supply `ids`, `load`, `label`, `entityName` (same word as the list page's, used for the "New …" tab), `writer` (`create` and `update`, both required), `listPath` and the form template. Shared behaviour (creating and updating) goes there, not into the entity pages. Deleting is not done here: it lives in `EntityListPage`.

- With `ids`: loads the records and shows one tab per record, rendering the template with the record. The tab bar is shown for any number of records, one included, so the layout never jumps while tabs are closed.
- Each tab has a close button (×). It is disabled, not hidden, while any menu action is running, so tabs never change width. Closing the last open tab navigates to `listPath` (with `replaceUrl`): `/<entity>s` for the three entities, the order's edit page for order items. Closing only removes the id from `?ids` (with `replaceUrl`, so Back does not reopen it); it never deletes the record, and it is a view action, so it may live on the tab instead of the action menu. A tab with unsaved changes asks first (Discard / Keep editing) in the shared `p-confirmdialog` (in `Shell`, driven by `ConfirmationService`); this is its only remaining use. Closing the shown tab shows its right neighbour, or the left one if it was last. Removing ids does not reload the records (`loadedIds` ignores subsets), so unsaved edits in the other tabs survive. The × is focusable only on the active tab and stops Enter and Space from reaching `p-tab`, which would otherwise cancel its click.
- Without `ids`: shows a single "New `<entityName>`" tab (`EntityTab` with `entity: undefined`) and renders the template with `undefined`, so the form is empty. Create mode has a tab too, so the layout does not jump when saving turns it into the record's tab. Its × cancels creating: it goes to `listPath`, asking first if the form has changes. Create mode never mixes with open records: the tab list is either the one new tab or the loaded records.
- Save appears while any open form is dirty. It validates only the dirty forms (`EntityForm.validValue`); if one is invalid, nothing is sent and its tab is shown.
- Creating calls `writer.create(value)` and reopens the same route with `?ids=<new id>`. Updating calls `writer.update(changes)` once with every changed record (`EntityChange`: the loaded entity and the form value), which maps them to one bulk PUT (all or nothing), then reloads the records.
- `EntityForm` connects itself to the enclosing `EntityEditPage` through DI (`connect` / `disconnect`) and reports `dirty`, so entity forms need no create- or update-specific code.
- Product attribute fields live in `products/product-attributes-fields` (`app-product-attributes-fields`). `ProductForm` owns the `attributes` `FormRecord` and passes it in with the selected type; the component builds the fields from the selected type's definitions (`GET /api/product-types`): whole numbers use `app-number-field`, text uses `app-text-field`, with `required` / `min` / `maxLength` from the definition. Switching type keeps values of attributes both types share.

### Images live in `ImageUpload`

`shared/image-upload` (`ImageUpload`, `app-image-upload`) holds everything about an entity's images and is generic, like the images API (`entityType` + `entityId`); `EntityEditPage` knows nothing about images. The edit page passes `entityId`, `savedImages` and an `ImageWriter` (`upload`, `delete`, `reorder`) built from its feature service, as `EditProductsPage.productImageWriter` does with `ProductsService`. Every image change goes to the database at once through the writer, never through Save:

- The gallery is one grid: the image cards, then an "Add images" upload card that always stays last (it is a disabled `cdkDrag`, and `keepsUploadCardLast` stops images from being sorted into its slot). Clicking it opens the file picker; files can also be dropped anywhere on the gallery.
- Choosing or dropping files uploads them straight away (`upload`); they appear in the image list once the request ends; there is no separate uploading list (a shared saving indicator is planned).
- Rejected files are never shown inside the component: FileUpload's own type and size messages (worded through its `invalidFile*Message*` inputs) are moved into the global error toast via `AppMessageService.error` ("Image not added", one toast per file), and the component checks the 10-files-per-upload limit itself, because FileUpload adds that message only after `onSelect`.
- Dragging a saved image to a new place calls `reorder` with the full new order (`PUT /api/images/order` must list exactly the current images) and puts the old order back if the request fails.
- Selecting saved images shows Delete in the action menu, registered by the component itself; holding it calls `delete` without a confirmation dialog, and Delete shows the running ring until the request ends.
- A new record has no id yet, so the component renders nothing until the record is saved and the page reopens with its id.
- Each card shows the image's original `fileName` (stored by the API on upload). Images uploaded before the API stored names have an empty `fileName` and show "Image N" (their position) instead.

Today only products use it; orders and customers have no images. To add images to another entity, give its service the three image calls and pass a writer the same way.
