import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { EditActionsService, EditHandlers, RouteCancel } from '@core/edit-actions.service';
import { EditMenu } from './edit-menu';

const handlers = signal<EditHandlers>({});

@Component({ selector: 'app-page', template: '' })
class Page {
  constructor() {
    inject(EditActionsService).register(() => handlers());
  }
}

@Component({ template: '' })
class Empty {}

const actionLabels = (element: HTMLElement) =>
  [...element.querySelectorAll('.p-speeddial-item')]
    .filter((item) => !item.classList.contains('p-hidden'))
    .map((item) => item.querySelector('button')?.getAttribute('aria-label'));

describe('EditMenu', () => {
  beforeEach(() => {
    handlers.set({});
    TestBed.configureTestingModule({
      imports: [EditMenu],
      providers: [
        provideRouter([
          { path: 'list', component: Empty },
          {
            path: 'new',
            component: Empty,
            data: { cancel: { action: 'create', url: '/list' } satisfies RouteCancel },
          },
        ]),
      ],
    });
  });

  it('is not shown when the page has no actions', async () => {
    const menu = TestBed.createComponent(EditMenu);
    await menu.whenStable();

    expect(menu.nativeElement.querySelector('p-speeddial')).toBeNull();
  });

  it('shows only the actions the page registered', async () => {
    TestBed.createComponent(Page);
    handlers.set({ create: vi.fn(), edit: vi.fn() });
    const menu = TestBed.createComponent(EditMenu);
    await menu.whenStable();

    expect(actionLabels(menu.nativeElement)).toEqual(['Create', 'Edit']);
  });

  it('runs the registered handler when an action is pressed', async () => {
    const edit = vi.fn();
    TestBed.createComponent(Page);
    handlers.set({ edit });
    const menu = TestBed.createComponent(EditMenu);
    await menu.whenStable();

    menu.nativeElement.querySelector('[aria-label="Edit"]').click();

    expect(edit).toHaveBeenCalledTimes(1);
  });

  it('labels the cancelled action Cancel on routes that declare it', async () => {
    await TestBed.inject(Router).navigateByUrl('/new');
    TestBed.createComponent(Page);
    handlers.set({ save: vi.fn() });
    const menu = TestBed.createComponent(EditMenu);
    await menu.whenStable();

    expect(actionLabels(menu.nativeElement)).toEqual(['Cancel', 'Save']);
  });

  it('keeps the same buttons when the actions do not change', async () => {
    TestBed.createComponent(Page);
    handlers.set({ create: vi.fn() });
    const menu = TestBed.createComponent(EditMenu);
    await menu.whenStable();
    const before = menu.nativeElement.querySelector('[aria-label="Create"]');

    handlers.set({ create: vi.fn() });
    await menu.whenStable();

    expect(menu.nativeElement.querySelector('[aria-label="Create"]')).toBe(before);
  });
});
