import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Product } from '@core/api/models';
import { TableColumn } from '@shared/data-table/data-table';
import { EntityPage } from '@shared/entity/entity-page/entity-page';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-products-page',
  imports: [EntityPage],
  templateUrl: './products-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  readonly productsService = inject(ProductsService);

  protected readonly columns: TableColumn<Product>[] = [
    { header: 'Name', value: (product) => product.name },
    { header: 'Type', value: (product) => product.type },
    { header: 'Price', value: (product) => product.price, align: 'end' },
  ];
}
