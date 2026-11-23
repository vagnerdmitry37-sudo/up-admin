import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChild,
  input,
  model,
  output,
} from '@angular/core';
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
  imports: [NgTemplateOutlet, TableModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.lazy]': 'lazy()',
    '[style.height.px]': 'lazy() ? contentHeight() : null',
  },
})
export class DataTable<T extends object> {
  readonly rows = input.required<(T | undefined)[]>();
  readonly columns = input.required<TableColumn<T>[]>();
  readonly dataKey = input('id');
  readonly lazy = input(false);
  readonly loading = input(false);
  readonly selection = model<T[]>([]);
  readonly lazyLoad = output<TableRange>();

  protected readonly rowHeight = ROW_HEIGHT;
  protected readonly footerTemplate = contentChild<TemplateRef<unknown>>('footer');
  protected readonly fixedTableLayout = { 'table-layout': 'fixed', width: '100%' };
  protected readonly contentHeight = computed(() => {
    const headerAndFooterRows = this.footerTemplate() ? 2 : 1;
    const bodyRows = Math.max(this.rows().length, this.loading() ? 1 : 0);
    return (bodyRows + headerAndFooterRows) * ROW_HEIGHT;
  });
  protected readonly trackRow = (index: number, row: T | undefined) => row ?? index;

  protected loadRange({ first, rows }: TableLazyLoadEvent) {
    if (rows) {
      this.lazyLoad.emit({ first: first ?? 0, rows });
    }
  }
}
