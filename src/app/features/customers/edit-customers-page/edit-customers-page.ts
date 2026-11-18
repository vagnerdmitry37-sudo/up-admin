import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Customer } from '@core/api/models';
import { EntityEditPage } from '@shared/entity-edit-page/entity-edit-page';
import { CustomerForm, CustomerFormValue } from '../customer-form/customer-form';
import { CustomersService } from '../customers.service';

@Component({
  selector: 'app-edit-customers-page',
  imports: [EntityEditPage, CustomerForm],
  templateUrl: './edit-customers-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditCustomersPage {
  readonly ids = input<string>();

  private readonly customersService = inject(CustomersService);

  protected readonly loadCustomers = this.customersService.get;
  protected readonly customerName = (customer: Customer) => customer.name;
  protected readonly createCustomer = (customer: CustomerFormValue) =>
    this.customersService.create(customer);
}
