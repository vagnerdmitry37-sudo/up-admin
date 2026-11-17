import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Product } from '@core/api/models';
import { ProductsService } from '@features/products/products.service';
import { TableColumn } from '@shared/data-table/data-table';
import { parseRouteIds } from '@shared/route-ids/route-ids';
import { EntityTable } from '@tests/shared/entity-table/entity-table';

@Component({
  selector: 'app-test-product-page',
  imports: [EntityTable],
  templateUrl: './product-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductPage {
  readonly ids = input<string>();

  private readonly productsService = inject(ProductsService);

  protected readonly products = rxResource({
    params: () => {
      const ids = this.ids();
      return ids ? parseRouteIds(ids) : undefined;
    },
    stream: ({ params }) => this.productsService.get(params),
  });
  protected readonly rows = computed(() => (this.products.hasValue() ? this.products.value() : []));

  protected readonly columns: TableColumn<Product>[] = [
    { header: 'Name', value: (product) => product.name },
    { header: 'Type', value: (product) => product.typeLabel },
    { header: 'Price', value: (product) => product.price, align: 'end' },
  ];
}
