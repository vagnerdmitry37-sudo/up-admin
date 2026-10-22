import { DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import { Product } from '@core/api/models';
import { TableModule } from '@openng/optimus-ui/table';
import { ProductForm, ProductFormValue } from '../product-form/product-form';
import { ProductsService } from '../products.service';
import { EditActionsService } from '@core/edit-actions.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-products-page',
  imports: [DecimalPipe, TableModule, ProductForm],
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  private readonly url = `${inject(API_BASE_URL)}/products`;
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly saving = signal(false);

  protected readonly products = httpResource<Product[]>(() => this.url);
  protected readonly selected = signal<Product | undefined>(undefined);

  constructor() {
    inject(EditActionsService).register(() => {
      const product = this.selected();
      return {
        create: () => this.router.navigate(['/products/new']),
        ...(product && { edit: () => this.router.navigate(['/products', product.id, 'edit']) }),
      };
    });
  }

  protected async create(value: ProductFormValue): Promise<void> {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    await this.productsService.create({ ...value, attributes: {} });
    this.saving.set(false);
    this.products.reload();
  }
}
