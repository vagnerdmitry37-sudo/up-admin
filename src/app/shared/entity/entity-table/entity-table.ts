import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { DataTable, TableColumn, TableRange } from '@shared/data-table/data-table';

@Component({
  selector: 'app-entity-table',
  imports: [DataTable],
  templateUrl: './entity-table.html',
  styleUrl: './entity-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityTable<T extends { id: string }> {
  readonly rows = input.required<(T | undefined)[]>();
  readonly columns = input.required<TableColumn<T>[]>();
  readonly lazy = input(false);
  readonly loading = input(false);
  readonly selection = model<T[]>([]);
  readonly lazyLoad = output<TableRange>();
}
