import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { EditActionsService, EditHandlers, RouteCancel } from './edit-actions.service';

const handlers = signal<EditHandlers>({});
const suggested = signal<'create' | undefined>(undefined);

@Component({ template: '' })
class PageHost {
  constructor() {
    inject(EditActionsService).register(
      () => handlers(),
      () => suggested(),
    );
  }
}

@Component({ template: '' })
class FormHost {
  constructor() {
    inject(EditActionsService).register(() => ({ save: () => undefined }));
  }
}

@Component({ template: '' })
class Empty {}

describe('EditActionsService', () => {
  let service: EditActionsService;

  beforeEach(() => {
    handlers.set({});
    suggested.set(undefined);
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
    expect(service.handlers()).toEqual({});
  });

  it('follows the signals the registration reads', () => {
    TestBed.createComponent(PageHost);
    const create = vi.fn();

    handlers.set({ create });
    service.handlers().create?.();

    expect(Object.keys(service.handlers())).toEqual(['create']);
    expect(create).toHaveBeenCalled();
  });

  it('lets the latest registration win and restores the previous one when it goes away', () => {
    TestBed.createComponent(PageHost);
    handlers.set({ create: vi.fn() });

    const form = TestBed.createComponent(FormHost);
    expect(Object.keys(service.handlers())).toEqual(['save']);

    form.destroy();
    expect(Object.keys(service.handlers())).toEqual(['create']);
  });

  it('drops a registration when its page is destroyed', () => {
    const page = TestBed.createComponent(PageHost);
    handlers.set({ create: vi.fn() });

    page.destroy();

    expect(service.handlers()).toEqual({});
  });

  it('exposes the suggested action of the active registration', () => {
    TestBed.createComponent(PageHost);

    suggested.set('create');

    expect(service.suggested()).toBe('create');
  });

  it('turns the action named by the route into Cancel that navigates back', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/new');
    TestBed.createComponent(FormHost);

    expect(service.cancelling()).toBe('create');
    expect(Object.keys(service.handlers()).sort()).toEqual(['create', 'save']);

    service.handlers().create?.();
    await TestBed.inject(Router).navigated;
    await new Promise((resolve) => setTimeout(resolve));

    expect(router.url).toBe('/list');
    expect(service.cancelling()).toBeUndefined();
  });
});
