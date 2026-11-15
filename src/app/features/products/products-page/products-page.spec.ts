import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Product } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { ConfirmationService } from '@openng/optimus-ui/api';
import { DataTable, TableRange } from '@shared/data-table/data-table';
import { ProductsPage } from './products-page';

const products: Product[] = [
  {
    id: 'p1',
    type: 'GroupExcursion',
    typeLabel: 'Group excursion',
    name: 'Old Town Walk',
    description: 'x',
    seoDescription: 'Walk through the old town',
    shortDescription: '',
    price: 25.5,
    attributes: {},
  },
  {
    id: 'p2',
    type: 'IndividualTransfer',
    typeLabel: 'Individual transfer',
    name: 'Airport to hotel',
    description: 'y',
    seoDescription: 'Private transfer from the airport',
    shortDescription: '',
    price: 40,
    attributes: {},
  },
];

const settle = () => new Promise((resolve) => setTimeout(resolve));

const waitForVirtualScroller = () => new Promise((resolve) => setTimeout(resolve, 10));

const answerProductTypes = (httpTestingController: HttpTestingController) =>
  httpTestingController.match('/api/product-types').forEach((request) => request.flush([]));

const answerWithoutProducts = (
  httpTestingController: HttpTestingController,
  totalRecords: number,
) =>
  httpTestingController
    .match((req) => req.url === '/api/products')
    .forEach((request) => request.flush({ items: [], totalRecords }));

const answerConfirmation = (answer: 'accept' | 'reject') => {
  const confirmationService = TestBed.inject(ConfirmationService);
  return vi.spyOn(confirmationService, 'confirm').mockImplementation((confirmation) => {
    confirmation[answer]?.();
    return confirmationService;
  });
};

