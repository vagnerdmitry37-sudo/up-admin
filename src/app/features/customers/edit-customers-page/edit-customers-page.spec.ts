import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Customer } from '@core/api/models';
import { ActionMenuService } from '@core/action-menu.service';
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
    if (ids) {
      expectLoad(ids.split(',')).flush(customers);
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
    await fixture.whenStable();

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
    expect(actionMenuService.runningAction()).toBe('save');
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
});
