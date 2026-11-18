import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProductDetails } from '@core/api/models';
import { ImageUpload } from '@shared/image-upload/image-upload';
import { parseRouteIds } from '@shared/route-ids/route-ids';
import { EntityTabs } from '@shared/entity-tabs/entity-tabs';
import { ProductForm } from '../product-form/product-form';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-edit-products-page',
  imports: [EntityTabs, ImageUpload, ProductForm],
  templateUrl: './edit-products-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProductsPage {
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
