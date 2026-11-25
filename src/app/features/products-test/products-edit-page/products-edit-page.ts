import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { EntityEditPage } from '@shared/entity-test/entity-edit-page/entity-edit-page';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-products-edit-page',
  imports: [EntityEditPage],
  templateUrl: './products-edit-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsEditPage {
  readonly ids = input<string>();

  protected readonly loadProducts = inject(ProductsService).get;
}
