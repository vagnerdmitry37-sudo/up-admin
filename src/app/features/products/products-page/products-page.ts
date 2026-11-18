import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '@core/api/models';
import { TableColumn } from '@shared/data-table/data-table';
import { LazyRows } from '@shared/data-table/lazy-rows';
import { joinRouteIds } from '@shared/route-ids/route-ids';
import { EntityTable } from '@shared/entity-table/entity-table';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-products-page',
  imports: [EntityTable],
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage implements OnInit {
  private readonly router = inject(Router);

  protected readonly lazyRows = new LazyRows<Product>(inject(ProductsService).list);
  protected readonly columns: TableColumn<Product>[] = [
    { header: 'Name', value: (product) => product.name },
    { header: 'Type', value: (product) => product.typeLabel },
    { header: 'Price', value: (product) => product.price, align: 'end' },
  ];

  ngOnInit() {
    this.lazyRows.reload();
  }

  protected openProducts = (ids: string[]) =>
    this.router.navigate(['/product'], {
      queryParams: ids.length > 0 ? { ids: joinRouteIds(ids) } : undefined,
    });
}
