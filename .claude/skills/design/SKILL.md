---
name: design
description: UI rules for this Angular app. Build every component with the Optimus UI library (@openng/optimus-ui) and its icons (@openng/icons), make it responsive on desktop, tablet and mobile, and follow the HTML and CSS rules. Use whenever you create a new component or page, or create or edit a .html template, a .scss/.css file, or inline component styles or templates.
paths:
  - 'src/**/*.html'
  - 'src/**/*.scss'
  - 'src/**/*.css'
---

Apply these rules to every component, template and stylesheet you write or change. Check the existing code of the component first and follow it.

## Rule 1: Use the Optimus UI library

The app's UI library is **Optimus UI** (`@openng/optimus-ui`, docs: https://optimus.openng.org). Build components from it.

- **Library first.** Before writing a custom button, menu, dialog, table, form control, toolbar and so on, look for the Optimus component: check the docs or `node_modules/@openng/optimus-ui/types/`. Write a custom element only when Optimus has nothing that fits, and say so in your reply.
- **No other UI or icon libraries.** Do not add Angular Material, Bootstrap, PrimeNG, `primeicons`, Font Awesome or similar.
- **Imports.** Import each component from its own entry point, for example `Button` from `@openng/optimus-ui/button` and `Menu` from `@openng/optimus-ui/menu`. Put it in the component's `imports` array.
- **Theme.** Colors and component look come from the `NoirPreset` in `src/app/core/noir-preset.ts` (based on Aura). Change a library component's look for the whole app through the preset's `components` section, not with global CSS overrides. For one component, override its `--p-*` CSS variable in the component's `.scss`.

### Buttons

Every action button is `<app-button>` from `@shared/button/button` (`AppButton`), never a direct
`p-button`. It is the standard black Optimus button. Inputs: `label` (required), `icon` (optional,
always shown before the label, e.g. `icon="pi pi-check"`), `type` (`button` default or `submit`),
`disabled`, `loading`, `fluid`. Navigate with `routerLink` on the element and react with `(click)`.
Give every button a fitting icon. Exceptions that stay Optimus: quiet text buttons such as Cancel
or Log out (`p-button` with `variant="text"`) and icon-only buttons (`pButton` + `pButtonIcon`).

### Form fields

Build form fields from `@shared/form-fields/`, never with raw Optimus inputs: `app-text-field`,
`app-textarea-field` (`rows`), `app-number-field` (`min`, `fractionDigits`) and `app-select-field`
(`options: SelectOption<T>[]`). Each takes `label`, `[control]="form.controls.x"` and
`[messages]="{ required: '…', maxlength: '…' }"` (keys are the validator error names). Shared logic
is composed, not inherited: each field lists `hostDirectives: [formFieldHost]`, which attaches the
`FormField` directive (those three inputs, touched/error state as signals, ids, which message to
show), and reads it with `inject(FormField)`. Its template wraps the control in `<app-field-frame>`,
which injects the same directive and renders the in-field label and a reserved one-line red error
text, so errors never shift the layout. Keep messages short enough for one line at 320px. A new kind
of field follows the same three steps.

Wrap every form in `<app-form-shell>` from `@shared/form-shell/form-shell` (`FormShell`). It renders
the `h1` heading and the `<form>`. Inputs: `heading` and `[form]` (the `FormGroup`). Project the
fields as its content; layout inside the fields area (such as two-column rows) stays in the
feature form.

**Content actions live only in the edit menu.** Never put Create, Edit, Save, Delete or Cancel
buttons in a page or form; the footer's edit menu is the only place for them. Cancel that leaves the screen comes
from the route: add `data: { cancel: '/target' }` to the route in `app.routes.ts` and the menu shows
Cancel there. A component registers `cancel` itself only when it means more than leaving (such as
discarding an edit mode); a registered handler wins over the route. A form registers Save in its
constructor and calls the shell's public
`submit()`, which marks all fields touched on an invalid form and emits `(submitted)` only for a
valid one: `inject(EditActionsService).register(() => ({ save: () => this.shell().submit() }))`
with `shell = viewChild.required(FormShell)`. `register` takes only a function; it is read after
inputs are set and re-read whenever the signals it uses change.

### Icons

Icons come from **`@openng/icons`** (loaded once in `src/styles.scss`). They use the `pi pi-{name}` classes; the full list is at https://optimus.openng.org/icons.

- In TypeScript (for example a `MenuItem`), use the `OpenngIcons` constants from `@openng/optimus-ui/api`: `icon: OpenngIcons.COG`.
- In templates, use an `<i>` element: `<i class="pi pi-cog"></i>`.
- Icons that only decorate get `aria-hidden="true"`. An icon-only button gets an `aria-label`.

