import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

export type EditAction = 'create' | 'edit' | 'save' | 'delete';
export type EditHandlers = Partial<Record<EditAction, VoidFunction>>;

@Injectable({ providedIn: 'root' })
export class EditActionsService {
  private readonly stack = signal<{ handlers: EditHandlers }[]>([]);

  readonly handlers = computed(() => this.stack().at(-1)?.handlers ?? {});

  register(handlers: EditHandlers): void {
    const entry = { handlers };
    this.stack.update((stack) => [...stack, entry]);
    inject(DestroyRef).onDestroy(() =>
      this.stack.update((stack) => stack.filter((item) => item !== entry)),
    );
  }
}
