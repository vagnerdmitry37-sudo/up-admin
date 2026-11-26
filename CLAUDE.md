# UPAdmin

## Optimus UI first, for components and for behaviour

Before writing any custom component, logic, styling or workaround, check whether Optimus UI (`@openng/optimus-ui`) already does it. Its docs are https://optimus.openng.org: open the page of the component in use and read its features and examples (for example `https://optimus.openng.org/table#loading-mask`), then confirm the API in `node_modules/@openng/optimus-ui/types/`. Most needs are already built in, both whole components and features of components already in use (loading masks, empty messages, selection, virtual scroll, positioning, animations). Use the built-in feature as the docs show it, with its default look and placement; do not override its styling, position or behaviour unless the user asks. Write custom code only when Optimus has nothing that fits, and say so in your reply with the docs page you checked.

Example: the table loading spinner is `p-table` `[loading]`, which already centres the spinner on the table. A pass-through override that moved the mask was added on a guess, without checking the docs, and was removed.

Search in this order before writing a new component or new logic, and stop at the first that fits: (1) this file and the existing app code (`shared/`, `layout/`, a similar page); (2) the Optimus docs page; (3) the Optimus source in `node_modules/@openng/optimus-ui/fesm2022/openng-optimus-ui-<component>.mjs`, which holds the component's template, inputs, outputs, templates (`#button`, `#item`, …) and the maths behind its layout. The docs pages render their example code in the browser, so a plain fetch shows only the prose; read the source when you need the details.

## Footer menus

The footer has two menus, both drawn by `SpeedMenu` (`shared/speed-menu`, `app-speed-menu`). It wraps Optimus's `p-speeddial` as a `quarter-circle` with `radius` 80 (https://optimus.openng.org/speeddial#quartercircle), so both menus' trigger button and actions look and move the same, and only their icons and direction differ. `SpeedMenu` takes `items`, `direction`, `label`, `icon`, `expanded` and `actionsVisible`, emits `pressed` when its trigger is clicked, and draws each item with the `#item` template the menu passes in. It knows nothing about what the trigger does.

- **Action menu** (`layout/action-menu`, right corner, `up-left`): the trigger shows and hides the actions. Slots: Create, Edit, Save, Delete.
- **Navigation menu** (`layout/nav-menu`, left corner, `up-right`): the trigger opens and closes the page list (Optimus `p-menu` popup); its actions are always shown. Slots: Back.
- Both menus' actions come from `ActionService`: a menu lists a fixed slot per action name, and a slot shows its action button only while some page has registered it, so every action keeps its place whether the others are shown or not. `SpeedMenu` always gives the speed dial 4 positions, filling the rest with hidden items (`visible: false`), because Optimus's quarter-circle maths divides by the item count minus one and cannot place a single item; this also puts the slots of both menus at the same positions.
- `ActionService` keeps a stack of registrations, and for each action name the newest one wins. `register` takes only a function returning the page's `Actions` (`register(() => ({ create: { run: ... } }))`), read reactively, so it can depend on signals, and removes it when the registering component or injector is destroyed, which shows the registration underneath again. A page overrides an inherited action by registering the same name, and hides it by registering it as `null`.
- App-wide actions are registered once in `core/` (an app initializer in `app.config.ts`) and live for the whole app, at the bottom of the stack. Back is one: `provideBackAction()` (`core/back-action.ts`) shows it whenever the active route has more than one titled level (`/orders/editor`, not `/orders`) and navigates `..` from the deepest titled route. Pages do not register their own Back.
- A page registers the actions that make sense on it and leaves the others out, so they are hidden. An action that makes sense on the page but not right now stays visible and is disabled: `Action.disabled` is an optional function read reactively (a signal or `computed`), passed to `pButton`'s `[disabled]` through `ActionButton`. `EntityPage` disables Edit and Delete while nothing is selected.
- Page actions are never inherited. Only leaf pages (the components a route renders) and app-wide initializers in `core/` register actions, never a parent route or layout component for its children. The list page and the editor are sibling routes, so opening the editor destroys the list page and removes its actions; the editor shows only what it registers itself, plus the app-wide Back.
- Actions that share a name but differ per page are registered by each page: Create on a list page (`EntityPage`) opens the editor, which adds a new tab; Create on the edit page (`EntityEditPage`) only adds a tab.
- To add an action: add its name to `ActionName`, add an `app-<name>-action` in `shared/actions`, add a slot to the menu it belongs to, and register it from the page (or in `core/` if it is app-wide).

