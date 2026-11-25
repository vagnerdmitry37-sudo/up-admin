import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Customer } from '@core/api/models';
import { TableColumn } from '@shared/data-table/data-table';
import { EntityPage } from '@shared/entity/entity-page/entity-page';
import { CustomersService } from '../customers.service';

@Component({
  selector: 'app-customers-page',
  imports: [EntityPage],
  templateUrl: './customers-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersPage {
  private readonly customersService = inject(CustomersService);

  protected readonly loadPage = this.customersService.list;
  protected readonly deleteEntities = this.customersService.delete;
  protected readonly columns: TableColumn<Customer>[] = [
    { header: 'Name', value: (customer) => customer.name },
    { header: 'Email', value: (customer) => customer.email },
    { header: 'Phone', value: (customer) => customer.phone },
    { header: 'Created', value: (customer) => customer.createdAt },
  ];
}
