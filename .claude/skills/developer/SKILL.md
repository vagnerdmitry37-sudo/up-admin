---
name: developer
description: How to develop in this Angular repo fast without lowering code quality. Covers task sizing, efficient investigation, project conventions, code checks (format, lint, build), anti-patterns and reporting. Tests are not part of it; they run only on request through the tester skill. Use for every coding task here, including features, bug fixes, refactors, debugging, reviews and config changes.
---

**Goal: cut wasted effort, never essential engineering.** Quality is fixed: correct, secure, readable, consistent with the project and verified. Speed comes from doing less of the unnecessary, not less of the necessary.

For UI work, the `design` skill also applies. To commit, use the `commit` skill.

## 1. Size the task first

Decide the size before doing anything else, and scale every later step to it.

| Size          | Examples                                                                       | Investigation                                       | Plan                                                                         | Verification                             |
| ------------- | ------------------------------------------------------------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------- |
| **S**         | Rename, style tweak, copy change, one-file fix                                 | Read the target file only                           | None, just do it                                                             | Format, lint, build                      |
| **M**         | New page or component, behavior change across 2–5 files                        | The files involved and one similar existing example | 2–4 lines in your head or reply                                              | Format, lint, build                      |
| **L**         | New feature area, routing or state redesign, new dependency                    | The affected layers and their callers               | Short written plan with acceptance criteria; confirm product decisions first | M checks + review edge cases in the diff |
| **High risk** | Auth, session, guards, HTTP interceptors, API contracts, secrets, dependencies | As L, plus every caller                             | As L, and state the risks                                                    | As L, plus security review of the diff   |

**Tests are on demand.** Never write, rewrite or run tests (specs, `npm test`, browser checks) as part of a coding task. Do it only when the user explicitly asks to test, and then use the `tester` skill.

## 2. Know the project (do not rediscover it)

- **Stack:** Angular 22 standalone components, signals, `ChangeDetectionStrategy.OnPush` (lint-enforced), new control flow, lazy `loadComponent` routes. UI is Optimus UI (see `design`). Prettier, ESLint, Vitest via `ng test`.
- **Unit tests:** Vitest + jsdom, specs next to the code (`x.spec.ts`). Written and run only on the user's request, through the `tester` skill.
- **Layers** (`src/app/`, lint-enforced): `core/` holds app-wide services and config, `layout/` the shell and its parts, `features/<name>/` the pages, `shared/` reusable UI. `features` must not import other features; `shared` imports none of core, layout or features; `core` imports neither layout nor features; `layout` does not import features. Use the aliases `@core/*`, `@shared/*`, `@layout/*`, `@features/*`.
- **Conventions:** file `x-page.ts`, `.html`, `.scss` side by side; class `XPage` without the `Component` suffix; selector `app-x-page`; `inject()` instead of constructor injection; `protected readonly` for template members; `private` for the rest. Single-line methods use arrow functions: `getProfile = () => this.httpClient.get(...)`.
- **Naming injected dependencies:** a property or variable holding an injected class is named after that class in lowerCamelCase, everywhere including specs: `productsService = inject(ProductsService)`, `sessionService`, `editActionsService`, `router = inject(Router)`, `httpClient = inject(HttpClient)`, `httpTestingController = TestBed.inject(HttpTestingController)`. Never shorten it (`products`, `session`, `http`, `fb`): the short form collides with data (`products` is the list, `productsService` loads it). Two exceptions: a qualifier prefix of a framework class is dropped (`formBuilder = inject(NonNullableFormBuilder)`), and an injection token gets a plain noun (`locale = inject(LOCALE_ID)`). In a service's own spec the subject under test is `service`. A one-off use needs no property: `inject(EditActionsService).register(...)`.
- **No comments** in `.ts`, `.html` or `.scss`. Names carry the meaning.
- **Boolean conversion:** write `Boolean(value)`, never `!!value`.
- **Event handlers:** name them for what they do (`runAction`, `toggle`, `save`), never for the event that triggers them (`onClick`, `onActionClick`, `handleSubmit`).
- **Routing:** the public `login` route uses `guestGuard`. Every other page is a child of the `''` route, which uses `authGuard` and renders `Shell`. Add new pages there.
- **Edit menu:** the footer's right corner holds `EditMenu` (an Optimus speed dial with Create, Edit, Save, Delete). A page enables actions by calling `inject(EditActionsService).register({ actions: () => ({ save: { click: () => ... }, edit: { click: () => ..., visible: hasSelection } }) })` in its constructor. Each action is an `EditActionConfig`: `click` runs on a click or tap (no press-and-hold gestures: they are hard to discover and to use with a keyboard or limited motor control), and `visible: false` hides the action (default visible), so write visibility as that field, never as a conditional spread. The function is re-read whenever the signals it reads change, so actions can depend on state such as the selected row; they are cleared when the page is destroyed, and unregistered or hidden actions are hidden while every action keeps its fixed slot on the arc, so users always find an action in the same place. With no available action the menu button is not rendered at all, so pages without actions need no code. Registrations form a stack: only the most recent one is active, so a form inside a page replaces the page's actions while it exists and the page's actions return when it is destroyed. Empty states never embed a form: show a short plain-language message and mark the action to suggest with `suggested: true` in its config (`create: { click: ..., suggested: empty }`); several actions can be suggested at once. The menu opens by itself whenever an action becomes available that was not available before (first actions on a page, Edit after selecting a row), even if the user closed it; it never reopens while the set of available actions stays the same. While any action is suggested the closed main button pulses, and once opened every suggested action pulses. There is no Cancel action: users leave a create or edit page through navigation. Create depends on the selection: with nothing selected it opens an empty create page; with one or more records selected it copies them by opening the create page with `?from=<id,id>`, which pre-fills one tab per record (`ProductTabs`, shared with the edit page) and saves all copies with one create request (POST, no ids, the server assigns new ones), so a copy can never overwrite its source.
- **Session:** `SessionService` keeps the access token in a signal. `restore()` calls `POST /api/auth/refresh` at startup. The API is proxied to `https://localhost:7215` and is usually not running locally.

