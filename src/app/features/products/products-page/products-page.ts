import { formatNumber } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Product } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { DataTable, TableColumn } from '@shared/data-table/data-table';

@Component({
  selector: 'app-products-page',
  imports: [DataTable],
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  private readonly url = `${inject(API_BASE_URL)}/products`;
  private readonly router = inject(Router);
  private readonly locale = inject(LOCALE_ID);

  protected readonly products = httpResource<Product[]>(() => this.url);
  protected readonly rows = computed(() => (this.products.hasValue() ? this.products.value() : []));
  protected readonly selected = signal<Product[]>([]);
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
          create: { press: () => this.create(ids) },
          edit: { press: () => this.edit(ids), visible: ids.length > 0 },
        };
      },
      suggested: () =>
        this.products.hasValue() && this.products.value().length === 0 ? 'create' : undefined,
    });
  }

  private create(ids: string[]) {
    const queryParams = ids.length > 0 ? { from: ids.join(',') } : undefined;
    this.router.navigate(['/products/new'], { queryParams });
  }

  private edit = (ids: string[]) => this.router.navigate(['/products', ids.join(','), 'edit']);
}
