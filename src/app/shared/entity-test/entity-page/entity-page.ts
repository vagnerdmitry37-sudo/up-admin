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
  protected readonly selectedIds = computed(() => this.selection().map(({ id }) => id));

  constructor() {
    inject(ActionService).register({
      edit: { run: () => this.openEditEntityPage(this.selectedIds()) },
      create: { run: () => this.openEditEntityPage() },
      delete: { run: () => this.deleteSelected(this.selectedIds()) },
    });
  }

  async deleteSelected (ids: string[]) {
    if (ids.length > 0) {
      await this.deleteEntities()(ids);
      this.selection.set([]);
      this.lazyRows.reload();
    }
  };

  openEditEntityPage(ids: string[] = []) {
    this.router.navigate([this.editPath()], {
      queryParams: ids.length > 0 ? { ids: joinRouteIds(ids) } : undefined,
    });
  }
}
