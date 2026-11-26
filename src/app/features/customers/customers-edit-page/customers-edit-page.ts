import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Customer } from '@core/api/models';
import { EntityEditPage } from '@shared/entity-test/entity-edit-page/entity-edit-page';
import { CustomerForm } from '../customer-form/customer-form';
import { CustomersService } from '../customers.service';

@Component({
  selector: 'app-customers-edit-page',
  imports: [EntityEditPage, CustomerForm],
  templateUrl: './customers-edit-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersEditPage {
  readonly ids = input<string>();

  protected readonly loadCustomers = inject(CustomersService).get;
  protected readonly customerName = (customer: Customer) => customer.name;
}
