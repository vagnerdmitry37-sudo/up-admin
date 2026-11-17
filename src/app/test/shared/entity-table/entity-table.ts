import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DataTable, TableColumn, TableRange } from '@shared/data-table/data-table';

@Component({
  selector: 'app-entity-table',
  imports: [DataTable],
  templateUrl: './entity-table.html',
  styleUrl: './entity-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityTable<T extends object> {
  readonly rows = input.required<(T | undefined)[]>();
  readonly columns = input.required<TableColumn<T>[]>();
  readonly loading = input(false);
  readonly lazy = input(false);
  readonly lazyLoad = output<TableRange>();
}
