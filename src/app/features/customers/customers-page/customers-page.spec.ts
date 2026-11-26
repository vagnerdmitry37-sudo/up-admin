import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Customer } from '@core/api/models';
import { httpActivityInterceptor } from '@core/http-activity.interceptor';
import { MessageService } from '@openng/optimus-ui/api';
import { EntityTable } from '@shared/entity/entity-table/entity-table';
import { CustomersPage } from './customers-page';

const customer = (id: string): Customer => ({
  id,
  name: `Customer ${id}`,
  email: `${id}@example.com`,
  phone: '+100',
  createdAt: '2026-01-01T00:00:00Z',
});

describe('CustomersPage', () => {
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpActivityInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api' },
        MessageService,
      ],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  const expectFirstPage = () =>
    httpTestingController.expectOne(
      (request) =>
        request.method === 'GET' &&
        request.url === '/api/customers' &&
        request.params.get('first') === '0' &&
        request.params.get('rows') === '50',
    );

  const text = (fixture: ComponentFixture<CustomersPage>) =>
    (fixture.nativeElement as HTMLElement).textContent;

  it('shows the table with its loading spinner until the first customers arrive', async () => {
    const fixture = TestBed.createComponent(CustomersPage);
    fixture.detectChanges();
    await fixture.whenStable();
    const spinner = () => (fixture.nativeElement as HTMLElement).querySelector('.p-datatable-mask');

    expect(spinner()).not.toBeNull();
    expect(text(fixture)).not.toContain('No customers yet');

    expectFirstPage().flush({ items: [customer('c1')], totalRecords: 1 });
    await fixture.whenStable();

    expect(spinner()).toBeNull();
  });

  it('reports a failed first load in a toast and shows an empty table instead of the empty state', async () => {
    const add = vi.spyOn(TestBed.inject(MessageService), 'add');
    const fixture = TestBed.createComponent(CustomersPage);
    fixture.detectChanges();

    expectFirstPage().flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'The customers could not be loaded' }),
    );
    expect(text(fixture)).not.toContain('No customers yet');
    expect(fixture.debugElement.query(By.directive(EntityTable))).not.toBeNull();
  });
});
