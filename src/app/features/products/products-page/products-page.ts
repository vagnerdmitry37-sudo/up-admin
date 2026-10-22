import { formatNumber } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, LOCALE_ID, inject, signal } from '@angular/core';
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
  protected readonly selected = signal<Product | undefined>(undefined);
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
    inject(EditActionsService).register(
      () => {
        const product = this.selected();
        return {
          create: () => this.router.navigate(['/products/new']),
          ...(product && { edit: () => this.router.navigate(['/products', product.id, 'edit']) }),
        };
      },
      () => (this.products.hasValue() && this.products.value().length === 0 ? 'create' : undefined),
    );
  }
}