## Entity operations go only through the action menu

Create, edit, save, delete and any other operation on an entity are done only through the footer action menu (`app-action-menu`, an Optimus speed dial), whose actions are registered with `ActionService.register` (`shared/actions/action.service.ts`). Do not add in-page buttons that perform these operations: not in empty states, forms, table rows or page toolbars.

## Loading indicator on tables

Loading is shown only on the table that is loading, with Optimus's built-in table loading mask and spinner (`p-table` `[loading]`), never with a page-level or footer spinner. `DataTable` and `EntityTable` take a `loading` input and pass it through. `EntityPage` computes it from `HttpActivity`: `isRunning({ kind: 'request', entity: entityName(), method: 'GET' })`, so the first page, every lazily loaded range while scrolling and the reload after Delete all show it, and nothing keeps a `loading` flag of its own. The table is rendered from the start (`rows ?? []`) so the spinner shows during the first load; the empty state replaces it only once the first page came back empty. While loading, `DataTable` reserves at least one body row of height, so the mask over an empty table has room for the spinner. Image upload and reorder have no busy indicator yet.

## Request errors are shown globally

There are exactly two kinds of error display:

- **Form validation errors** are shown in the form, at the invalid field (`app-field-frame`'s reserved error line).
- **Every other error** (failed requests, rejected uploads, unexpected exceptions) is shown only as a toast through `AppMessageService.error(summary, detail)` (`core/app-message.service.ts`). It wraps Optimus's `MessageService`, which is injected only there; app code never calls `MessageService.add` directly. Warning and info methods will be added to `AppMessageService` the same way when needed. How long a toast stays is set once for the whole app by `messageLife` (8 s) on the `p-toast` in `Shell`; messages never pass their own `life`. Such errors are never shown as an inline message, banner or error block in a page. After such an error a page falls back to a neutral state (for example an empty table), not a blank screen. Uncaught exceptions reach `core/app-error-handler.ts` (`AppErrorHandler`, registered as Angular's `ErrorHandler`), which shows a generic toast; it skips `HttpErrorResponse` because the request error listener below already showed one.

Every failed API request is turned into one Optimus toast (`p-toast` in `Shell`, fed through `AppMessageService.error`) by `core/request-error-toasts.ts` (`provideRequestErrorToasts()` in `app.config.ts`), a listener on the failed requests of `HttpActivity`, so pages never catch HTTP errors to show a message. It maps the status to a plain-language summary: 0 no connection, 400 the validation messages, 403 not allowed, 404 refresh and try again, 409 the server `detail`, 5xx try again later. It skips 401, which `authInterceptor` and `SessionService` handle, and any status the request lists in its tag's `handledStatuses`: login passes `[400]`, which `LoginPage` shows inline as rejected credentials, so a failed login (no connection, 5xx) still gets a toast. Token refresh and logout are untracked, so they never toast. The error still reaches the caller, so callers still stop. Write server `detail` texts for 409 so a user can read them.

## Request activity is tracked centrally

`core/http-activity.service.ts` (`HttpActivity`) is the single source of truth for everything in flight: every HTTP request and every operation started through `track`, each with the entity it belongs to. Spinners, locks, loading states and error toasts read it; nothing else keeps its own request bookkeeping.

