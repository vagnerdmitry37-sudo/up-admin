import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-orders-page',
  templateUrl: './orders-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage {}
