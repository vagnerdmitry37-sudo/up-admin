import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Customer } from '@core/api/models';
import { TableColumn } from '@shared/data-table/data-table';
import { EntityListPage } from '@shared/entity-list-page/entity-list-page';
import { CustomersService } from '../customers.service';

@Component({
  selector: 'app-customers-page',
  imports: [EntityListPage],
  templateUrl: './customers-page.html',
  styleUrl: './customers-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersPage {
  protected readonly loadPage = inject(CustomersService).list;
  protected readonly columns: TableColumn<Customer>[] = [
    { header: 'Name', value: (customer) => customer.name },
    { header: 'Email', value: (customer) => customer.email },
    { header: 'Phone', value: (customer) => customer.phone },
    { header: 'Created', value: (customer) => customer.createdAt },
  ];
}
