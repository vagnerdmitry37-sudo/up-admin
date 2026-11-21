import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Customer } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { ConfirmationService, MessageService } from '@openng/optimus-ui/api';
import { EntityTable } from '@shared/entity-table/entity-table';
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
  let editActionsService: EditActionsService;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api' },
        ConfirmationService,
        MessageService,
      ],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    editActionsService = TestBed.inject(EditActionsService);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
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

  const render = async (customers: Customer[]) => {
    const fixture = TestBed.createComponent(CustomersPage);
    fixture.detectChanges();
    expectFirstPage().flush({ items: customers, totalRecords: customers.length });
    await fixture.whenStable();
    return fixture;
  };

  const select = async (fixture: ComponentFixture<CustomersPage>, customers: Customer[]) => {
    const table = fixture.debugElement.query(By.directive(EntityTable))
      .componentInstance as EntityTable<Customer>;
    table.selection.set(customers);
    await fixture.whenStable();
  };

  const text = (fixture: ComponentFixture<CustomersPage>) =>
    (fixture.nativeElement as HTMLElement).textContent;

  it('points to the suggested Create action when there are no customers yet', async () => {
    const fixture = await render([]);

    expect(text(fixture)).toContain('No customers yet');
    expect(editActionsService.suggested()).toEqual(['create']);
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

  it('opens an empty edit page from Create', async () => {
    await render([customer('c1')]);

    editActionsService.run('create');

    expect(navigate).toHaveBeenCalledWith(['/edit-customers-page'], { queryParams: undefined });
  });

  it('offers Edit only for a selection and opens the selected customers together', async () => {
    const fixture = await render([customer('c1'), customer('c2'), customer('c3')]);
    expect(editActionsService.actions().edit).toBeUndefined();

    await select(fixture, [customer('c1'), customer('c3')]);
    editActionsService.run('edit');

    expect(navigate).toHaveBeenCalledWith(['/edit-customers-page'], {
      queryParams: { ids: 'c1,c3' },
    });
  });

  it('deletes the selected customers in one request after confirmation and reloads the list', async () => {
    const confirmationService = TestBed.inject(ConfirmationService);
    const confirm = vi.spyOn(confirmationService, 'confirm').mockImplementation((confirmation) => {
      confirmation.accept?.();
      return confirmationService;
    });
    const fixture = await render([customer('c1'), customer('c2'), customer('c3')]);

    await select(fixture, [customer('c1'), customer('c2')]);
    editActionsService.run('delete');

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Delete 2 customers? This cannot be undone.' }),
    );
    const request = httpTestingController.expectOne(
      (candidate) => candidate.method === 'DELETE' && candidate.url === '/api/customers',
    );
    expect(request.request.params.getAll('ids')).toEqual(['c1', 'c2']);
    request.flush(null);
    await new Promise((resolve) => setTimeout(resolve));
    expectFirstPage().flush({ items: [customer('c3')], totalRecords: 1 });
    await fixture.whenStable();

    expect(editActionsService.actions().delete).toBeUndefined();
  });

  it('keeps the list and the selection when the delete is cancelled', async () => {
    const confirmationService = TestBed.inject(ConfirmationService);
    vi.spyOn(confirmationService, 'confirm').mockImplementation((confirmation) => {
      confirmation.reject?.();
      return confirmationService;
    });
    const fixture = await render([customer('c1')]);

    await select(fixture, [customer('c1')]);
    editActionsService.run('delete');

    httpTestingController.expectNone((request) => request.method === 'DELETE');
    expect(editActionsService.actions().delete).toBeDefined();
  });
});
