import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { EditActionsService } from '@core/edit-actions.service';
import { ProductForm, ProductFormValue } from '../product-form/product-form';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-new-product-page',
  imports: [ProductForm],
  templateUrl: './new-product-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewProductPage {
  private readonly router = inject(Router);
  private readonly products = inject(ProductsService);
  private readonly form = viewChild.required(ProductForm);
  private readonly saving = signal(false);

  constructor() {
    inject(EditActionsService).register(() => ({ save: () => this.form().save() }));
  }

  protected async create(value: ProductFormValue): Promise<void> {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    await this.products.create([{ ...value, attributes: {} }]);
    await this.router.navigateByUrl('/products');
  }
}
