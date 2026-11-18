import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Customer } from '@core/api/models';
import { parseRouteIds } from '@shared/route-ids/route-ids';
import { EntityTabs } from '@shared/entity-tabs/entity-tabs';
import { CustomerForm } from '../customer-form/customer-form';
import { CustomersService } from '../customers.service';

@Component({
  selector: 'app-edit-customer-page',
  imports: [EntityTabs, CustomerForm],
  templateUrl: './edit-customer-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditCustomerPage {
  readonly ids = input<string>();

  private readonly customersService = inject(CustomersService);

  protected readonly customers = rxResource({
    params: () => {
      const ids = this.ids();
      return ids ? parseRouteIds(ids) : undefined;
    },
    stream: ({ params }) => this.customersService.get(params),
  });
  protected readonly customerName = (customer: Customer) => customer.name;
}
