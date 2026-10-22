import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { TableModule } from '@openng/optimus-ui/table';

export interface TableColumn<T> {
  header: string;
  value: (row: T) => string | number;
  align?: 'start' | 'end';
}

@Component({
  selector: 'app-data-table',
  imports: [TableModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable<T> {
  readonly rows = input.required<T[]>();
  readonly columns = input.required<TableColumn<T>[]>();
  readonly dataKey = input('id');
  readonly selection = model<T>();
}
