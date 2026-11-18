import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProductDetails } from '@core/api/models';
import { ProductsService } from '@features/products/products.service';
import { ImageUpload } from '@shared/image-upload/image-upload';
import { parseRouteIds } from '@shared/route-ids/route-ids';
import { EntityTabs } from '@tests/shared/entity-tabs/entity-tabs';
import { ProductForm } from '../product-form/product-form';

@Component({
  selector: 'app-edit-product-page',
  imports: [EntityTabs, ImageUpload, ProductForm],
  templateUrl: './edit-product-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProductPage {
  readonly ids = input<string>();

  private readonly productsService = inject(ProductsService);

  protected readonly products = rxResource({
    params: () => {
      const ids = this.ids();
      return ids ? parseRouteIds(ids) : undefined;
    },
    stream: ({ params }) => this.productsService.get(params),
  });
  protected readonly productTypes = this.productsService.productTypes;
  protected readonly productName = (product: ProductDetails) => product.name;
}
