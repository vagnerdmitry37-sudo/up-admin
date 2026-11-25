import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EntityEditPage } from '@shared/entity-test/entity-edit-page/entity-edit-page';

@Component({
  selector: 'app-orders-edit-page',
  imports: [EntityEditPage],
  templateUrl: './orders-edit-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersEditPage {}
