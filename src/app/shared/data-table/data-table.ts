import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { TableModule } from '@openng/optimus-ui/table';
import { TableLazyLoadEvent } from '@openng/optimus-ui/types/table';

const ROW_HEIGHT = 49;

export interface TableColumn<T> {
  header: string;
  value: (row: T) => string | number;
  align?: 'start' | 'end';
}

export interface TableRange {
  first: number;
  rows: number;
}

@Component({
  selector: 'app-data-table',
  imports: [TableModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.lazy]': 'lazy()' },
})
export class DataTable<T extends object> {
  readonly rows = input.required<(T | undefined)[]>();
  readonly columns = input.required<TableColumn<T>[]>();
  readonly dataKey = input('id');
  readonly loading = input(false);
  readonly lazy = input(false);
  readonly selection = model<T[]>([]);
  readonly lazyLoad = output<TableRange>();

  protected readonly rowHeight = ROW_HEIGHT;

  protected loadRange({ first, rows }: TableLazyLoadEvent) {
    if (rows) {
      this.lazyLoad.emit({ first: first ?? 0, rows });
    }
  }
}
