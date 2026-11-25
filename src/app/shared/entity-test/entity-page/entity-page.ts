import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { Router } from '@angular/router';
import { ActivityEntity } from '@core/http-activity.service';
import { TableColumn } from '@shared/data-table/data-table';
import { lazyRows, RowsPageLoader } from '@shared/data-table/lazy-rows';
import { EntityTable } from '@shared/entity-test/entity-table/entity-table';
import { joinRouteIds } from '@shared/route-ids/route-ids';
import { ActionService } from '@shared/actions/action.service';

@Component({
  selector: 'app-entity-page',
  imports: [EntityTable],
  templateUrl: './entity-page.html',
  styleUrl: './entity-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityPage<T extends { id: string }> {
  private readonly router = inject(Router);

  readonly loadPage = input.required<RowsPageLoader<T>>();
  readonly columns = input.required<TableColumn<T>[]>();
  readonly editPath = input.required<string>();
  readonly entityName = input.required<ActivityEntity>();
  readonly deleteEntities = input.required<(ids: string[]) => Promise<void>>();

  readonly selection = model<T[]>([]);
  protected readonly lazyRows = lazyRows<T>(this.loadPage);
  protected readonly selectedIds = computed(() => this.selection().map((row) => row.id));

  constructor() {
    inject(ActionService).register({
      edit: { run: () => this.openEditEntityPage() },
      create: { run: () => this.openEditEntityPage() },
      delete: { run: () => this.deleteSelected() },
    });
  }

  async deleteSelected () {
    const ids = this.selectedIds();
    if (ids.length > 0) {
      await this.deleteEntities()(ids);
      this.selection.set([]);
      this.lazyRows.reload();
    }
  };

  openEditEntityPage() {
    const ids = this.selectedIds();
    this.router.navigate([this.editPath()], {
      queryParams: ids.length > 0 ? { ids: joinRouteIds(ids) } : undefined,
    });
  }
}
