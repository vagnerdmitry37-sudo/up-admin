import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EditActionsService, EditActions } from './edit-actions.service';

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
    inject(EditActionsService).register({ actions: () => ({ save: { click: () => undefined } }) });
  }
}

describe('EditActionsService', () => {
  let service: EditActionsService;

  beforeEach(() => {
    actions.set({});
    service = TestBed.inject(EditActionsService);
  });

  it('has no actions until a page registers some', () => {
    expect(service.actions()).toEqual({});
  });

  it('follows the signals the registration reads', () => {
    TestBed.createComponent(PageHost);
    const create = vi.fn();

    actions.set({ create: { click: create } });
    service.run('create');

    expect(Object.keys(service.actions())).toEqual(['create']);
    expect(create).toHaveBeenCalled();
  });

  it('lets the latest registration win and restores the previous one when it goes away', () => {
    TestBed.createComponent(PageHost);
    actions.set({ create: { click: vi.fn() } });

    const form = TestBed.createComponent(FormHost);
    expect(Object.keys(service.actions())).toEqual(['save']);

    form.destroy();
    expect(Object.keys(service.actions())).toEqual(['create']);
  });

  it('ignores running an action the page did not register', () => {
    TestBed.createComponent(PageHost);
    const create = vi.fn();
    actions.set({ create: { click: create } });

    service.run('delete');

    expect(create).not.toHaveBeenCalled();
  });

  it('leaves out an action the page marks as not visible', () => {
    TestBed.createComponent(PageHost);
    const edit = vi.fn();
    actions.set({ create: { click: vi.fn() }, edit: { click: edit, visible: false } });

    service.run('edit');

    expect(Object.keys(service.actions())).toEqual(['create']);
    expect(edit).not.toHaveBeenCalled();
  });

  it('drops a registration when its page is destroyed', () => {
    const page = TestBed.createComponent(PageHost);
    actions.set({ create: { click: vi.fn() } });

    page.destroy();

    expect(service.actions()).toEqual({});
  });

  it('lists every action the page marks as suggested', () => {
    TestBed.createComponent(PageHost);

    actions.set({
      create: { click: vi.fn(), suggested: true },
      edit: { click: vi.fn() },
      save: { click: vi.fn(), suggested: true },
      delete: { click: vi.fn(), suggested: true, visible: false },
    });

    expect(service.suggested()).toEqual(['create', 'save']);
  });
});
