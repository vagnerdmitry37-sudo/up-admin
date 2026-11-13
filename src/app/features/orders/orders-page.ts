import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageTitle } from '@shared/page-title/page-title';

@Component({
  selector: 'app-orders-page',
  imports: [PageTitle],
  templateUrl: './orders-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage {}
