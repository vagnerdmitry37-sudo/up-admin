import { formatNumber } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '@core/api/models';
import { EditActionConfig, EditActionsService } from '@core/edit-actions.service';
import { DataTable, TableColumn, TableRange } from '@shared/data-table/data-table';
import { finalize } from 'rxjs';
import { ProductsService } from '../products.service';

const PAGE_SIZE = 50;

@Component({
  selector: 'app-products-page',
  imports: [DataTable],
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);
  private readonly locale = inject(LOCALE_ID);

  protected readonly rows = signal<(Product | undefined)[] | undefined>(undefined);
  protected readonly selected = signal<Product[]>([]);
  private readonly pendingRequests = signal(0);
  private readonly pendingRows = new Set<number>();
  protected readonly loading = computed(() => this.pendingRequests() > 0);
  protected readonly columns: TableColumn<Product>[] = [
    { header: 'Name', value: (product) => product.name },
    { header: 'Type', value: (product) => product.type },
    {
      header: 'Price',
      value: (product) => formatNumber(product.price, this.locale, '1.2-2'),
      align: 'end',
    },
  ];

  constructor() {
    inject(EditActionsService).register({
      actions: () => {
        const ids = this.selected().map((product) => product.id);
        return {
          create: this.createAction(ids),
          edit: this.editAction(ids),
        };
      },
    });
  }

  ngOnInit() {
    this.load({ first: 0, rows: PAGE_SIZE });
  }

  protected load(range: TableRange) {
    const missing = this.missingRange(range);
    if (!missing) {
      return;
    }
    const indexes = Array.from({ length: missing.rows }, (_, offset) => missing.first + offset);
    indexes.forEach((index) => this.pendingRows.add(index));
    this.pendingRequests.update((count) => count + 1);
    this.productsService
      .list(missing.first, missing.rows)
      .pipe(
        finalize(() => {
          indexes.forEach((index) => this.pendingRows.delete(index));
          this.pendingRequests.update((count) => count - 1);
        }),
      )
      .subscribe((page) =>
        this.rows.update((current = []) => {
          const next = Array.from({ length: page.totalRecords }, (_, index) => current[index]);
          next.splice(missing.first, page.items.length, ...page.items);
          return next;
        }),
      );
  }

  private missingRange(range: TableRange): TableRange | undefined {
    const rows = this.rows();
    if (!rows) {
      return range;
    }
    const isAvailable = rows
      .slice(range.first, range.first + range.rows)
      .map((row, offset) => Boolean(row) || this.pendingRows.has(range.first + offset));
    const start = isAvailable.indexOf(false);
    if (start === -1) {
      return undefined;
    }
    return { first: range.first + start, rows: isAvailable.lastIndexOf(false) - start + 1 };
  }

  private createAction(ids: string[]): EditActionConfig {
    const queryParams = ids.length > 0 ? { from: ids.join(',') } : undefined;

    return {
      click: () => this.router.navigate(['/products/new'], { queryParams }),
      suggested: this.rows()?.length === 0,
    };
  }

  private editAction(ids: string[]): EditActionConfig {
    return {
      click: () => this.router.navigate(['/products', ids.join(','), 'edit']),
      visible: ids.length > 0,
    };
  }
}
