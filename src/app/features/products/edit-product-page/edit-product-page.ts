import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
  viewChildren,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { UpdateProductRequest } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@openng/optimus-ui/tabs';
import { ProductForm } from '../product-form/product-form';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-edit-product-page',
  imports: [ProductForm, Tabs, TabList, Tab, TabPanels, TabPanel],
  templateUrl: './edit-product-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProductPage {
  readonly ids = input.required<string>();

  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly forms = viewChildren(ProductForm);
  private readonly saving = signal(false);

  protected readonly products = rxResource({
    params: () => this.ids().split(','),
    stream: ({ params }) => this.productsService.get(params),
  });
  protected readonly inTabs = computed(() => this.ids().split(',').length > 1);
  protected readonly active = linkedSignal(() =>
    this.products.hasValue() ? this.products.value()[0]?.id : undefined,
  );

  constructor() {
    inject(EditActionsService).register(() => ({ save: () => this.saveAll() }));
  }

  private async saveAll(): Promise<void> {
    if (this.saving() || !this.products.hasValue()) {
      return;
    }
    const requests: UpdateProductRequest[] = [];
    for (const product of this.products.value()) {
      const form = this.forms().find((candidate) => candidate.product()?.id === product.id);
      const value = form ? form.validValue() : product;
      if (!value) {
        this.active.set(product.id);
        return;
      }
      requests.push({ ...value, id: product.id, attributes: {} });
    }
    this.saving.set(true);
    try {
      await this.productsService.update(requests);
      await this.router.navigateByUrl('/products');
    } finally {
      this.saving.set(false);
    }
  }
}
