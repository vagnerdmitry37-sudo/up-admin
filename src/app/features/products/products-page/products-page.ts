import { DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Product } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { TableModule } from '@openng/optimus-ui/table';

@Component({
  selector: 'app-products-page',
  imports: [DecimalPipe, TableModule],
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  private readonly url = `${inject(API_BASE_URL)}/products`;
  private readonly router = inject(Router);

  protected readonly products = httpResource<Product[]>(() => this.url);
  protected readonly selected = signal<Product | undefined>(undefined);

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
