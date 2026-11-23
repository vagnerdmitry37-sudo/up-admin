import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Customer } from '@core/api/models';
import { ActionMenuService } from '@core/action-menu.service';
import { HttpActivity } from '@core/http-activity.service';
import { ConfirmationService } from '@openng/optimus-ui/api';
import { EditCustomersPage } from './edit-customers-page';

const customer = (id: string, name: string): Customer => ({
  id,
  name,
  email: `${id}@example.com`,
  phone: '+100',
  createdAt: '2026-01-01T00:00:00Z',
});

describe('EditCustomersPage', () => {
  let httpTestingController: HttpTestingController;
  let actionMenuService: ActionMenuService;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api' },
        ConfirmationService,
      ],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    actionMenuService = TestBed.inject(ActionMenuService);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpTestingController.verify());

  const expectLoad = (ids: string[]) =>
    httpTestingController.expectOne(
      (request) =>
        request.method === 'GET' &&
        request.url === '/api/customers/by-ids' &&
        request.params.getAll('ids')?.join() === ids.join(),
    );

  const render = async (ids?: string, customers: Customer[] = []) => {
    const fixture = TestBed.createComponent(EditCustomersPage);
    fixture.componentRef.setInput('ids', ids);
    TestBed.tick();
    const savedIds = ids?.split(',').filter((id) => !id.startsWith('new-')) ?? [];
    if (savedIds.length > 0) {
      expectLoad(savedIds).flush(customers);
    }
    await fixture.whenStable();
    return fixture;
  };

  const fields = (fixture: ComponentFixture<EditCustomersPage>) =>
    [...(fixture.nativeElement as HTMLElement).querySelectorAll('app-text-field')].map((field) => ({
      label: field.querySelector('label')!.textContent!.trim(),
      input: field.querySelector('input')!,
      error: () => field.querySelector('.error')!.textContent!.trim(),
    }));

  const type = async (
    fixture: ComponentFixture<EditCustomersPage>,
    label: string,
    value: string,
    nth = 0,
  ) => {
    const { input } = fields(fixture).filter((field) => field.label === label)[nth];
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  const save = async (fixture: ComponentFixture<EditCustomersPage>) => {
    actionMenuService.run('save');
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  };

  const tabs = (fixture: ComponentFixture<EditCustomersPage>) => [
    ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[role="tab"]'),
  ];

  const openTab = async (fixture: ComponentFixture<EditCustomersPage>, label: string) => {
    tabs(fixture)
      .find((tab) => tab.textContent?.trim() === label)!
      .click();
    await fixture.whenStable();
  };

  it('offers Save once the new customer form changes, creates the customer and reopens the page with its id', async () => {
    const fixture = await render();
    expect(actionMenuService.actions().save).toBeUndefined();

    await type(fixture, 'Name', 'Ada');
    await type(fixture, 'Email', 'ada@example.com');
    await type(fixture, 'Phone', '+123');
    expect(actionMenuService.actions().save).toBeDefined();
    await save(fixture);

    const request = httpTestingController.expectOne('/api/customers');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Ada', email: 'ada@example.com', phone: '+123' });
    request.flush(customer('c9', 'Ada'));
    await new Promise((resolve) => setTimeout(resolve));

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { ids: 'c9' } }),
    );
  });

  it('sends nothing and shows the field errors when the changed form is invalid', async () => {
    const fixture = await render();

    await type(fixture, 'Name', 'Ada');
    await type(fixture, 'Email', 'not-an-email');
    await save(fixture);

    httpTestingController.expectNone('/api/customers');
    const errors = fields(fixture).map(({ label, error }) => [label, error()]);
    expect(errors).toEqual([
      ['Name', ''],
      ['Email', 'Enter a valid email.'],
      ['Phone', 'Enter a phone number.'],
    ]);
  });

  it('shows one tab per customer, saves only the changed one in one request and reloads them', async () => {
    const first = customer('c1', 'Ada');
    const second = customer('c2', 'Grace');
    const fixture = await render('c1,c2', [first, second]);
    expect(tabs(fixture).map((tab) => tab.textContent?.trim())).toEqual(['Ada', 'Grace']);

    await openTab(fixture, 'Grace');
    await type(fixture, 'Name', 'Grace Hopper', 1);
    await save(fixture);

    const request = httpTestingController.expectOne(
      (candidate) => candidate.method === 'PUT' && candidate.url === '/api/customers',
    );
    expect(request.request.body).toEqual([
      { id: 'c2', name: 'Grace Hopper', email: 'c2@example.com', phone: '+100' },
    ]);
    request.flush([{ ...second, name: 'Grace Hopper' }]);
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    expectLoad(['c1', 'c2']).flush([first, { ...second, name: 'Grace Hopper' }]);
    await fixture.whenStable();

    expect(tabs(fixture).map((tab) => tab.textContent?.trim())).toEqual(['Ada', 'Grace Hopper']);
    expect(actionMenuService.actions().save).toBeUndefined();
  });

  it('keeps Save in the menu as running while the customers are being saved', async () => {
    const first = customer('c1', 'Ada');
    const fixture = await render('c1', [first]);

    await type(fixture, 'Name', 'Ada Lovelace');
    await save(fixture);
    expect(
      TestBed.inject(HttpActivity).isRunning({ source: 'action-menu', operation: 'save' }),
    ).toBe(true);
    expect(actionMenuService.actions().save).toBeDefined();

    httpTestingController
      .expectOne((candidate) => candidate.method === 'PUT' && candidate.url === '/api/customers')
      .flush([{ ...first, name: 'Ada Lovelace' }]);
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    expectLoad(['c1']).flush([{ ...first, name: 'Ada Lovelace' }]);
    await fixture.whenStable();

    expect(actionMenuService.actions().save).toBeUndefined();
  });

  it('shows the tab of an invalid customer instead of saving', async () => {
    const fixture = await render('c1,c2', [customer('c1', 'Ada'), customer('c2', 'Grace')]);

    await openTab(fixture, 'Grace');
    await type(fixture, 'Name', '', 1);
    await openTab(fixture, 'Ada');
    await type(fixture, 'Name', 'Ada Lovelace', 0);
    await save(fixture);

    httpTestingController.expectNone((request) => request.method === 'PUT');
    const selected = tabs(fixture).find((tab) => tab.getAttribute('aria-selected') === 'true');
    expect(selected?.textContent?.trim()).toBe('Grace');
  });

  const tabLabels = (fixture: ComponentFixture<EditCustomersPage>) =>
    tabs(fixture).map((tab) => tab.textContent?.trim());

  const selectedTabLabel = (fixture: ComponentFixture<EditCustomersPage>) =>
    tabs(fixture)
      .find((tab) => tab.getAttribute('aria-selected') === 'true')
      ?.textContent?.trim();

  const lastNavigatedIds = () => navigate.mock.lastCall?.[1]?.queryParams?.ids;

  const fillNewCustomer = async (fixture: ComponentFixture<EditCustomersPage>, nth: number) => {
    await openTab(fixture, 'New customer');
    await type(fixture, 'Name', 'Grace', nth);
    await type(fixture, 'Email', 'grace@example.com', nth);
    await type(fixture, 'Phone', '+200', nth);
  };

  it('adds a New customer tab beside the open customers on Create and shows it without reloading them', async () => {
    const fixture = await render('c1', [customer('c1', 'Ada')]);

    actionMenuService.run('create');
    await new Promise((resolve) => setTimeout(resolve));
    expect(lastNavigatedIds()).toBe('c1,new-1');
    fixture.componentRef.setInput('ids', 'c1,new-1');
    await fixture.whenStable();

    expect(tabLabels(fixture)).toEqual(['Ada', 'New customer']);
    expect(selectedTabLabel(fixture)).toBe('New customer');
    httpTestingController.expectNone('/api/customers/by-ids');
  });

  it('updates the changed customer, creates the new one and keeps its tab in place while it loads', async () => {
    const first = customer('c1', 'Ada');
    const fixture = await render('c1,new-1', [first]);
    await type(fixture, 'Name', 'Ada Lovelace', 0);
    await fillNewCustomer(fixture, 1);

    await save(fixture);
    httpTestingController
      .expectOne((request) => request.method === 'PUT' && request.url === '/api/customers')
      .flush([{ ...first, name: 'Ada Lovelace' }]);
    await new Promise((resolve) => setTimeout(resolve));
    const create = httpTestingController.expectOne(
      (request) => request.method === 'POST' && request.url === '/api/customers',
    );
    expect(create.request.body).toEqual({
      name: 'Grace',
      email: 'grace@example.com',
      phone: '+200',
    });
    create.flush(customer('c9', 'Grace'));
    await new Promise((resolve) => setTimeout(resolve));

    expect(lastNavigatedIds()).toBe('c1,c9');
    fixture.componentRef.setInput('ids', 'c1,c9');
    TestBed.tick();
    expect(tabLabels(fixture)).toEqual(['Ada', 'New customer']);
    expect(selectedTabLabel(fixture)).toBe('New customer');

    expectLoad(['c1', 'c9']).flush([{ ...first, name: 'Ada Lovelace' }, customer('c9', 'Grace')]);
    await fixture.whenStable();
    expect(tabLabels(fixture)).toEqual(['Ada Lovelace', 'Grace']);
    expect(selectedTabLabel(fixture)).toBe('Grace');
  });

  it('reloads the updated customers when creating the new one fails, keeping the new tab', async () => {
    const first = customer('c1', 'Ada');
    const fixture = await render('c1,new-1', [first]);
    await type(fixture, 'Name', 'Ada Lovelace', 0);
    await fillNewCustomer(fixture, 1);

    const saving = actionMenuService.run('save');
    await new Promise((resolve) => setTimeout(resolve));
    httpTestingController
      .expectOne((request) => request.method === 'PUT' && request.url === '/api/customers')
      .flush([{ ...first, name: 'Ada Lovelace' }]);
    await new Promise((resolve) => setTimeout(resolve));
    httpTestingController
      .expectOne((request) => request.method === 'POST' && request.url === '/api/customers')
      .flush(null, { status: 500, statusText: 'Server Error' });
    await expect(saving).rejects.toBeDefined();
    TestBed.tick();

    expectLoad(['c1']).flush([{ ...first, name: 'Ada Lovelace' }]);
    await fixture.whenStable();
    expect(navigate).not.toHaveBeenCalled();
    expect(tabLabels(fixture)).toEqual(['Ada Lovelace', 'New customer']);
    expect(actionMenuService.actions().save).toBeDefined();
  });

  it('sends nothing when Save runs with no changes', async () => {
    await render('c1', [customer('c1', 'Ada')]);

    await actionMenuService.run('save');

    httpTestingController.expectNone(() => true);
  });
});
