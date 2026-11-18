# UPAdmin

## Entity operations go only through the action menu

Create, edit, save, delete and any other operation on an entity are done only through the footer action menu (`app-edit-menu`), registered with `EditActionsService.register`. Do not add in-page buttons that perform these operations: not in empty states, forms, table rows or page toolbars. To draw attention to an action, register it with `suggested: true` and, if needed, point to it in text.

## Entity features are mirrors: orders, products, customers

`src/app/features/orders`, `src/app/features/products` and `src/app/features/customers` are the same feature built for three entities. They must stay structurally identical. Any change to one of them is applied to all three in the same change, unless the entity truly cannot support it; in that case say so explicitly to the user instead of silently diverging.

### Shared shape (`<entity>` = order | product | customer)

| Piece      | Location               | Convention                                                                                                                                                                                                   |
| ---------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| List route | `app.routes.ts`        | `path: '<entity>s'`, title `<Entity>s · UP`                                                                                                                                                                  |
| Edit route | `app.routes.ts`        | `path: 'edit-<entity>s-page'`, no path params                                                                                                                                                                |
| List page  | `<entity>s-page/`      | `loadPage = inject(<Entity>sService).list` and `columns`; template is only `<app-entity-list-page [loadPage]="loadPage" [columns]="columns" editPath="/edit-<entity>s-page" entityName="<entity>" />`        |
| Edit page  | `edit-<entity>s-page/` | `readonly ids = input<string>()`, `load<Entity>s = <Entity>sService.get`, `<entity>Name`, `create<Entity>`; template is only `<app-entity-edit-page>` with one `<ng-template let-<entity>>` holding the form |
| Service    | `<entity>s.service.ts` | same method names across entities                                                                                                                                                                            |
| Form       | `<entity>-form/`       | used by the edit page                                                                                                                                                                                        |

Selected IDs travel as the `ids` query param (`/edit-products-page?ids=1,2`), bound to the edit page's `ids` input by `withComponentInputBinding()`. Do not add `:id` path params: the edit pages open several records as tabs, and a required path segment would break `/edit-products-page` without IDs.

### Developer steps for any change touching one entity feature

1. Make the change in the entity you were asked about.
2. Apply the equivalent change to the other two entities: routes, list page, edit page, service, form, templates, styles.
3. Keep names parallel (`ProductsPage` / `OrdersPage` / `CustomersPage`, `productName` / `orderNumber` / `customerName`, and so on).
4. Search all three features for the old name, path or pattern to confirm nothing was left behind.
5. Report which entity could not follow and why, if any.

### Known gaps between the three (close them, do not copy them)

- Orders have no create flow: the edit page passes no `[create]`, because the backend creates orders from items (product, start, passengers, pickup) and the order form has no item fields yet.
- Product create sends `attributes: {}`; it succeeds only once the product form gets type-specific attribute fields.

### Edit page logic lives in `EntityEditPage`

`shared/entity-edit-page` owns everything the three edit pages share; entity pages only supply `ids`, `load`, `label`, optional `create` and the form template. Shared behaviour (creating today, updating and deleting later) goes there, not into the entity pages.

- With `ids`: loads the records and shows one tab per record, rendering the template with the record.
- Without `ids` and with `create`: renders the template with `undefined`, so the form is empty. Save appears once the form is dirty, validates through `EntityForm.submit`, calls `create`, then reopens the same route with `?ids=<new id>`.
- `EntityForm` connects itself to the enclosing `EntityEditPage` through DI (`connect`), so entity forms need no create-specific code.
