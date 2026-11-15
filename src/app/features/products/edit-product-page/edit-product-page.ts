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
import { ProductTabs, ProductTabValue } from '../product-tabs/product-tabs';
import { ProductsService } from '../products.service';
import { SaveStatuses, markSaving, showResult } from '../save-statuses';

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
    markSaving(this.productImageStatuses, [productId]);
    try {
      await this.productsService.deleteImages(imageIds);
      this.tabs()?.clearSavedImageSelection(productId);
      showResult(this.productImageStatuses, productId, 'saved');
      this.images.reload();
    } catch (error) {
      showResult(this.productImageStatuses, productId, 'failed');
      throw error;
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
    markSaving(
      this.productFormStatuses,
      changed.map(({ product }) => product.id),
    );
    markSaving(
      this.productImageStatuses,
      withImages.map(({ product }) => product.id),
    );
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
    try {
      await this.productsService.update(
        changed.map(({ product, value }) => ({ ...value, id: product.id })),
      );
      for (const { product } of changed) {
        this.tabs()?.markSaved(product.id);
        showResult(this.productFormStatuses, product.id, 'saved');
      }
    } catch (error) {
      for (const { product } of changed) {
        showResult(this.productFormStatuses, product.id, 'failed');
      }
      throw error;
    }
  }

  private async saveImages({ product, images, imageOrder }: ProductTabValue): Promise<void> {
    try {
      if (imageOrder) {
        await this.productsService.updateImageOrder(product.id, imageOrder);
      }
      if (images.length) {
        await this.productsService.uploadImages(product.id, images);
        this.tabs()?.clearPendingImages(product.id);
      }
      showResult(this.productImageStatuses, product.id, 'saved');
    } catch (error) {
      showResult(this.productImageStatuses, product.id, 'failed');
      throw error;
    }
  }
}
