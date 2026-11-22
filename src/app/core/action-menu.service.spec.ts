import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActionMenuService, MenuActions } from './action-menu.service';

const actions = signal<MenuActions>({});
const formActions = signal<MenuActions>({});

@Component({ template: '' })
class PageHost {
  constructor() {
    inject(ActionMenuService).register({ entity: () => 'product', actions: () => actions() });
  }
}

@Component({ template: '' })
class FormHost {
  constructor() {
    inject(ActionMenuService).register({ entity: () => 'product', actions: () => formActions() });
  }
}

describe('ActionMenuService', () => {
  let service: ActionMenuService;

  beforeEach(() => {
    actions.set({});
    formActions.set({});
    service = TestBed.inject(ActionMenuService);
  });

  it('follows the signals the registration reads', () => {
    TestBed.createComponent(PageHost);
    const create = vi.fn();

    actions.set({ create: { click: create } });
    service.run('create');

    expect(Object.keys(service.actions())).toEqual(['create']);
    expect(create).toHaveBeenCalled();
  });

  it('adds a nested registration to the page actions and drops it when it goes away', () => {
    TestBed.createComponent(PageHost);
    actions.set({ create: { click: vi.fn() } });
    formActions.set({ save: { click: vi.fn() } });

    const form = TestBed.createComponent(FormHost);
    expect(Object.keys(service.actions())).toEqual(['create', 'save']);

    form.destroy();
    expect(Object.keys(service.actions())).toEqual(['create']);
  });

  it('runs the latest registration of an action and restores the earlier one when it goes away', async () => {
    TestBed.createComponent(PageHost);
    const pageSave = vi.fn();
    const formSave = vi.fn();
    actions.set({ save: { click: pageSave } });
    formActions.set({ save: { click: formSave } });

    const form = TestBed.createComponent(FormHost);
    await service.run('save');
    expect(formSave).toHaveBeenCalledTimes(1);
    expect(pageSave).not.toHaveBeenCalled();

    form.destroy();
    service.run('save');
    expect(pageSave).toHaveBeenCalledTimes(1);
  });

  it('keeps an earlier visible action when a later registration hides it', () => {
    TestBed.createComponent(PageHost);
    const pageSave = vi.fn();
    actions.set({ save: { click: pageSave } });
    formActions.set({ save: { click: vi.fn(), visible: false } });
    TestBed.createComponent(FormHost);

    service.run('save');

    expect(pageSave).toHaveBeenCalledTimes(1);
  });

  it('leaves out an action the page marks as not visible', () => {
    TestBed.createComponent(PageHost);
    const edit = vi.fn();
    actions.set({ create: { click: vi.fn() }, edit: { click: edit, visible: false } });

    service.run('edit');

    expect(Object.keys(service.actions())).toEqual(['create']);
    expect(edit).not.toHaveBeenCalled();
  });

  it('marks the action as running until it finishes and runs nothing else meanwhile', async () => {
    TestBed.createComponent(PageHost);
    let finishSave!: VoidFunction;
    const save = vi.fn(() => new Promise<void>((resolve) => (finishSave = resolve)));
    const create = vi.fn();
    actions.set({ create: { click: create }, save: { click: save } });

    const running = service.run('save');
    expect(service.runningAction()).toBe('save');

    service.run('save');
    service.run('create');
    expect(save).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();

    finishSave();
    await running;
    expect(service.runningAction()).toBeUndefined();
  });

  it('keeps a running action listed after its page hides it', async () => {
    TestBed.createComponent(PageHost);
    let finishDelete!: VoidFunction;
    actions.set({
      delete: { click: () => new Promise<void>((resolve) => (finishDelete = resolve)) },
    });

    const running = service.run('delete');
    actions.set({ delete: { click: vi.fn(), visible: false } });
    expect(Object.keys(service.actions())).toEqual(['delete']);

    finishDelete();
    await running;
    expect(Object.keys(service.actions())).toEqual([]);
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
