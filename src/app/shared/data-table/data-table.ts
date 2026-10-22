import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { Skeleton } from '@openng/optimus-ui/skeleton';
import { TableModule } from '@openng/optimus-ui/table';

const PLACEHOLDER_ROW_COUNT = 5;

export interface TableColumn<T> {
  header: string;
  value: (row: T) => string | number;
  align?: 'start' | 'end';
}

@Component({
  selector: 'app-data-table',
  imports: [TableModule, Skeleton],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable<T extends object> {
  readonly rows = input.required<T[]>();
  readonly columns = input.required<TableColumn<T>[]>();
  readonly dataKey = input('id');
  readonly loading = input(false);
  readonly selection = model<T[]>([]);

  protected readonly placeholderRows = Array.from({ length: PLACEHOLDER_ROW_COUNT }, () => ({}));
}
