---
name: responsive-design
description: Rules for HTML structure and CSS/SCSS in this Angular app, with responsive design as the first rule. Every component must look good on desktop, tablet and mobile. Use whenever you create or edit a .html template, a .scss/.css file, or inline component styles or templates.
paths:
  - 'src/**/*.html'
  - 'src/**/*.scss'
  - 'src/**/*.css'
---

Apply these rules to every template and stylesheet you write or change. Check the existing styles of the component first and follow them.

## Rule 1: Responsive design

Every component must look good and be fully usable on all three device classes:

| Device  | Width           | Media query                  |
| ------- | --------------- | ---------------------------- |
| Mobile  | below 768px     | none (the base styles)       |
| Tablet  | 768px to 1023px | `@media (min-width: 768px)`  |
| Desktop | 1024px and up   | `@media (min-width: 1024px)` |

- **Mobile first.** Write the base styles for the smallest screen, then add `min-width` queries for larger ones. Do not use `max-width` queries unless there is no other way.
- **Use only these breakpoints.** Do not invent new ones per component.
- **Support 320px.** Nothing may scroll horizontally at 320px width. Wide content (tables, code, long text) scrolls inside its own container (`overflow-x: auto`), never the page.
- **Fluid layout.** Use flexbox and grid with `gap`, `%`, `fr`, `minmax()`, `auto-fit`/`auto-fill`. Avoid fixed `width`/`height` in px for layout boxes; use `max-width` with `width: 100%` instead.
- **Relative units.** Use `rem` for spacing and font sizes, `dvh` instead of `vh` for full-height layouts. `clamp()` is fine for fluid type and spacing.
- **Media.** Images and video get `max-width: 100%; height: auto;`.
- **Touch.** Interactive elements are at least 44×44px on mobile and tablet. Do not hide actions behind `:hover` alone; use `@media (hover: hover)` for hover-only effects.
- **Adapt, don't shrink.** On mobile, stack columns, collapse multi-column forms to one column, turn side navigation into a toggleable panel and let toolbars wrap. Do not just scale everything down.
- **Text.** Long words and URLs must not break the layout (`overflow-wrap: anywhere` where needed). Body text is at least 1rem.
- **Component libraries.** Optimus UI components (`p-*`) must also work on mobile: use their responsive options (for example `breakpoints` on dialogs, scrollable tables) instead of letting them overflow.

## Rule 2: HTML structure

- Use semantic elements: `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `button`, `a`, `ul`/`li`, `form`, `label`. A `div` or `span` is for layout only, never for something clickable.
- Keep nesting shallow. Do not add wrapper elements that exist only to fix spacing; use `gap`, padding or grid instead.
- Every form control has a `label` (or `aria-label` if there is no visible label). Every meaningful image has `alt`.
- Use the Angular control flow (`@if`, `@for` with `track`, `@switch`), not structural directives.

## Rule 3: CSS/SCSS

- Styles live in the component's own `.scss` file. Use `:host` for the component's outer box. Put only true globals in `src/styles.scss`.
- Use the theme tokens (`var(--p-*)`, such as `--p-text-color`, `--p-primary-color`, `--p-content-background`) for colors, so light and dark themes keep working. Do not hard-code colors.
- Use class selectors with flat specificity. No IDs, no `!important`, no `::ng-deep` unless there is no other way.
- No comments in `.html` or `.scss` files (project rule).

## Before you finish

Check the result at 320px, 375px, 768px, 1024px and 1440px (mentally from the CSS, or in the browser if the app is running). If anything overflows, overlaps, gets cut off or becomes too small to tap, fix it before reporting the work as done.
