import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Product } from '@core/api/models';
import { ProductsService } from '@features/products/products.service';
import { parseRouteIds } from '@shared/route-ids/route-ids';
import { EntityTabs } from '@tests/shared/entity-tabs/entity-tabs';

@Component({
  selector: 'app-edit-product-page',
  imports: [EntityTabs],
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
  protected readonly productName = (product: Product) => product.name;
}
