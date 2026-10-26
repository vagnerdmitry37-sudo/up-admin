import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EditActionsService, EditActions } from '@core/edit-actions.service';
import { EditMenu } from './edit-menu';

const actions = signal<EditActions>({});

@Component({ selector: 'app-page', template: '' })
class Page {
  constructor() {
    inject(EditActionsService).register({ actions: () => actions() });
  }
}

const actionLabels = (element: HTMLElement) =>
  [...element.querySelectorAll('.p-speeddial-item')]
    .filter((item) => !item.classList.contains('p-hidden'))
    .map((item) => item.querySelector('button')?.getAttribute('aria-label'));

describe('EditMenu', () => {
  beforeEach(() => {
    actions.set({});
    TestBed.configureTestingModule({
      imports: [EditMenu],
    });
  });

  it('is not shown when the page has no actions', async () => {
    const menu = TestBed.createComponent(EditMenu);
    await menu.whenStable();

    expect(menu.nativeElement.querySelector('p-speeddial')).toBeNull();
  });

  it('shows only the actions the page registered', async () => {
    TestBed.createComponent(Page);
    actions.set({ create: { click: vi.fn() }, edit: { click: vi.fn() } });
    const menu = TestBed.createComponent(EditMenu);
    await menu.whenStable();

    expect(actionLabels(menu.nativeElement)).toEqual(['Create', 'Edit']);
  });

  it('hides an action the page marks as not visible', async () => {
    TestBed.createComponent(Page);
    actions.set({ create: { click: vi.fn() }, edit: { click: vi.fn(), visible: false } });
    const menu = TestBed.createComponent(EditMenu);
    await menu.whenStable();

    expect(actionLabels(menu.nativeElement)).toEqual(['Create']);
  });

  it('runs the registered handler when an action is clicked', async () => {
    const edit = vi.fn();
    TestBed.createComponent(Page);
    actions.set({ edit: { click: edit } });
    const menu = TestBed.createComponent(EditMenu);
    await menu.whenStable();

    menu.nativeElement.querySelector('[aria-label="Edit"]').click();

    expect(edit).toHaveBeenCalledTimes(1);
  });

  it('pulses the closed button and marks every suggested action', async () => {
    TestBed.createComponent(Page);
    actions.set({
      create: { click: vi.fn(), suggested: true },
      edit: { click: vi.fn() },
      save: { click: vi.fn(), suggested: true },
    });
    const menu = TestBed.createComponent(EditMenu);
    await menu.whenStable();
    const marked = [...menu.nativeElement.querySelectorAll('.edit-menu-suggested')].map((icon) =>
      icon.closest('button')?.getAttribute('aria-label'),
    );

    expect(menu.nativeElement.classList).toContain('suggesting');
    expect(marked).toEqual(['Create', 'Save']);
  });

  it('does not pulse when nothing is suggested', async () => {
    TestBed.createComponent(Page);
    actions.set({ create: { click: vi.fn() } });
    const menu = TestBed.createComponent(EditMenu);
    await menu.whenStable();

    expect(menu.nativeElement.classList).not.toContain('suggesting');
  });

  it('keeps the same buttons when the actions do not change', async () => {
    TestBed.createComponent(Page);
    actions.set({ create: { click: vi.fn() } });
    const menu = TestBed.createComponent(EditMenu);
    await menu.whenStable();
    const before = menu.nativeElement.querySelector('[aria-label="Create"]');

    actions.set({ create: { click: vi.fn() } });
    await menu.whenStable();

    expect(menu.nativeElement.querySelector('[aria-label="Create"]')).toBe(before);
  });
});
