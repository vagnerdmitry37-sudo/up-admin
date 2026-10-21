---
name: developer
description: How to develop in this Angular repo fast without lowering code quality. Covers task sizing, efficient investigation, project conventions, risk-based verification, a browser check script, anti-patterns and reporting. Use for every coding task here, including features, bug fixes, refactors, debugging, reviews and config changes.
---

**Goal: cut wasted effort, never essential engineering.** Quality is fixed: correct, secure, readable, consistent with the project and verified. Speed comes from doing less of the unnecessary, not less of the necessary.

For UI work, the `design` skill also applies. To commit, use the `commit` skill.

## 1. Size the task first

Decide the size before doing anything else, and scale every later step to it.

| Size          | Examples                                                                       | Investigation                                       | Plan                                                                         | Verification                            |
| ------------- | ------------------------------------------------------------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------- |
| **S**         | Rename, style tweak, copy change, one-file fix                                 | Read the target file only                           | None, just do it                                                             | Format, lint, build                     |
| **M**         | New page or component, behavior change across 2–5 files                        | The files involved and one similar existing example | 2–4 lines in your head or reply                                              | S checks + browser check                |
| **L**         | New feature area, routing or state redesign, new dependency                    | The affected layers and their callers               | Short written plan with acceptance criteria; confirm product decisions first | M checks + edge cases and failure paths |
| **High risk** | Auth, session, guards, HTTP interceptors, API contracts, secrets, dependencies | As L, plus every caller                             | As L, and state the risks                                                    | As L, plus security review of the diff  |

## 2. Know the project (do not rediscover it)

- **Stack:** Angular 22 standalone components, signals, `ChangeDetectionStrategy.OnPush` (lint-enforced), new control flow, lazy `loadComponent` routes. UI is Optimus UI (see `design`). Prettier, ESLint, Vitest via `ng test`. There are no spec files yet.
- **Layers** (`src/app/`, lint-enforced): `core/` holds app-wide services and config, `layout/` the shell and its parts, `features/<name>/` the pages, `shared/` reusable UI. `features` must not import other features; `shared` imports none of core, layout or features; `core` imports neither layout nor features; `layout` does not import features. Use the aliases `@core/*`, `@shared/*`, `@layout/*`, `@features/*`.
- **Conventions:** file `x-page.ts`, `.html`, `.scss` side by side; class `XPage` without the `Component` suffix; selector `app-x-page`; `inject()` instead of constructor injection; `protected readonly` for template members; `private` for the rest. Single-line methods use arrow functions: `getProfile = () => this.http.get(...)`.
- **No comments** in `.ts`, `.html` or `.scss`. Names carry the meaning.
- **Routing:** the public `login` route uses `guestGuard`. Every other page is a child of the `''` route, which uses `authGuard` and renders `Shell`. Add new pages there.
- **Edit menu:** the footer's right corner holds `EditMenu` (an Optimus speed dial with Create, Edit, Save, Delete). A page enables actions by calling `inject(EditActionsService).register({ save: () => ..., delete: () => ... })` in its constructor; they are cleared when the page is destroyed, and unregistered actions show disabled. Registrations form a stack: only the most recent one is active, so a form inside a page replaces the page's actions while it exists and the page's actions return when it is destroyed.
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
- Make the smallest complete change: wire it in (route, import, menu entry), handle the empty state, and nothing beyond the request.
- Reuse existing services, components and tokens. Add a dependency only when the platform and Optimus have nothing for it, and say so in your reply.
- Write whole files with `Write` when most of a file changes; use `Edit` for targeted changes. Batch independent edits in one turn.
- If a file changed on disk since you read it, re-read it before overwriting. The user often edits in parallel, so keep their changes.

## 5. Verify by risk, in as few tool calls as possible

Measured on this machine: `prettier` about 1s, `ng lint` about 3s, `npm run build` about 3s, `ui-check.mjs` about 1.5s plus 1s per extra screen size. The checks are cheap. **Tool-call round trips are the expensive part**, so batch them.

