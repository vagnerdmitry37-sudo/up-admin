import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { EditActionsService } from '@core/edit-actions.service';
import { ConfirmationService } from '@openng/optimus-ui/api';
import { parseRouteIds } from '@shared/route-ids/route-ids';
import { SaveStatuses, saveWithStatus } from '@shared/save-zone/save-statuses';
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

  private readonly productsService = inject(ProductsService);
  private readonly confirmationService = inject(ConfirmationService);
  protected readonly productTypes = this.productsService.productTypes;
  private readonly tabs = viewChild(ProductTabs);
  private readonly saving = signal(false);

  protected readonly productFormStatuses = signal<SaveStatuses>({});
  protected readonly productImageStatuses = signal<SaveStatuses>({});
  protected readonly products = rxResource({
    params: () => parseRouteIds(this.ids()),
    stream: ({ params }) => this.productsService.get(params),
  });
  protected readonly images = rxResource({
    params: () => parseRouteIds(this.ids()),
    stream: ({ params }) => this.productsService.getImages(params),
  });

  constructor() {
    inject(EditActionsService).register({
      actions: () => ({
        save: {
          click: () => this.save(),
          visible: Boolean(this.tabs()?.hasUnsavedChanges()),
        },
        delete: {
          click: () => this.deleteSelectedImages(),
          visible: !this.saving() && this.hasSelectedImages(),
        },
      }),
    });
  }

  private hasSelectedImages(): boolean {
    const form = this.tabs()?.activeForm();
    return Boolean(form?.selectedImages().length || form?.selectedSavedImages().length);
  }

  private deleteSelectedImages(): void {
    const form = this.tabs()?.activeForm();
    const product = form?.product();
    if (!form || !product) {
      return;
    }
    form.deleteSelectedImages();
    const savedImageIds = form.selectedSavedImages().map((image) => image.id);
    if (!savedImageIds.length) {
      return;
    }
    this.confirmationService.confirm({
      header:
        savedImageIds.length === 1 ? 'Delete image?' : `Delete ${savedImageIds.length} images?`,
      message: 'This cannot be undone.',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', text: true },
      accept: () => this.deleteSavedImages(product.id, savedImageIds),
    });
  }

  private async deleteSavedImages(productId: string, imageIds: string[]): Promise<void> {
    this.saving.set(true);
    try {
      await saveWithStatus(this.productImageStatuses, [productId], async () => {
        await this.productsService.deleteImages(imageIds);
        this.tabs()?.clearSavedImageSelection(productId);
      });
      this.images.reload();
    } finally {
      this.saving.set(false);
    }
  }

  private async save(): Promise<void> {
    const values = this.tabs()?.values();
    if (this.saving() || !values) {
      return;
    }
    const changed = values.filter(({ changed }) => changed);
    const withImages = values.filter(({ images, imageOrder }) => images.length || imageOrder);
    if (!changed.length && !withImages.length) {
      return;
    }
    this.saving.set(true);
    const results = await Promise.allSettled([
      this.updateProducts(changed),
      ...withImages.map((value) => this.saveImages(value)),
    ]);
    this.saving.set(false);
    if (withImages.length) {
      this.images.reload();
    }
    const failure = results.find((result) => result.status === 'rejected');
    if (failure) {
      throw failure.reason;
    }
  }

  private async updateProducts(changed: ProductTabValue[]): Promise<void> {
    if (!changed.length) {
      return;
    }
    const ids = changed.map(({ product }) => product.id);
    await saveWithStatus(this.productFormStatuses, ids, async () => {
      await this.productsService.update(
        changed.map(({ product, value }) => ({ ...value, id: product.id })),
      );
      for (const id of ids) {
        this.tabs()?.markSaved(id);
      }
    });
  }

  private saveImages = ({ product, images, imageOrder }: ProductTabValue) =>
    saveWithStatus(this.productImageStatuses, [product.id], async () => {
      if (imageOrder) {
        await this.productsService.updateImageOrder(product.id, imageOrder);
      }
      if (images.length) {
        await this.productsService.uploadImages(product.id, images);
        this.tabs()?.clearPendingImages(product.id);
      }
    });
}
