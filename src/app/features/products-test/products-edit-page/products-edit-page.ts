import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ProductDetails } from '@core/api/models';
import { EntityEditPage } from '@shared/entity-test/entity-edit-page/entity-edit-page';
import { ProductForm } from '../product-form/product-form';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-products-edit-page',
  imports: [EntityEditPage, ProductForm],
  templateUrl: './products-edit-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsEditPage {
  readonly ids = input<string>();

  protected readonly loadProducts = inject(ProductsService).get;
  protected readonly productName = (product: ProductDetails) => product.name;
}
