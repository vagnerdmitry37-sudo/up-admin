import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { EditActionsService, EditActions, RouteCancel } from './edit-actions.service';

const actions = signal<EditActions>({});

@Component({ template: '' })
class PageHost {
  constructor() {
    inject(EditActionsService).register({ actions: () => actions() });
  }
}

@Component({ template: '' })
class FormHost {
  constructor() {
    inject(EditActionsService).register({ actions: () => ({ save: { press: () => undefined } }) });
  }
}

@Component({ template: '' })
class Empty {}

describe('EditActionsService', () => {
  let service: EditActionsService;

  beforeEach(() => {
    actions.set({});
    TestBed.configureTestingModule({
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
    service = TestBed.inject(EditActionsService);
  });

  it('has no actions until a page registers some', () => {
    expect(service.actions()).toEqual({});
  });

  it('follows the signals the registration reads', () => {
    TestBed.createComponent(PageHost);
    const create = vi.fn();

    actions.set({ create: { press: create } });
    service.run('create');

    expect(Object.keys(service.actions())).toEqual(['create']);
    expect(create).toHaveBeenCalled();
  });

  it('lets the latest registration win and restores the previous one when it goes away', () => {
    TestBed.createComponent(PageHost);
    actions.set({ create: { press: vi.fn() } });

    const form = TestBed.createComponent(FormHost);
    expect(Object.keys(service.actions())).toEqual(['save']);

    form.destroy();
    expect(Object.keys(service.actions())).toEqual(['create']);
  });

  it('ignores running an action the page did not register', () => {
    TestBed.createComponent(PageHost);
    const create = vi.fn();
    actions.set({ create: { press: create } });

    service.run('delete');

    expect(create).not.toHaveBeenCalled();
  });

  it('leaves out an action the page marks as not visible', () => {
    TestBed.createComponent(PageHost);
    const edit = vi.fn();
    actions.set({ create: { press: vi.fn() }, edit: { press: edit, visible: false } });

    service.run('edit');

    expect(Object.keys(service.actions())).toEqual(['create']);
    expect(edit).not.toHaveBeenCalled();
  });

  it('runs the handler of the gesture the user made', () => {
    TestBed.createComponent(PageHost);
    const press = vi.fn();
    const longPress = vi.fn();
    actions.set({ edit: { press, longPress } });

    service.run('edit', 'longPress');
    expect(longPress).toHaveBeenCalledTimes(1);
    expect(press).not.toHaveBeenCalled();

    service.run('edit');
    expect(press).toHaveBeenCalledTimes(1);
  });

  it('falls back to the press handler when an action has no long press', () => {
    TestBed.createComponent(PageHost);
    const edit = vi.fn();
    actions.set({ edit: { press: edit } });

    service.run('edit', 'longPress');

    expect(edit).toHaveBeenCalledTimes(1);
  });

  it('drops a registration when its page is destroyed', () => {
    const page = TestBed.createComponent(PageHost);
    actions.set({ create: { press: vi.fn() } });

    page.destroy();

    expect(service.actions()).toEqual({});
  });

  it('lists every action the page marks as suggested', () => {
    TestBed.createComponent(PageHost);

    actions.set({
      create: { press: vi.fn(), suggested: true },
      edit: { press: vi.fn() },
      save: { press: vi.fn(), suggested: true },
      delete: { press: vi.fn(), suggested: true, visible: false },
    });

    expect(service.suggested()).toEqual(['create', 'save']);
  });

  it('turns the action named by the route into Cancel that navigates back', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/new');
    TestBed.createComponent(FormHost);

    expect(service.cancelling()).toBe('create');
    expect(Object.keys(service.actions()).sort()).toEqual(['create', 'save']);

    service.run('create');
    await TestBed.inject(Router).navigated;
    await new Promise((resolve) => setTimeout(resolve));

    expect(router.url).toBe('/list');
    expect(service.cancelling()).toBeUndefined();
  });
});
