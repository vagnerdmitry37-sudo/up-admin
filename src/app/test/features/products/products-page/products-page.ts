import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Product } from '@core/api/models';
import { ProductsService } from '@features/products/products.service';
import { TableColumn } from '@shared/data-table/data-table';
import { EntityTable } from '@tests/shared/entity-table/entity-table';
import { LazyRows } from '@shared/data-table/lazy-rows';

@Component({
  selector: 'app-test-products-page',
  imports: [EntityTable],
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage implements OnInit {
  protected readonly lazyRows = new LazyRows<Product>(inject(ProductsService).list);
  protected readonly columns: TableColumn<Product>[] = [
    { header: 'Name', value: (product) => product.name },
    { header: 'Type', value: (product) => product.typeLabel },
    { header: 'Price', value: (product) => product.price, align: 'end' },
  ];

  ngOnInit() {
    this.lazyRows.reload();
  }
}