- Each entry is an `Activity` `{ id, kind, entity, operation, source, method, url, status, error }`. `kind` is `request` (one HTTP call with its `method`, recorded by `core/http-activity.interceptor.ts`, registered first in `app.config.ts`, so it sees the final outcome after auth's refresh and retry) or `operation` (one user action that may send several requests, from `track({ entity, operation, source }, work)`; `operation` is a free name such as `'save'` or `'upload'`). It starts as `running` and ends exactly once as `succeeded`, `failed` (with `error`) or `cancelled` (unsubscribed before a response, for example after leaving the page).
- All HTTP goes through `core/api-client.ts` (`ApiClient`); nothing else injects `HttpClient` (enforced by ESLint, specs excepted). A service takes a client per entity, `private readonly api = inject(ApiClient).forEntity('product')` (more for other entities it calls: `imageApi`, `customerApi`), and calls `get` / `post` / `put` / `delete` with `params` and, where needed, `handledStatuses` or `untracked`; `resource(url)` wraps `httpResource`. The client puts the entity on the request, so every request is tagged and call sites never build an `HttpContext`. `ActivityEntity` uses the same words as `entityName` (`'order item'`), so entity pages pass `entityName` straight through; a new entity is added there.
- Read it with `running` or `isRunning(filter?)` inside a `computed` or template (for example `isRunning({ entity: 'image', method: 'POST' })` or `isRunning({ source: 'image-upload' })`); subscribe with `on(filter)` (for example `on({ entity: 'product', status: 'succeeded' })`) or `changes`. A filter matches on any of `kind`, `entity`, `operation`, `source`, `method`, `status`. `source` (`ActivitySource`) names the UI piece that started an operation through `track`: `'image-upload'` (`ImageUpload`'s upload and reorder; its delete runs through the action menu). Sources are set where the UI starts the work, never in feature services, which do not know their caller. Add a source together with the code that sets and reads it.
- `{ untracked: true }` opts a request out: token refresh and logout use it; login is tracked as a `session` request.

## Entity features are mirrors: orders, products, customers

`src/app/features/orders`, `src/app/features/products` and `src/app/features/customers` are the same feature built for three entities, on the shared components in `shared/entity`. They must stay structurally identical. Any change to one of them is applied to all three in the same change, unless the entity truly cannot support it; in that case say so explicitly to the user instead of silently diverging.

### Shared shape (`<entity>` = order | product | customer)

| Piece        | Location               | Convention                                                                                                                                                                                                       |
| ------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Parent route | `app.routes.ts`        | componentless parent `path: '<entity>s'`, `title: '<Entity>s'`, `loadChildren: () => import('@features/<entity>s/<entity>s.routes')`                                                                             |
| List route   | `<entity>s.routes.ts`  | default-exported `Routes`; child `path: ''`, without a title, is the list page                                                                                                                                   |
| Edit route   | `<entity>s.routes.ts`  | child `path: 'editor'` (`/<entity>s/editor`), `title: 'Editor'`, no path params                                                                                                                                  |
| List page    | `<entity>s-page/`      | injects `<Entity>sService` and defines `columns`; template is only `<app-entity-page entityName="<entity>" [columns]="columns" [loadPage]="<entity>sService.list" [deleteEntities]="<entity>sService.delete" />` |
| Edit page    | `<entity>s-edit-page/` | `readonly ids = input<string>()`, `load<Entity>s = <Entity>sService.get`, `<entity>Name`; template is only `<app-entity-edit-page>` with one `<ng-template let-<entity>>` holding the form                       |
| Service      | `<entity>s.service.ts` | same method names across entities                                                                                                                                                                                |
| Form         | `<entity>-form/`       | wraps its fields in `<app-entity-form [form]="form" [value]="<entity>()">`; used by the edit page                                                                                                                |

The route `title` is the only name of a page: each route that needs one sets only its own part as a plain string (the `<entity>s` parent `'<Entity>s'`, the `editor` child `'Editor'`), and `routeTitles` (`core/route-titles.ts`) lists the parts along the active route path from the root down, read from each route's own `routeConfig.title`. `AppTitleStrategy` (`core/app-title-strategy.ts`, Angular's `TitleStrategy`) joins them for the browser tab as `Orders / Editor · UP`, the same whether the tabs hold saved records, new ones or both, because one edit page mixes creating and editing. The app-wide Back action uses the same route path. Routes without `title` (the shell and the list children) add nothing.

Selected IDs travel as the `ids` query param (`/products/editor?ids=1,2`), bound to the edit page's `ids` input by `withComponentInputBinding()`. Do not add `:id` path params: the edit pages open several records as tabs, and a required path segment would break `/products/editor` without IDs.

### Developer steps for any change touching one entity feature

1. Make the change in the entity you were asked about.
2. Apply the equivalent change to the other two entities: routes, list page, edit page, service, form, templates, styles.
3. Keep names parallel (`CustomersPage` / `CustomersEditPage`, `productName` / `orderNumber` / `customerName`, and so on).
4. Search all three features for the old name, path or pattern to confirm nothing was left behind.
5. Report which entity could not follow and why, if any.

### Known gaps between the three (close them, do not copy them)

- None open.

### List page logic lives in `EntityPage`

`shared/entity/entity-page` loads the table lazily (`lazyRows` over `loadPage`), shows an empty state that points to the Create action, and registers Create, Edit and Delete with `ActionService`. Create and Edit navigate to `editor` relative to the list route (Edit passes the selected ids as `?ids`); Delete calls `deleteEntities(ids)` (one bulk DELETE), clears the selection and reloads the table. Customers that still have orders are refused by the API with 409.

### Edit page logic lives in `EntityEditPage`

`shared/entity/entity-edit-page` owns everything the three edit pages share; entity pages only supply `ids`, `load`, `label`, `entityName` and the form template.

- With `ids`: loads the records once and shows one tab per record (`entityTabList` in `shared/entity/entity-tabs`), rendering the template with the record. Without `ids` it shows one new tab.
- Create is registered with `ActionService` and adds a "New `<entityName>` N" tab, rendered with `undefined`, so the form is empty.
- Each tab has a close button (×) that is focusable only on the shown tab. Closing the shown tab shows its right neighbour, or the left one if it was last; closing the last tab navigates back to the list (`..`, with `replaceUrl`).
- Every tab has the same fixed width (12rem), with a longer name cut by an ellipsis and shown in full as the label's `title`. `EntityTabs` runs an `afterRenderEffect` that moves the ink bar, scrolls the shown tab into view and updates the ‹ › scroll buttons, because Optimus's `TabList` does not do that when a tab is shown by code.
- `EntityForm` (`shared/entity/entity-form`) takes the form group and the record as `value`, and resets the form whenever the value changes.

### Form fields never read layout while rendering

Optimus inputs (`p-iftalabel` labels, input borders) have CSS transitions, so if the browser computes their style before Angular has set their host classes, they animate from browser defaults (a 16px dark label shrinking to 12px, a dark border fading). That happens whenever something reads layout (`scrollHeight`, `offsetWidth`, `getBoundingClientRect`) in the middle of rendering a view, such as in `ngAfterViewInit` / `ngAfterViewChecked` of a field placed before others. Optimus's `pTextarea` `autoResize` does exactly that, so `TextareaField` does not use it: it calls `Textarea.resize()` from an `afterRenderEffect` (`mixedReadWrite`) on the control's value and `rows`, plus a width `ResizeObserver`. Size things after render (`afterRenderEffect`, `afterNextRender`, `ResizeObserver`), never inside lifecycle hooks.

### Images live in `ImageUpload`

`shared/image-upload` (`ImageUpload`, `app-image-upload`) holds everything about an entity's images and is generic, like the images API (`entityType` + `entityId`). A page passes `entityId`, `savedImages` and an `ImageWriter` (`upload`, `delete`, `reorder`) built from its feature service. No page uses it at the moment: its only user was the old products edit page, removed together with `shared/entity`, and staged files are uploaded only when the page calls its public `save(entityId)`. Writes follow the action menu like everything else: new images are saved by Save and removed by Delete; only reordering saved images is sent straight away, because it is a view arrangement rather than new data:

- The gallery is one grid: the image cards, then an "Add images" upload card that always stays last (it is a disabled `cdkDrag`, and `keepsUploadCardLast` stops images from being sorted into its slot). Clicking it opens the file picker; files can also be dropped anywhere on the gallery.
- Choosing or dropping files only stages them, on new and saved records alike: they appear as cards at once (object-URL previews, `id` `staged-N`, `stagedFile` set), the component turns `dirty`. Its `save(entityId)` uploads the staged files in one request (so at most 10 can be staged) and, if the user dragged staged cards between saved ones, sends one `reorder` with the final order. The page then reloads or reopens the record, and `images` (a `linkedSignal` of `savedImages`) resets to the saved list, which drops the staged entries.
- Rejected files are never shown inside the component: FileUpload's own type and size messages (worded through its `invalidFile*Message*` inputs) are moved into the global error toast via `AppMessageService.error` ("Image not added", one toast per file), and the component checks the 10-files-per-upload limit itself, because FileUpload adds that message only after `onSelect`.
- Dragging changes the order on screen at once. If the order of the saved images changed, it calls `reorder` straight away with the saved ids only (`PUT /api/images/order` must list exactly the current saved images) and puts the old order back if the request fails; staged images are placed on Save.
- Selecting images shows Delete in the action menu, registered by the component itself; holding it calls `delete` for the selected saved images without a confirmation dialog and drops selected staged images locally.
- A new record shows the gallery from the start, so images can be added together with the other fields; Save creates the record first and then uploads them. A failed image upload does not undo the create: the request error toast shows, the record reopens without those images, and the user adds them again.
- Each card shows the image's original `fileName` (stored by the API on upload). Images uploaded before the API stored names have an empty `fileName` and show "Image N" (their position) instead.

To add images to an entity, give its service the three image calls (`ProductsService` in `products` has them) and pass a writer built from them.
