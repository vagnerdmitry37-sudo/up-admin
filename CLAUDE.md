# UPAdmin

## Entity operations go only through the action menu

Create, edit, save, delete and any other operation on an entity are done only through the footer action menu (`app-edit-menu`), registered with `EditActionsService.register`. Do not add in-page buttons that perform these operations: not in empty states, forms, table rows or page toolbars. To draw attention to an action, register it with `suggested: true` and, if needed, point to it in text.

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

Entities are deleted only from the list table: select one or more rows, run Delete from the action menu (registered by `EntityTable`), confirm in the shared `p-confirmdialog` (in `Shell`, driven by `ConfirmationService`). On accept the list page calls `deleteEntities(ids)` (one bulk DELETE), clears the selection and reloads the table. Customers that still have orders are refused by the API with 409.

### Edit page logic lives in `EntityEditPage`

`shared/entity-edit-page` owns everything the three edit pages share; entity pages only supply `ids`, `load`, `label`, `writer` (`create` and `update`, both required) and the form template. Shared behaviour (creating and updating) goes there, not into the entity pages. Deleting is not done here: it lives in `EntityListPage`.

- With `ids`: loads the records and shows one tab per record (no tab bar for a single record), rendering the template with the record.
- Without `ids`: renders the template with `undefined`, so the form is empty.
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
- Selecting saved images shows Delete in the action menu, registered by the component itself; it asks for confirmation in the shared `p-confirmdialog`, then calls `delete`.
- A new record has no id yet, so the component renders nothing until the record is saved and the page reopens with its id.
- Each card shows the image's original `fileName` (stored by the API on upload). Images uploaded before the API stored names have an empty `fileName` and show "Image N" (their position) instead.

Today only products use it; orders and customers have no images. To add images to another entity, give its service the three image calls and pass a writer the same way.
