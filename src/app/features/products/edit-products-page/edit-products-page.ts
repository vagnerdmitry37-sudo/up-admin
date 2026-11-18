import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ProductDetails } from '@core/api/models';
import { EntityEditPage } from '@shared/entity-edit-page/entity-edit-page';
import { ImageUpload } from '@shared/image-upload/image-upload';
import { ProductForm, ProductFormValue } from '../product-form/product-form';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-edit-products-page',
  imports: [EntityEditPage, ImageUpload, ProductForm],
  templateUrl: './edit-products-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProductsPage {
  readonly ids = input<string>();

  private readonly productsService = inject(ProductsService);

  protected readonly loadProducts = this.productsService.get;
  protected readonly productTypes = this.productsService.productTypes;
  protected readonly productName = (product: ProductDetails) => product.name;
  protected readonly createProduct = async (product: Omit<ProductFormValue, 'attributes'>) => {
    const [created] = await this.productsService.create([{ ...product, attributes: {} }]);
    return created;
  };
}
