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
import { CreateProductRequest, Product } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { ProductForm, ProductFormValue } from '../product-form/product-form';
import { ProductTabs } from '../product-tabs/product-tabs';
import {
  SaveStatuses,
  afterResultsShown,
  markSaving,
  saveWithStatus,
  showResult,
} from '@shared/save-zone/save-statuses';
import { parseRouteIds } from '@shared/route-ids/route-ids';
import { ProductsService } from '../products.service';

const NEW_PRODUCT_KEY = 'new';

interface NewProduct {
  key: string;
  request: CreateProductRequest;
  images: File[];
}

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
  protected readonly productTypes = this.productsService.productTypes;
  private readonly form = viewChild(ProductForm);
  private readonly tabs = viewChild(ProductTabs);
  private readonly saving = signal(false);

  protected readonly newProductKey = NEW_PRODUCT_KEY;
  protected readonly productFormStatuses = signal<SaveStatuses>({});
  protected readonly productImageStatuses = signal<SaveStatuses>({});
  protected readonly sources = rxResource({
    params: () => {
      const from = this.from();
      return from ? parseRouteIds(from) : undefined;
    },
    stream: ({ params }) => this.productsService.get(params),
  });
  protected readonly copies = computed(() =>
    this.sources.hasValue()
      ? this.sources.value().map((source) => ({ ...source, name: `${source.name} (copy)` }))
      : undefined,
  );

  private readonly activeForm = computed(() =>
    this.from() ? this.tabs()?.activeForm() : this.form(),
  );

  constructor() {
    inject(EditActionsService).register({
      actions: () => ({
        save: {
          click: () => (this.from() ? this.createCopies() : this.form()?.save()),
          visible: Boolean(this.from()) || Boolean(this.form()?.hasUnsavedChanges()),
        },
        delete: {
          click: () => this.activeForm()?.deleteSelectedImages(),
          visible: !this.saving() && Boolean(this.activeForm()?.selectedImages().length),
        },
      }),
    });
  }

  protected create(value: ProductFormValue): Promise<void> {
    return this.save([
      {
        key: NEW_PRODUCT_KEY,
        request: value,
        images: this.form()?.pendingImages() ?? [],
      },
    ]);
  }

  private createCopies(): Promise<void> | undefined {
    const values = this.tabs()?.values();
    return (
      values &&
      this.save(
        values.map(({ product, value, images }) => ({
          key: product.id,
          request: value,
          images,
        })),
      )
    );
  }

  private async save(products: NewProduct[]): Promise<void> {
    if (this.saving()) {
      return;
    }
    const withImages = products.filter(({ images }) => images.length);
    this.saving.set(true);
    markSaving(
      this.productImageStatuses,
      withImages.map(({ key }) => key),
    );
    let created: Product[] | undefined;
    try {
      created = await this.createProducts(products, withImages);
      const results = await Promise.allSettled(
        products.map((product, index) =>
          product.images.length ? this.uploadImages(product, created![index].id) : undefined,
        ),
      );
      const failure = results.find((result) => result.status === 'rejected');
      if (failure) {
        throw failure.reason;
      }
    } finally {
      this.saving.set(false);
      if (created) {
        const ids = created.map(({ id }) => id).join(',');
        afterResultsShown(
          () => void this.router.navigateByUrl(`/products/${ids}/edit`, { replaceUrl: true }),
        );
      }
    }
  }

  private async createProducts(
    products: NewProduct[],
    withImages: NewProduct[],
  ): Promise<Product[]> {
    try {
      return await saveWithStatus(
        this.productFormStatuses,
        products.map(({ key }) => key),
        () => this.productsService.create(products.map(({ request }) => request)),
      );
    } catch (error) {
      for (const { key } of withImages) {
        showResult(this.productImageStatuses, key, 'failed');
      }
      throw error;
    }
  }

  private uploadImages = ({ key, images }: NewProduct, productId: string) =>
    saveWithStatus(this.productImageStatuses, [key], () =>
      this.productsService.uploadImages(productId, images),
    );
}
