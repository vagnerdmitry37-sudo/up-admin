import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EditActionsService, EditActions } from './edit-actions.service';

const actions = signal<EditActions>({});
const formActions = signal<EditActions>({});

@Component({ template: '' })
class PageHost {
  constructor() {
    inject(EditActionsService).register({ actions: () => actions() });
  }
}

@Component({ template: '' })
class FormHost {
  constructor() {
    inject(EditActionsService).register({ actions: () => formActions() });
  }
}

describe('EditActionsService', () => {
  let service: EditActionsService;

  beforeEach(() => {
    actions.set({});
    formActions.set({});
    service = TestBed.inject(EditActionsService);
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

  it('runs the latest registration of an action and restores the earlier one when it goes away', () => {
    TestBed.createComponent(PageHost);
    const pageSave = vi.fn();
    const formSave = vi.fn();
    actions.set({ save: { click: pageSave } });
    formActions.set({ save: { click: formSave } });

    const form = TestBed.createComponent(FormHost);
    service.run('save');
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

  it('does not run an action while it is loading', () => {
    TestBed.createComponent(PageHost);
    const save = vi.fn();
    actions.set({ save: { click: save, loading: true } });

    service.run('save');
    expect(save).not.toHaveBeenCalled();

    actions.set({ save: { click: save } });
    service.run('save');
    expect(save).toHaveBeenCalledTimes(1);
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
