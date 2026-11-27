import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TableColumn } from '@shared/data-table/data-table';
import { lazyRows, RowsPageLoader } from '@shared/data-table/lazy-rows';
import { EntityTable } from '@shared/entity/entity-table/entity-table';
import { joinRouteIds } from '@shared/route-ids/route-ids';
import { ActionService } from '@shared/actions/action.service';
import { EntityName, RequestTracker } from '@core/request-tracker';

@Component({
  selector: 'app-entity-page',
  imports: [EntityTable],
  templateUrl: './entity-page.html',
  styleUrl: './entity-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityPage<T extends { id: string }> {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tracker = inject(RequestTracker);

  readonly loadPage = input.required<RowsPageLoader<T>>();
  readonly columns = input.required<TableColumn<T>[]>();
  readonly entityName = input.required<EntityName>();
  readonly deleteEntities = input.required<(ids: string[]) => Promise<void>>();

  readonly selection = model<T[]>([]);
  protected readonly lazyRows = lazyRows<T>(this.loadPage);
  protected readonly selectedIds = computed(() => this.selection().map(({ id }) => id));
  private readonly nothingSelected = computed(() => this.selectedIds().length === 0);
  protected readonly loading = computed(() => this.tracker.isLoading(`${this.entityName()}.list`));

  constructor() {
    inject(ActionService).register(() => ({
      edit: {
        run: () => this.openEditEntityPage(this.selectedIds()),
        disabled: this.nothingSelected,
      },
      create: { run: () => this.openEditEntityPage() },
      delete: {
        run: () => this.deleteSelected(this.selectedIds()),
        disabled: this.nothingSelected,
        loading: () => this.tracker.isLoading(`${this.entityName()}.delete`),
      },
    }));
  }

  async deleteSelected(ids: string[]) {
    if (ids.length > 0) {
      await this.deleteEntities()(ids);
      this.selection.set([]);
      this.lazyRows.reload();
    }
  }

  openEditEntityPage(ids: string[] = []) {
    this.router.navigate(['editor'], {
      relativeTo: this.route,
      queryParams: ids.length > 0 ? { ids: joinRouteIds(ids) } : undefined,
    });
  }
}
