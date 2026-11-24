import { Injectable, signal } from '@angular/core';
import { MenuItem } from '@openng/optimus-ui/api';

export type ActionNames = 'create' | 'edit' | 'save' | 'delete';

export interface ActionMenuItem extends MenuItem {
  name: ActionNames
}

@Injectable({ providedIn: 'root' })
export class ActionTestService {
  readonly actions = signal<ActionMenuItem[]>([]);

  register(items: ActionMenuItem[]): void {
    this.actions.set(items);
  }
}
