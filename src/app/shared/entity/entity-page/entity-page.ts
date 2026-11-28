import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { TableColumn } from '@shared/data-table/data-table';
import { lazyRows, RowsPageLoader } from '@shared/data-table/lazy-rows';
import { EntityTable } from '@shared/entity/entity-table/entity-table';
import { EntityName, RequestTracker } from '@core/request-tracker';
import { registerEntityPageActions } from './entity-page-actions';

@Component({
  selector: 'app-entity-page',
  imports: [EntityTable],
  templateUrl: './entity-page.html',
  styleUrl: './entity-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityPage<T extends { id: string }> {
  private readonly tracker = inject(RequestTracker);

  readonly loadPage = input.required<RowsPageLoader<T>>();
  readonly columns = input.required<TableColumn<T>[]>();
  readonly entityName = input.required<EntityName>();
  readonly deleteEntities = input.required<(ids: string[]) => Promise<void>>();

  readonly selection = model<T[]>([]);
  protected readonly lazyRows = lazyRows<T>(this.loadPage);
  protected readonly selectedIds = computed(() => this.selection().map(({ id }) => id));
  protected readonly loading = computed(() =>
    this.tracker.isLoading({ entity: this.entityName(), operation: 'list' }),
  );

  constructor() {
    registerEntityPageActions({
      entityName: this.entityName,
      selectedIds: this.selectedIds,
      deleteEntities: this.deleteEntities,
      afterDelete: () => {
        this.selection.set([]);
        this.lazyRows.reload();
      },
    });
  }
}
