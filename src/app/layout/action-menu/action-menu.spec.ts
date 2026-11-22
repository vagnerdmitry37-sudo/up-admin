import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EditActionsService, EditActions } from '@core/edit-actions.service';
import { DEFAULT_HOLD_DURATION_MS } from '@shared/action-trigger/action-trigger';
import { ActionMenu } from './action-menu';

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

const pendingFrames = new Map<number, FrameRequestCallback>();

const runFramesAt = (now: number) => {
  const frames = [...pendingFrames.values()];
  pendingFrames.clear();
  frames.forEach((frame) => frame(now));
};

const controlAnimationFrames = () => {
  let nextFrameId = 0;
  pendingFrames.clear();
  vi.spyOn(performance, 'now').mockReturnValue(0);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((frame) => {
    pendingFrames.set(++nextFrameId, frame);
    return nextFrameId;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((frameId) => {
    pendingFrames.delete(frameId);
  });
};

const press = (button: HTMLElement) =>
  button.dispatchEvent(new PointerEvent('pointerdown', { isPrimary: true, button: 0 }));

const release = (button: HTMLElement) => button.dispatchEvent(new PointerEvent('pointerup'));

const isOpen = (element: HTMLElement) => Boolean(element.querySelector('.p-speeddial-open'));

describe('ActionMenu', () => {
  beforeEach(() => {
    actions.set({});
    TestBed.configureTestingModule({
      imports: [ActionMenu],
    });
  });

  it('is not shown when the page has no actions', async () => {
    const menu = TestBed.createComponent(ActionMenu);
    await menu.whenStable();

    expect(menu.nativeElement.querySelector('p-speeddial')).toBeNull();
  });

  it('shows only the actions the page registered', async () => {
    TestBed.createComponent(Page);
    actions.set({ create: { click: vi.fn() }, edit: { click: vi.fn() } });
    const menu = TestBed.createComponent(ActionMenu);
    await menu.whenStable();

    expect(actionLabels(menu.nativeElement)).toEqual(['Create', 'Edit']);
  });

  it('runs the registered handler when an action is clicked', async () => {
    const edit = vi.fn();
    TestBed.createComponent(Page);
    actions.set({ edit: { click: edit } });
    const menu = TestBed.createComponent(ActionMenu);
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
    const menu = TestBed.createComponent(ActionMenu);
    await menu.whenStable();
    menu.nativeElement.querySelector('.p-speeddial-button').click();
    await menu.whenStable();
    const marked = [...menu.nativeElement.querySelectorAll('.action-menu-suggested')].map((icon) =>
      icon.closest('button')?.getAttribute('aria-label'),
    );

    expect(menu.nativeElement.classList).toContain('suggesting');
    expect(marked).toEqual(['Create', 'Save']);
  });

  it('opens when the page first offers actions', async () => {
    TestBed.createComponent(Page);
    actions.set({ create: { click: vi.fn() } });
    const menu = TestBed.createComponent(ActionMenu);
    await menu.whenStable();

    expect(isOpen(menu.nativeElement)).toBe(true);
  });

  it('stays closed after the user closes it while the actions stay the same', async () => {
    TestBed.createComponent(Page);
    actions.set({ create: { click: vi.fn() } });
    const menu = TestBed.createComponent(ActionMenu);
    await menu.whenStable();

    menu.nativeElement.querySelector('.p-speeddial-button').click();
    await menu.whenStable();
    actions.set({ create: { click: vi.fn(), suggested: true } });
    await menu.whenStable();

    expect(isOpen(menu.nativeElement)).toBe(false);
  });

  it('reopens after the user closed it when a new action becomes available', async () => {
    TestBed.createComponent(Page);
    actions.set({ create: { click: vi.fn() }, edit: { click: vi.fn(), visible: false } });
    const menu = TestBed.createComponent(ActionMenu);
    await menu.whenStable();

    menu.nativeElement.querySelector('.p-speeddial-button').click();
    await menu.whenStable();
    expect(isOpen(menu.nativeElement)).toBe(false);

    actions.set({ create: { click: vi.fn() }, edit: { click: vi.fn() } });
    await menu.whenStable();

    expect(isOpen(menu.nativeElement)).toBe(true);
  });

  it('keeps the same buttons when the actions do not change', async () => {
    TestBed.createComponent(Page);
    actions.set({ create: { click: vi.fn() } });
    const menu = TestBed.createComponent(ActionMenu);
    await menu.whenStable();
    const before = menu.nativeElement.querySelector('[aria-label="Create"]');

    actions.set({ create: { click: vi.fn() } });
    await menu.whenStable();

    expect(menu.nativeElement.querySelector('[aria-label="Create"]')).toBe(before);
  });

  it('shows a busy ring around an action while it is running and removes it when it finishes', async () => {
    TestBed.createComponent(Page);
    let finishSave!: VoidFunction;
    actions.set({ save: { click: () => new Promise<void>((resolve) => (finishSave = resolve)) } });
    const menu = TestBed.createComponent(ActionMenu);
    await menu.whenStable();
    const action = () =>
      menu.nativeElement.querySelector('[aria-label="Save"]').closest('.action-menu-action');

    const running = TestBed.inject(EditActionsService).run('save');
    await menu.whenStable();

    expect(action().querySelector('app-progress-ring p-progress-spinner')).not.toBeNull();
    expect(action().querySelector('button').getAttribute('aria-busy')).toBe('true');

    finishSave();
    await running;
    await menu.whenStable();

    expect(action().querySelector('app-progress-ring')).toBeNull();
    expect(action().querySelector('button').hasAttribute('aria-busy')).toBe(false);
  });

  describe('hold actions', () => {
    const renderSave = async (save: VoidFunction) => {
      TestBed.createComponent(Page);
      actions.set({ save: { click: save } });
      const menu = TestBed.createComponent(ActionMenu);
      await menu.whenStable();
      return menu.nativeElement.querySelector('[aria-label="Save"]') as HTMLElement;
    };

    beforeEach(controlAnimationFrames);

    afterEach(() => vi.restoreAllMocks());

    it('runs Save only after the button is held for the hold duration', async () => {
      const save = vi.fn();
      const button = await renderSave(save);

      button.click();
      press(button);
      runFramesAt(DEFAULT_HOLD_DURATION_MS - 1);
      expect(save).not.toHaveBeenCalled();

      runFramesAt(DEFAULT_HOLD_DURATION_MS);
      release(button);
      button.click();

      expect(save).toHaveBeenCalledTimes(1);
    });

    it('does not run Save when the button is released before the hold duration', async () => {
      const save = vi.fn();
      const button = await renderSave(save);

      press(button);
      runFramesAt(DEFAULT_HOLD_DURATION_MS / 2);
      release(button);
      runFramesAt(DEFAULT_HOLD_DURATION_MS);

      expect(save).not.toHaveBeenCalled();
    });

    it('fills a ring around Save as it is held and removes it on release', async () => {
      const button = await renderSave(vi.fn());
      const fill = () => button.closest('.action-menu-action')!.querySelector('.progress-ring-fill');

      press(button);
      runFramesAt(DEFAULT_HOLD_DURATION_MS / 2);
      TestBed.tick();
      expect(fill()?.getAttribute('stroke-dasharray')).toBe('50 100');

      release(button);
      TestBed.tick();
      expect(fill()).toBeNull();
    });

    it('runs Save when Enter is held on the focused button', async () => {
      const save = vi.fn();
      const button = await renderSave(save);

      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      runFramesAt(DEFAULT_HOLD_DURATION_MS);

      expect(save).toHaveBeenCalledTimes(1);
    });
  });
});
