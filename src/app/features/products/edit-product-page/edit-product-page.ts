import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EditActionsService } from '@core/edit-actions.service';
import { ProductTabs, ProductTabValue } from '../product-tabs/product-tabs';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-edit-product-page',
  imports: [ProductTabs],
  templateUrl: './edit-product-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProductPage {
  readonly ids = input.required<string>();

  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly tabs = viewChild(ProductTabs);
  private readonly saving = signal(false);

  protected readonly products = rxResource({
    params: () => this.ids().split(','),
    stream: ({ params }) => this.productsService.get(params),
  });
  protected readonly images = rxResource({
    params: () => this.ids().split(','),
    stream: ({ params }) => this.productsService.getImages(params),
  });

  constructor() {
    inject(EditActionsService).register({
      actions: () => ({
        save: { click: () => this.save() },
        delete: {
          click: () => this.tabs()?.activeForm()?.deleteSelectedImages(),
          visible: Boolean(this.tabs()?.activeForm()?.selectedImages().length),
        },
      }),
    });
  }

  private async save(): Promise<void> {
    const values = this.tabs()?.values();
    if (this.saving() || !values) {
      return;
    }
    this.saving.set(true);
    try {
      await this.productsService.update(
        values.map(({ product, value }) => ({ ...value, id: product.id, attributes: {} })),
      );
      await this.uploadImages(values);
      await this.router.navigateByUrl('/products');
    } finally {
      this.saving.set(false);
    }
  }

  private async uploadImages(values: ProductTabValue[]) {
    for (const { product, images } of values) {
      if (images.length) {
        await this.productsService.uploadImages(product.id, images);
      }
    }
  }
}
