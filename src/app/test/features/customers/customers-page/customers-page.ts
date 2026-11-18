import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Customer } from '@core/api/models';
import { TableColumn } from '@shared/data-table/data-table';
import { LazyRows } from '@shared/data-table/lazy-rows';
import { joinRouteIds } from '@shared/route-ids/route-ids';
import { EntityTable } from '@tests/shared/entity-table/entity-table';
import { CustomersService } from '../customers.service';

@Component({
  selector: 'app-customers-page',
  imports: [EntityTable],
  templateUrl: './customers-page.html',
  styleUrl: './customers-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersPage implements OnInit {
  private readonly router = inject(Router);

  protected readonly lazyRows = new LazyRows<Customer>(inject(CustomersService).list);
  protected readonly columns: TableColumn<Customer>[] = [
    { header: 'Name', value: (customer) => customer.name },
    { header: 'Email', value: (customer) => customer.email },
    { header: 'Phone', value: (customer) => customer.phone },
    { header: 'Created', value: (customer) => customer.createdAt },
  ];

  ngOnInit() {
    this.lazyRows.reload();
  }

  protected createCustomer = () => this.router.navigate(['/customer-new-test']);

  protected editCustomers = (ids: string[]) =>
    this.router.navigate(['/customer-test'], { queryParams: { ids: joinRouteIds(ids) } });
}