describe('ProductsPage', () => {
  let httpTestingController: HttpTestingController;
  let editActionsService: EditActionsService;
  let navigate: ReturnType<typeof vi.spyOn>;

  const start = () => {
    const fixture = TestBed.createComponent(ProductsPage);
    TestBed.tick();
    answerProductTypes(httpTestingController);
    return fixture;
  };

  const showLoaded = async (fixture: ComponentFixture<ProductsPage>) => {
    await fixture.whenStable();
    await waitForVirtualScroller();
    await fixture.whenStable();
  };

  const render = async (list: Product[], totalRecords = list.length) => {
    const fixture = start();
    httpTestingController
      .expectOne('/api/products?first=0&rows=50')
      .flush({ items: list, totalRecords });
    await showLoaded(fixture);
    answerWithoutProducts(httpTestingController, totalRecords);
    const element: HTMLElement = fixture.nativeElement;
    return {
      fixture,
      element,
      scrollTo: (range: TableRange) =>
        fixture.debugElement.query(By.directive(DataTable)).componentInstance.lazyLoad.emit(range),
      select: async (index: number) => {
        (element.querySelectorAll('tbody tr')[index] as HTMLElement).click();
        await fixture.whenStable();
      },
    };
  };

  const availableActions = () => Object.keys(editActionsService.actions());

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
    editActionsService = TestBed.inject(EditActionsService);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(document.body);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(600);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(400);
  });

  afterEach(() => {
    httpTestingController.verify();
    vi.restoreAllMocks();
  });

  describe('loading', () => {
    it('lists the products with their type label and a formatted price', async () => {
      const { element } = await render(products);

      const cells = [...element.querySelectorAll('tbody tr')].map((row) =>
        [...row.querySelectorAll('td')].map((cell) => cell.textContent?.trim()),
      );
      expect(cells).toEqual([
        ['Old Town Walk', 'Group excursion', '25.50'],
        ['Airport to hotel', 'Individual transfer', '40.00'],
      ]);
    });

    it('shows a spinner until the first page is loaded', async () => {
      const fixture = start();
      const element: HTMLElement = fixture.nativeElement;
      expect(element.querySelector('.p-datatable-mask')).not.toBeNull();

      httpTestingController
        .expectOne('/api/products?first=0&rows=50')
        .flush({ items: products, totalRecords: 2 });
      await showLoaded(fixture);

      expect(element.querySelector('.p-datatable-mask')).toBeNull();
    });

    it('keeps empty rows in place of products that are not loaded yet', async () => {
      const { element } = await render(products, 60);

      const rows = element.querySelectorAll('tbody tr');
      expect(rows[1].textContent).toContain('Airport to hotel');
      expect(rows[2].textContent?.trim()).toBe('');
    });

    it('loads the products the table scrolls to', async () => {
      const { scrollTo } = await render(products, 60);

      scrollTo({ first: 40, rows: 20 });

      httpTestingController
        .expectOne('/api/products?first=40&rows=20')
        .flush({ items: products, totalRecords: 60 });
    });

    it('loads only the part of the range that is not loaded yet', async () => {
      const { scrollTo } = await render(products, 60);

      scrollTo({ first: 0, rows: 5 });

      httpTestingController
        .expectOne('/api/products?first=2&rows=3')
        .flush({ items: [], totalRecords: 60 });
    });

    it('does not request products that are already being loaded', async () => {
      const { scrollTo } = await render(products, 60);

      scrollTo({ first: 40, rows: 20 });
      scrollTo({ first: 45, rows: 10 });

      const requests = httpTestingController.match((req) => req.url === '/api/products');
      expect(requests.map((request) => request.request.urlWithParams)).toEqual([
        '/api/products?first=40&rows=20',
      ]);
      requests.forEach((request) => request.flush({ items: [], totalRecords: 60 }));
    });

    it('does not reload products that are already loaded', async () => {
      const { scrollTo } = await render(products);

      scrollTo({ first: 0, rows: 2 });

      httpTestingController.expectNone((req) => req.url === '/api/products');
    });

    it('shows an empty state and suggests Create when there are no products', async () => {
      const { element } = await render([]);

      expect(element.textContent).toContain('No products yet');
      expect(element.querySelector('app-data-table')).toBeNull();
      expect(editActionsService.suggested()).toEqual(['create']);
    });
  });

  describe('Create', () => {
    it('is the only action, and not suggested, while products exist and none is selected', async () => {
      await render(products);

      expect(availableActions()).toEqual(['create']);
      expect(editActionsService.suggested()).toEqual([]);
    });

    it('opens an empty create page when nothing is selected', async () => {
      await render(products);

      editActionsService.run('create');

      expect(navigate).toHaveBeenCalledWith(['/products/new'], { queryParams: undefined });
    });

    it('copies the selected products', async () => {
      const { select } = await render(products);
      await select(0);
      await select(1);

      editActionsService.run('create');

      expect(navigate).toHaveBeenCalledWith(['/products/new'], { queryParams: { from: 'p1,p2' } });
    });
  });

  describe('Edit', () => {
    it('is offered only while products are selected', async () => {
      const { select } = await render(products);
      expect(availableActions()).not.toContain('edit');

      await select(0);

      expect(availableActions()).toContain('edit');
    });

    it('opens every selected product together, in selection order', async () => {
      const { select } = await render(products);
      await select(1);
      await select(0);

      editActionsService.run('edit');

      expect(navigate).toHaveBeenCalledWith(['/products', 'p2,p1', 'edit']);
    });
  });

  describe('Delete', () => {
    it('is offered only while products are selected', async () => {
      const { select } = await render(products);
      expect(availableActions()).not.toContain('delete');

      await select(0);

      expect(availableActions()).toContain('delete');
    });

    it('asks about a single product in the singular', async () => {
      const confirm = answerConfirmation('reject');
      const { select } = await render(products);
      await select(0);

      editActionsService.run('delete');

      expect(confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          header: 'Delete product?',
          message: 'This cannot be undone.',
          acceptLabel: 'Delete',
        }),
      );
    });

    it('asks about several products with their count, and sends nothing when cancelled', async () => {
      const confirm = answerConfirmation('reject');
      const { select } = await render(products);
      await select(0);
      await select(1);

      editActionsService.run('delete');

      expect(confirm).toHaveBeenCalledWith(
        expect.objectContaining({ header: 'Delete 2 products?' }),
      );
      httpTestingController.expectNone((req) => req.method === 'DELETE');
      expect(availableActions()).toContain('delete');
    });

    it('deletes the selected products after confirming, then reloads the list', async () => {
      answerConfirmation('accept');
      const { fixture, element, select } = await render(products);
      await select(1);
      await select(0);

      editActionsService.run('delete');
      const deletion = httpTestingController.expectOne(
        (req) => req.method === 'DELETE' && req.url === '/api/products',
      );
      expect(deletion.request.params.getAll('ids')).toEqual(['p2', 'p1']);
      deletion.flush(null, { status: 204, statusText: 'No Content' });
      await settle();

      httpTestingController
        .expectOne('/api/products?first=0&rows=50')
        .flush({ items: [products[1]], totalRecords: 1 });
      await showLoaded(fixture);

      expect(element.querySelectorAll('tbody tr')).toHaveLength(1);
      expect(element.querySelector('tbody tr')?.textContent).toContain('Airport to hotel');
      expect(availableActions()).toEqual(['create']);
    });
  });
});
