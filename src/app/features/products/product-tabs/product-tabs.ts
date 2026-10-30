import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  viewChildren,
} from '@angular/core';
import { Image, Product } from '@core/api/models';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@openng/optimus-ui/tabs';
import { SaveStatus } from '@shared/save-zone/save-zone';
import { ProductForm, ProductFormValue } from '../product-form/product-form';

export interface ProductTabValue {
  product: Product;
  value: ProductFormValue;
  changed: boolean;
  images: File[];
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
  readonly images = input<Image[]>([]);
  readonly productFormStatuses = input<Record<string, SaveStatus>>({});
  readonly productImageStatuses = input<Record<string, SaveStatus>>({});

  private readonly forms = viewChildren(ProductForm);

  protected readonly inTabs = computed(() => this.products().length > 1);
  protected readonly active = linkedSignal(() => this.products()[0]?.id);
  protected readonly imagesByProduct = computed(() => {
    const byProduct = new Map<string, Image[]>();
    for (const image of this.images()) {
      byProduct.set(image.entityId, [...(byProduct.get(image.entityId) ?? []), image]);
    }
    return byProduct;
  });

  readonly activeForm = computed(() =>
    this.forms().find((form) => form.product()?.id === this.active()),
  );

  readonly hasUnsavedChanges = computed(() =>
    this.forms().some((form) => form.hasUnsavedChanges()),
  );

  clearPendingImages = (productId: string) => this.formOf(productId)?.clearPendingImages();

  markSaved = (productId: string) => this.formOf(productId)?.markSaved();

  values(): ProductTabValue[] | undefined {
    const values: ProductTabValue[] = [];
    for (const product of this.products()) {
      const form = this.forms().find((candidate) => candidate.product() === product);
      const value = form ? form.validValue() : toFormValue(product);
      if (!value) {
        this.active.set(product.id);
        return undefined;
      }
      values.push({
        product,
        value,
        changed: Boolean(form?.hasChanges()),
        images: form ? form.pendingImages() : [],
      });
    }
    return values;
  }

  private formOf(productId: string): ProductForm | undefined {
    return this.forms().find((form) => form.product()?.id === productId);
  }
}
