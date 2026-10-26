import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  viewChildren,
} from '@angular/core';
import { Product } from '@core/api/models';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@openng/optimus-ui/tabs';
import { ProductForm, ProductFormValue } from '../product-form/product-form';

export interface ProductTabValue {
  product: Product;
  value: ProductFormValue;
}

const toFormValue = ({ type, name, description, price }: Product): ProductFormValue => ({
  type,
  name,
  description,
  price,
});

@Component({
  selector: 'app-product-tabs',
  imports: [ProductForm, Tabs, TabList, Tab, TabPanels, TabPanel],
  templateUrl: './product-tabs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTabs {
  readonly products = input.required<Product[]>();
  readonly heading = input.required<string>();

  private readonly forms = viewChildren(ProductForm);

  protected readonly inTabs = computed(() => this.products().length > 1);
  protected readonly active = linkedSignal(() => this.products()[0]?.id);

  values(): ProductTabValue[] | undefined {
    const values: ProductTabValue[] = [];
    for (const product of this.products()) {
      const form = this.forms().find((candidate) => candidate.product() === product);
      const value = form ? form.validValue() : toFormValue(product);
      if (!value) {
        this.active.set(product.id);
        return undefined;
      }
      values.push({ product, value });
    }
    return values;
  }
}
