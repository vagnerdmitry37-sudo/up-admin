import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppMessageService } from '@core/app-message.service';
import { ActionMenuService } from '@core/action-menu.service';
import { ActivityEntity, HttpActivity } from '@core/http-activity.service';
import { TableColumn } from '@shared/data-table/data-table';
import { RowsPageLoader, lazyRows } from '@shared/data-table/lazy-rows';
import { EntityTable } from '@shared/entity-table/entity-table';
import { joinRouteIds } from '@shared/route-ids/route-ids';

@Component({
  selector: 'app-entity-list-page',
  imports: [EntityTable],
  templateUrl: './entity-list-page.html',
  styleUrl: './entity-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityListPage<T extends { id: string }> {
  private readonly router = inject(Router);
  private readonly messageService = inject(AppMessageService);
  private readonly httpActivity = inject(HttpActivity);

  readonly loadPage = input.required<RowsPageLoader<T>>();
  readonly deleteEntities = input.required<(ids: string[]) => Promise<unknown>>();
  readonly columns = input.required<TableColumn<T>[]>();
  readonly editPath = input.required<string>();
  readonly entityName = input.required<ActivityEntity>();

  protected readonly lazyRows = lazyRows<T>({
    loadPage: () => this.loadPage(),
    onFirstPageError: () => this.showLoadError(),
  });
  protected readonly selection = signal<T[]>([]);
  protected readonly loading = computed(() =>
    this.httpActivity.isRunning({ kind: 'request', entity: this.entityName(), method: 'GET' }),
  );

  constructor() {
    inject(ActionMenuService).register({
      entity: this.entityName,
      actions: () => ({
        create: { click: () => this.open([]), suggested: this.lazyRows.empty() },
      }),
    });
  }

  protected readonly open = (ids: string[]) =>
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
