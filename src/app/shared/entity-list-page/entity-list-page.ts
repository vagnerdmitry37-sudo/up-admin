import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { EditActionsService } from '@core/edit-actions.service';
import { TableColumn } from '@shared/data-table/data-table';
import { LazyRows, RowsPageLoader } from '@shared/data-table/lazy-rows';
import { EntityTable } from '@shared/entity-table/entity-table';
import { joinRouteIds } from '@shared/route-ids/route-ids';

@Component({
  selector: 'app-entity-list-page',
  imports: [EntityTable],
  templateUrl: './entity-list-page.html',
  styleUrl: './entity-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityListPage<T extends { id: string }> implements OnInit {
  private readonly router = inject(Router);

  readonly loadPage = input.required<RowsPageLoader<T>>();
  readonly columns = input.required<TableColumn<T>[]>();
  readonly editPath = input.required<string>();
  readonly entityName = input.required<string>();

  protected readonly lazyRows = computed(() => new LazyRows<T>(this.loadPage()));

  constructor() {
    inject(EditActionsService).register({
      actions: () => ({
        create: { click: () => this.open([]), suggested: this.lazyRows().empty() },
      }),
    });
  }

  ngOnInit() {
    this.lazyRows().reload();
  }

  protected readonly open = (ids: string[]) =>
    this.router.navigate([this.editPath()], {
      queryParams: ids.length > 0 ? { ids: joinRouteIds(ids) } : undefined,
    });
}
