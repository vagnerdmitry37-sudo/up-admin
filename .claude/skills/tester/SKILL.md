---
name: tester
description: Write, update and run tests for recent work in this Angular repo - Vitest unit specs and browser checks with the ui-check script. Use ONLY when the user explicitly asks to test ("test it", "test your previous work", "write tests for…", "run the tests", /tester). Never invoke on your own after coding; the developer skill does not write or run tests.
---

Testing is on demand. Outside this skill, never write, rewrite or run tests, and never run browser checks. When the user asks to test, follow these steps in order.

## 1. Decide the scope

- If the user names something ("test the uploader", "test the delete action"), test exactly that.
- Otherwise test the previous work: the uncommitted changes (`git status --short` and `git diff HEAD`). If the tree is clean, use the last commit (`git show --stat HEAD`).
- List the behaviours to cover in two to five short lines in the chat before writing anything. Each behaviour is something a user or caller can observe.

## 2. Write or update the specs

- Specs sit next to the code (`x.spec.ts`). Add to the existing spec file when there is one, and follow its `render`/helper style.
- Test behaviour through the public API and the DOM, never private members. Test names describe what the user sees: `deletes only the selected images`.
- Update specs that the change made wrong. Never delete, skip or weaken a test only to get a green run.
- Conventions:
  - **HTTP:** `provideHttpClient()`, `provideHttpClientTesting()`, `{ provide: API_BASE_URL, useValue: '/api' }`; answer requests with `httpTestingController.expectOne(...).flush(...)`; `afterEach(() => httpTestingController.verify())`.
  - **Pages that load on start:** `TestBed.tick()`, then answer every request the page makes (for example products and images on the edit page), then `await fixture.whenStable()`. Awaiting `whenStable()` before answering hangs.
  - **Routing:** `provideRouter([])` and `vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true)`.
  - **Edit menu:** read `TestBed.inject(EditActionsService).actions()` and trigger with `run('save' | 'delete' | …)`; wait with `await new Promise((resolve) => setTimeout(resolve))` after a run that sends requests.
  - **Naming:** injected things keep their class name in lowerCamelCase (`httpTestingController`, `editActionsService`); in a service's own spec the subject is `service`.
  - **Choosing files in the image uploader (jsdom):** stub `URL.createObjectURL = vi.fn(() => 'blob:preview')`, then on `input[type="file"]` use `Object.defineProperty(input, 'files', { value: [new File(['a'], 'photo.jpg', { type: 'image/jpeg' })] })`, dispatch `new Event('change')`, then `fixture.detectChanges()` and `await fixture.whenStable()`. Fake a large file with `Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 })`.
  - **Opening the file picker:** spy on the hidden input with `vi.spyOn(input, 'click').mockImplementation(() => undefined)`.
  - `src/test-setup.ts` stubs browser APIs jsdom lacks (`ResizeObserver` for Optimus Tabs).

## 3. Run the unit tests and code checks

One Bash call:

```sh
npx prettier --write <changed files> >/dev/null && npx ng lint 2>&1 | grep -E "pass|error|warning"; npm run build 2>&1 | grep -iE " error|warning|complete"; npm test 2>&1 | grep -E "Test Files|Tests |FAIL|AssertionError|Error:"
```

## 4. Browser check (any visual or behaviour change)

- Use a dev server on port 4300, because the user's server on 4200 can serve stale code. Start `npx ng serve --port 4300` in the background only if `curl -sk -o /dev/null -w "%{http_code}" https://localhost:4300/` does not print 200, and leave it running.
- Check every relevant size in one run:

  ```sh
  node .claude/skills/developer/scripts/ui-check.mjs --url https://localhost:4300/ --sizes 320x568,375x667,768x1024,1280x800 --click .trigger --measure ".trigger,.p-menu" --out <scratchpad>/shot.png
  ```

  It fakes a logged-in session (`--logged-out` for the opposite) and prints JSON per size: scroll, horizontal overflow, element boxes and console errors. Judge from the numbers first, then `Read` one screenshot. `--click` can repeat; `--trace <selector>` records the element on every frame after each click, for blinking or shifting.

- **Interactions the script lacks:** copy it to the scratchpad and add steps there, never to the repo copy unless the user asks. Steps that have worked:
  - real mouse click: `Input.dispatchMouseEvent` (`mousePressed` and `mouseReleased`) at the element's box, so focus moves like a real click (`el.click()` does not move focus);
  - keyboard: `Input.dispatchKeyEvent` for `Tab`, `Input.insertText` for typing;
  - choose files: build `File`s from a canvas `toBlob`, add them to a `DataTransfer`, set `input.files = transfer.files` and dispatch `change`;
  - drop files: dispatch `dragenter`, `dragover` and `drop` `DragEvent`s with that `DataTransfer` on `.p-fileupload-content`;
  - file picker opened: patch `HTMLInputElement.prototype.click` to count calls on `type === 'file'` (headless Chrome shows no dialog);
  - focus state: report `document.activeElement` and `matches(':focus-visible')`.
- **Real API:** the dev server proxies `/api` to `https://localhost:7215`. Check it with `curl -sk https://localhost:7215/api/products?first=0&rows=1`. GET endpoints are public, so pages that only read data work with the fake session; anything that writes needs a real login. Never write to the user's database or R2 bucket unless the user asks.

## 5. When something fails

- A wrong test (bad selector, missing request answer): fix the test.
- A real bug in the code under test: do not change product code silently. Report the failing behaviour, the cause and the proposed fix, and ask before fixing.
- A check that cannot run (API down, Docker off, no server): say which and why.

## 6. Report

| Check                   | Status       | Details                                           |
| ----------------------- | ------------ | ------------------------------------------------- |
| Specs written / updated | ✅           | files and what they cover                         |
| Unit tests              | ✅ / ❌      | N passed, or failures                             |
| Lint / build            | ✅ / ❌      | errors, if any                                    |
| Browser check           | ✅ / ❌ / ⏭️ | sizes, overflow, console errors, what was clicked |

Then list anything left untested and why. Never claim something works without a check you actually ran.
