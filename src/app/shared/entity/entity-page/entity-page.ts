import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { Router } from '@angular/router';
import { AppMessageService } from '@core/app-message.service';
import { ActivityEntity, HttpActivity } from '@core/http-activity.service';
import { TableColumn } from '@shared/data-table/data-table';
import { RowsPageLoader, lazyRows } from '@shared/data-table/lazy-rows';
import { EntityTable } from '@shared/entity/entity-table/entity-table';
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
  private readonly messageService = inject(AppMessageService);
  private readonly httpActivity = inject(HttpActivity);

  readonly loadPage = input.required<RowsPageLoader<T>>();
  readonly deleteEntities = input.required<(ids: string[]) => Promise<unknown>>();
  readonly columns = input.required<TableColumn<T>[]>();
  readonly editPath = input.required<string>();
  readonly entityName = input.required<ActivityEntity>();

  readonly selection = model<T[]>([]);
  protected readonly lazyRows = lazyRows<T>(this.loadPage);
  protected readonly loading = computed(() =>
    this.httpActivity.isRunning({ kind: 'request', entity: this.entityName(), method: 'GET' }),
  );
  protected readonly selectedIds = computed(() => this.selection().map((row) => row.id));

  constructor() {
    inject(ActionService).register({
      edit: { run: () => this.openEditEntityPage(this.selectedIds()) },
      create: { run: () => this.openEditEntityPage([]) },
      delete: { run: () => this.delete(this.selectedIds()) },
    });
  }

  protected readonly openEditEntityPage = (ids: string[]) =>
    this.router.navigate([this.editPath()], {
      queryParams: ids.length > 0 ? { ids: joinRouteIds(ids) } : undefined,
    });

  private readonly showLoadError = () =>
    this.messageService.error(
      `The ${this.entityName()}s could not be loaded`,
      'Reload the page to try again.',
    );

  protected readonly delete = async (ids: string[]) => {
    await this.deleteEntities()(ids);
    this.selection.set([]);
    this.lazyRows.reload();
  };
}
