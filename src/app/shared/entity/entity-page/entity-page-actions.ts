import { computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntityName, RequestTracker } from '@core/request-tracker';
import { ActionService } from '@shared/actions/action.service';
import { joinRouteIds } from '@shared/route-ids/route-ids';

export interface EntityPageActionsOptions {
  readonly entityName: () => EntityName;
  readonly selectedIds: () => string[];
  readonly deleteEntities: () => (ids: string[]) => Promise<void>;
  readonly afterDelete: () => void;
}

export function registerEntityPageActions(page: EntityPageActionsOptions): void {
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  const tracker = inject(RequestTracker);
  const nothingSelected = computed(() => page.selectedIds().length === 0);

  const openEditor = (ids: string[] = []) =>
    router.navigate(['editor'], {
      relativeTo: route,
      queryParams: ids.length > 0 ? { ids: joinRouteIds(ids) } : undefined,
    });

  const deleteSelected = async () => {
    const ids = page.selectedIds();
    if (ids.length > 0) {
      await page.deleteEntities()(ids);
      page.afterDelete();
    }
  };

  inject(ActionService).register(() => ({
    create: { run: () => openEditor() },
    edit: { run: () => openEditor(page.selectedIds()), disabled: nothingSelected },
    delete: {
      run: deleteSelected,
      disabled: nothingSelected,
      loading: () => tracker.isLoading({ entity: page.entityName(), operation: 'delete' }),
    },
  }));
}
