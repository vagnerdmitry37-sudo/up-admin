import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Product } from '@core/api/models';
import { TableColumn } from '@shared/data-table/data-table';
import { EntityListPage } from '@shared/entity-list-page/entity-list-page';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-products-page',
  imports: [EntityListPage],
  templateUrl: './products-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  protected readonly loadPage = inject(ProductsService).list;
  protected readonly columns: TableColumn<Product>[] = [
    { header: 'Name', value: (product) => product.name },
    { header: 'Type', value: (product) => product.typeLabel },
    { header: 'Price', value: (product) => product.price, align: 'end' },
  ];
}
