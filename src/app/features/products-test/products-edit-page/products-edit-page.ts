import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EntityEditPage } from '@shared/entity-test/entity-edit-page/entity-edit-page';

@Component({
  selector: 'app-products-edit-page',
  imports: [EntityEditPage],
  templateUrl: './products-edit-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsEditPage {

}
