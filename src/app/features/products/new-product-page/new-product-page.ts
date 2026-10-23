import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CreateProductRequest } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { ProductForm, ProductFormValue } from '../product-form/product-form';
import { ProductTabs } from '../product-tabs/product-tabs';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-new-product-page',
  imports: [ProductForm, ProductTabs],
  templateUrl: './new-product-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewProductPage {
  readonly from = input<string>();

  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly form = viewChild(ProductForm);
  private readonly tabs = viewChild(ProductTabs);
  private readonly saving = signal(false);

  protected readonly sources = rxResource({
    params: () => this.from()?.split(','),
    stream: ({ params }) => this.productsService.get(params),
  });
  protected readonly copies = computed(() =>
    this.sources.hasValue()
      ? this.sources.value().map((source) => ({ ...source, name: `${source.name} (copy)` }))
      : undefined,
  );

  constructor() {
    inject(EditActionsService).register({
      actions: () => ({
        create: {
          press: () => this.cancelActive(),
          longPress: () => this.cancelAll(),
          cancel: true,
        },
        save: { press: () => (this.from() ? this.createCopies() : this.form()?.save()) },
      }),
    });
  }

  protected create(value: ProductFormValue): Promise<void> {
    return this.save([{ ...value, attributes: {} }]);
  }

  private cancelActive(): void {
    const stillOpen = this.tabs()?.closeActive() ?? 0;
    if (stillOpen === 0) {
      this.cancelAll();
    }
  }

  private cancelAll = () => this.router.navigateByUrl('/products');

  private createCopies(): Promise<void> | undefined {
    const values = this.tabs()?.values();
    return (
      values &&
      this.save(values.map(({ product, value }) => ({ ...value, attributes: product.attributes })))
    );
  }

  private async save(requests: CreateProductRequest[]): Promise<void> {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    try {
      await this.productsService.create(requests);
      await this.router.navigateByUrl('/products');
    } finally {
      this.saving.set(false);
    }
  }
}