**One command for the code checks**, run once after the edits:

```sh
npx prettier --write <changed files> >/dev/null && npx ng lint 2>&1 | grep -E "pass|error|warning"; npm run build 2>&1 | grep -iE " error|warning|complete"
```

Do not pipe `ng lint` into `tail -1`, because its last line is blank. The build must finish without errors or new warnings; bundle budget warnings count.

**Browser check** (any visual or behavior change):

- Use a dev server on port 4300, because the user's server on 4200 can serve stale code. **Reuse it:** start `npx ng serve --port 4300` in the background only if `curl -sk -o /dev/null -w "%{http_code}" https://localhost:4300/` does not print 200. Leave it running for the session, since it reloads changes by itself. Do not stop and restart it per task.
- Check every relevant size in **one** run, in the same Bash call as the code checks:

  ```sh
  node .claude/skills/developer/scripts/ui-check.mjs --url https://localhost:4300/ --sizes 320x568,375x667,768x1024,1280x800 --click .trigger --measure ".trigger,.p-menu" --out <scratchpad>/shot.png
  ```

  It fakes a logged-in session (`--logged-out` for the opposite), waits until the app has rendered, and prints JSON per size: scroll, horizontal overflow, element boxes and console errors. Judge from the numbers first, then `Read` **one** screenshot (the narrowest) to confirm the look. Read more only if the numbers show a problem.

- `--click` can repeat (for example open, then close). For animation glitches such as blinking or shifting, add `--trace <selector>`: it records the element's box, opacity and transform on every frame after each click, so you can see exactly what moves.

**Target flow for an S task, about five tool calls:** (1) read the target file and any library `.d.ts` in parallel, and start the 4300 server if it is not up; (2) edit; (3) one Bash call with the code checks plus `ui-check`; (4) `Read` one screenshot if the change is visual; (5) report.

If a check cannot run, say which and why. Never report something as working without evidence.

## 6. Environment facts (Windows, Git Bash)

- No Python and no `bc`. Use Node for scripts and arithmetic.
- Edit text and Markdown with `Edit`/`Write`, never with `node -e` or `sed` strings that contain backticks or nested quotes: Bash breaks the quoting and runs fragments as commands.
- Headless Chrome must run with `--no-proxy-server`; otherwise every page load waits 21s for the system proxy to time out. `ui-check.mjs` already does this.
- Git Bash rewrites arguments that start with `/` into Windows paths. Pass URLs whole (`https://...`) or paths without the leading slash.
- No Unix `sleep` loops for waiting on a background task you started; you are notified when it ends.

## 7. Anti-patterns

| Do not                                                          | Instead                                        |
| --------------------------------------------------------------- | ---------------------------------------------- |
| Plan, survey options or ask questions for an S task             | Do it and mention the one assumption           |
| Re-read files or re-run identical searches                      | Use what is already in context                 |
| Add abstractions, services or generic helpers "for later"       | Write the concrete code the task needs now     |
| Refactor or reformat code outside the task                      | Mention it as a follow-up                      |
| Add a package for something small                               | Use Angular, the platform or Optimus           |
| Fight library CSS with specificity, `!important` or `::ng-deep` | Use the library's inputs, tokens or preset     |
| Silence lint or type errors, or weaken checks                   | Fix the cause                                  |
| Swallow errors with an empty `catch`                            | Handle the error, or let it surface            |
| Guess why the UI looks wrong                                    | Measure it in the browser with the script      |
| Claim "fixed" or "works" after only a build                     | Verify the behavior that was reported          |
| Leave placeholder logic when working code was requested         | Implement it, or state clearly what is missing |

## 8. Before you finish

Read your own diff once and check: it solves the stated problem; nothing unrelated changed; edge cases and failure paths are handled; the layer rules and conventions are respected; there are no comments; every claim in your reply is backed by a check you actually ran.

## 9. Report

Keep it short: what changed (with file links), any decision the user should know about, what you verified and how, and anything unverified or left open. Skip narration of routine steps.
