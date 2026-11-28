import { inject } from '@angular/core';
import { ActionService } from '@shared/actions/action.service';

export interface EntityEditPageActionsOptions {
  readonly addNewTab: () => void;
}

export function registerEntityEditPageActions(page: EntityEditPageActionsOptions): void {
  inject(ActionService).register(() => ({
    create: { run: page.addNewTab },
  }));
}
