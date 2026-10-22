import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Product } from '@core/api/models';
import { ProductForm, ProductFormValue } from '../product-form/product-form';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-edit-product-page',
  imports: [ProductForm],
  templateUrl: './edit-product-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProductPage {
  readonly id = input.required<string>();

  private readonly router = inject(Router);
  private readonly products = inject(ProductsService);
  private readonly url = `${inject(API_BASE_URL)}/products`;
  private readonly saving = signal(false);

  protected readonly product = httpResource<Product>(() => `${this.url}/${this.id()}`);

  protected async update(value: ProductFormValue): Promise<void> {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    await this.products.update(this.id(), {
      ...value,
      attributes: {},
    });
    await this.router.navigateByUrl('/products');
  }
}