Before building something new, look for an existing piece to copy: an existing page for a new page, `Shell` or `NavMenu` for layout parts, `SessionService` for a service.

## 3. Investigate efficiently

- Read the files you will change, and the closest similar file, **once and in parallel**. Do not re-read a file you just edited.
- Search narrowly (`Grep` for a symbol, `Glob` for a file name) instead of listing folders.
- For library APIs, read the `.d.ts` in `node_modules/@openng/optimus-ui/types/` (inputs, outputs, templates) before guessing. Read the `.mjs` in `fesm2022/` only when behavior is unclear.
- Stop investigating once you can name the change and how you will verify it.
- Ask the user only when the answer changes product behavior, architecture or safety. Otherwise choose the conventional option and mention it.

## 4. Implement

- **Do only what was asked, one step at a time.** No extra features, refactors, spacing tweaks or "while I'm here" changes. If you see something worth doing, mention it as a follow-up in your reply and leave it.
- **Shared concerns are app-wide, never per component.** Error handling, notifications and similar behavior get one global implementation in `core/` or `shared/`. Do not write component-specific error handling (no local `catch` with custom messages); let errors reach the global handling.
- **Shared components stay generic; use-case logic lives in the page.** A component reused by several pages (for example `ProductForm`, used by the new, edit and empty-state screens) only takes data in through inputs and reports through outputs (`(submitted)` with the form value). It never branches on which page it is in (`if (product) put else post`), never sends a page's HTTP request and never navigates. The page that owns the use case decides what happens: which request to send, what to reload, where to go. HTTP for a feature goes through that feature's service (`features/products/products.service.ts`), never `HttpClient` in a component.
- Make the smallest complete change: wire it in (route, import, menu entry), handle the empty state, and nothing beyond the request.
- Reuse existing services, components and tokens. Add a dependency only when the platform and Optimus have nothing for it, and say so in your reply.
- Write whole files with `Write` when most of a file changes; use `Edit` for targeted changes. Batch independent edits in one turn.
- If a file changed on disk since you read it, re-read it before overwriting. The user often edits in parallel, so keep their changes.

## 5. Code checks, in as few tool calls as possible

Measured on this machine: `prettier` about 1s, `ng lint` about 3s, `npm run build` about 3s. The checks are cheap. **Tool-call round trips are the expensive part**, so batch them.

**One command for the code checks**, run once after the edits:

```sh
npx prettier --write <changed files> >/dev/null && npx ng lint 2>&1 | grep -E "pass|error|warning"; npm run build 2>&1 | grep -iE " error|warning|complete"
```

Do not pipe `ng lint` into `tail -1`, because its last line is blank. The build must finish without errors or new warnings; bundle budget warnings count.

No `npm test` and no browser check here: those belong to the `tester` skill and run only when the user asks.

**Target flow for an S task, about four tool calls:** (1) read the target file and any library `.d.ts` in parallel; (2) edit; (3) one Bash call with the code checks; (4) report.

If a check cannot run, say which and why. Never report something as working without evidence; say plainly that it is untested until the user asks for testing.

## 6. Environment facts (Windows, Git Bash)

- No Python and no `bc`. Use Node for scripts and arithmetic.
- Edit text and Markdown with `Edit`/`Write`, never with `node -e` or `sed` strings that contain backticks or nested quotes: Bash breaks the quoting and runs fragments as commands.
- Headless Chrome must run with `--no-proxy-server`; otherwise every page load waits 21s for the system proxy to time out. `ui-check.mjs` already does this.
- Git Bash rewrites arguments that start with `/` into Windows paths. Pass URLs whole (`https://...`) or paths without the leading slash.
- No Unix `sleep` loops for waiting on a background task you started; you are notified when it ends.

## 7. Anti-patterns

| Do not                                                          | Instead                                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Plan, survey options or ask questions for an S task             | Do it and mention the one assumption                                      |
| Re-read files or re-run identical searches                      | Use what is already in context                                            |
| Add abstractions, services or generic helpers "for later"       | Write the concrete code the task needs now                                |
| Refactor or reformat code outside the task                      | Mention it as a follow-up                                                 |
| Add a package for something small                               | Use Angular, the platform or Optimus                                      |
| Fight library CSS with specificity, `!important` or `::ng-deep` | Use the library's inputs, tokens or preset                                |
| Silence lint or type errors, or weaken checks                   | Fix the cause                                                             |
| Swallow errors with an empty `catch`                            | Handle the error, or let it surface                                       |
| Guess why the UI looks wrong                                    | Read the code and library sources; offer a browser check through `tester` |
| Claim "fixed" or "works" after only a build                     | Say "builds, untested" until the user asks to test                        |
| Leave placeholder logic when working code was requested         | Implement it, or state clearly what is missing                            |

## 8. Before you finish

Read your own diff once and check: it solves the stated problem; nothing unrelated changed; edge cases and failure paths are handled; the layer rules and conventions are respected; there are no comments; every claim in your reply is backed by a check you actually ran.

## 9. Report

Keep it short: what changed (with file links), any decision the user should know about, which code checks ran, and a one-line note that tests were not written or run (the user asks for them with the `tester` skill). Skip narration of routine steps.

**Explanations:** when the user asks how or why something works, give only the essential sentences: the cause, then the mechanism in short numbered steps, then the fix or options. No background and no repetition.