### Optimus pitfalls

- **Icon-only buttons.** `pButton` becomes a round icon-only button only when the `pButtonIcon` element is a **direct child in the same template**: `<button pButton [rounded]="true"><i class="pi pi-bars" pButtonIcon></i></button>`. If the icon comes from an `ng-template` or `ngTemplateOutlet`, the library does not see it and the button turns into an oval.
- **Button size.** Size an icon-only button with its token, `--p-button-icon-only-width: 2.75rem;`, not with `width`/`height`. The library sets both from the token and stays a circle.
- **Popup overlays** (popup menus, overlay panels, selects and similar) render inside their component by default. Near the bottom of the screen they then open below the trigger, make the page taller and scroll it. Always set `appendTo="body"` so the library keeps them inside the viewport. Component styles do not reach an overlay attached to `<body>`, so style it through the preset.
- **Overlay animation.** The library opens overlays by scaling from 93% while fading in, so they visibly grow and their edges shift. The popup menu only fades: see the `css` override for `menu` in `noir-preset.ts`. Do the same for other overlays that look jumpy.

## Rule 2: Responsive design

Every component must look good and be fully usable on all three device classes:

| Device  | Width           | Media query                  |
| ------- | --------------- | ---------------------------- |
| Mobile  | below 768px     | none (the base styles)       |
| Tablet  | 768px to 1023px | `@media (min-width: 768px)`  |
| Desktop | 1024px and up   | `@media (min-width: 1024px)` |

- **Mobile first.** Write the base styles for the smallest screen, then add `min-width` queries for larger ones. Do not use `max-width` queries unless there is no other way.
- **Pages fill the viewport.** The app is designed mobile first, so page content and forms use the full width of the shell's content area. The shell (`.content` in `src/app/layout/shell.scss`) owns the only padding around a page; pages and their components add no outer padding of their own. Do not wrap a page or form in a card, border or shadow, and do not center it in a narrow `max-width` box.
- **Use only these breakpoints.** Do not invent new ones per component.
- **Support 320px.** Nothing may scroll horizontally at 320px width. Wide content (tables, code, long text) scrolls inside its own container (`overflow-x: auto`), never the page.
- **Fluid layout.** Use flexbox and grid with `gap`, `%`, `fr`, `minmax()`, `auto-fit`/`auto-fill`. Avoid fixed `width`/`height` in px for layout boxes; use `max-width` with `width: 100%` instead.
- **Relative units.** Use `rem` for spacing and font sizes, `dvh` instead of `vh` for full-height layouts. `clamp()` is fine for fluid type and spacing.
- **Media.** Images and video get `max-width: 100%; height: auto;`.
- **Touch.** Interactive elements are at least 44×44px on mobile and tablet. Do not hide actions behind `:hover` alone; use `@media (hover: hover)` for hover-only effects.
- **Adapt, don't shrink.** On mobile, stack columns, collapse multi-column forms to one column, turn side navigation into a toggleable panel and let toolbars wrap. Do not just scale everything down.
- **Text.** Long words and URLs must not break the layout (`overflow-wrap: anywhere` where needed). Body text is at least 1rem.
- **Optimus components on mobile.** Use their responsive options (for example `breakpoints` on dialogs, scrollable tables) instead of letting them overflow.

## Rule 3: HTML structure

- Use semantic elements: `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `button`, `a`, `ul`/`li`, `form`, `label`. A `div` or `span` is for layout only, never for something clickable.
- Keep nesting shallow. Do not add wrapper elements that exist only to fix spacing; use `gap`, padding or grid instead.
- Every form control has a `label` (or `aria-label` if there is no visible label). Every meaningful image has `alt`.
- Use the Angular control flow (`@if`, `@for` with `track`, `@switch`), not structural directives.

## Rule 4: CSS/SCSS

- Styles live in the component's own `.scss` file. Use `:host` for the component's outer box. Put only true globals in `src/styles.scss`.
- Use the theme tokens (`var(--p-*)`, such as `--p-text-color`, `--p-primary-color`, `--p-content-background`) for colors, so light and dark themes keep working. Do not hard-code colors.
- Use class selectors with flat specificity. No IDs, no `!important`, no `::ng-deep` unless there is no other way.
- No comments in `.html` or `.scss` files (project rule).

## Before you finish

- Check that every UI piece comes from Optimus UI and every icon from `@openng/icons`.
- Check the result at 320px, 375px, 768px, 1024px and 1440px (mentally from the CSS, or in the browser if the app is running). If anything overflows, overlaps, gets cut off or becomes too small to tap, fix it before reporting the work as done.
