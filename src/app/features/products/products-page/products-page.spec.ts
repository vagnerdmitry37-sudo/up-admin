import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Product } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { DataTable, TableRange } from '@shared/data-table/data-table';
import { ProductsPage } from './products-page';

const products: Product[] = [
  {
    id: 'p1',
    type: 'Excursion',
    name: 'Old Town Walk',
    description: 'x',
    price: 25.5,
    attributes: {},
  },
  {
    id: 'p2',
    type: 'Transfer',
    name: 'Airport to hotel',
    description: 'y',
    price: 40,
    attributes: {},
  },
];

const waitForVirtualScroller = () => new Promise((resolve) => setTimeout(resolve, 10));

const answerWithoutProducts = (httpTestingController: HttpTestingController) =>
  httpTestingController
    .match((req) => req.url === '/api/products')
    .forEach((request) => request.flush({ items: [], totalRecords: 60 }));

describe('ProductsPage', () => {
  let navigate: ReturnType<typeof vi.spyOn>;

  const render = async (list: Product[], totalRecords = list.length) => {
    const fixture = TestBed.createComponent(ProductsPage);
    TestBed.tick();
    const httpTestingController = TestBed.inject(HttpTestingController);
    httpTestingController
      .expectOne('/api/products?first=0&rows=50')
      .flush({ items: list, totalRecords });
    await fixture.whenStable();
    await waitForVirtualScroller();
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    return {
      element,
      httpTestingController,
      scrollTo: (range: TableRange) =>
        fixture.debugElement.query(By.directive(DataTable)).componentInstance.lazyLoad.emit(range),
      editActionsService: TestBed.inject(EditActionsService),
      select: async (index: number) => {
        (element.querySelectorAll('tbody tr')[index] as HTMLElement).click();
        await fixture.whenStable();
      },
    };
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(document.body);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(600);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(400);
  });

  afterEach(() => vi.restoreAllMocks());

  it('lists products with a formatted price', async () => {
    const { element } = await render(products);

    const cells = [...element.querySelectorAll('tbody tr')].map((row) =>
      [...row.querySelectorAll('td')].map((cell) => cell.textContent?.trim()),
    );
    expect(cells).toEqual([
      ['Old Town Walk', 'Excursion', '25.50'],
      ['Airport to hotel', 'Transfer', '40.00'],
    ]);
  });

  it('shows a spinner until the products are loaded', async () => {
    const fixture = TestBed.createComponent(ProductsPage);
    TestBed.tick();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.p-datatable-mask')).not.toBeNull();

    TestBed.inject(HttpTestingController)
      .expectOne('/api/products?first=0&rows=50')
      .flush({ items: products, totalRecords: 2 });
    await fixture.whenStable();

    expect(element.querySelector('.p-datatable-mask')).toBeNull();
  });

  it('keeps empty rows in place of products that are not loaded yet', async () => {
    const warn = vi.spyOn(console, 'warn');
    const { element } = await render(products, 60);

    const rows = element.querySelectorAll('tbody tr');
    expect(rows[1].textContent).toContain('Airport to hotel');
    expect(rows[2].textContent?.trim()).toBe('');
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('NG0955'));
  });

  it('loads the products the table scrolls to', async () => {
    const { httpTestingController, scrollTo } = await render(products, 60);

    scrollTo({ first: 40, rows: 20 });

    httpTestingController
      .expectOne('/api/products?first=40&rows=20')
      .flush({ items: products, totalRecords: 60 });
  });

  it('loads only the products of the range that are not loaded yet', async () => {
    const { httpTestingController, scrollTo } = await render(products, 60);
    answerWithoutProducts(httpTestingController);

    scrollTo({ first: 0, rows: 5 });

    httpTestingController.expectOne('/api/products?first=2&rows=3');
  });

  it('does not request products that are already being loaded', async () => {
    const { httpTestingController, scrollTo } = await render(products, 60);
    answerWithoutProducts(httpTestingController);

    scrollTo({ first: 40, rows: 20 });
    scrollTo({ first: 45, rows: 10 });

    expect(httpTestingController.match((req) => req.url === '/api/products')).toHaveLength(1);
  });

  it('does not reload products that are already loaded', async () => {
    const { httpTestingController, scrollTo } = await render(products);

    scrollTo({ first: 0, rows: 2 });

    httpTestingController.expectNone((req) => req.url === '/api/products');
  });

  it('suggests Create when there are no products', async () => {
    const { element, editActionsService } = await render([]);

    expect(element.textContent).toContain('No products yet');
    expect(editActionsService.suggested()).toEqual(['create']);
  });

  it('creates an empty product when nothing is selected', async () => {
    const { editActionsService } = await render(products);

    expect(Object.keys(editActionsService.actions())).toEqual(['create']);
    editActionsService.run('create');

    expect(navigate).toHaveBeenCalledWith(['/products/new'], {});
  });

  it('copies the selected products with Create', async () => {
    const { editActionsService, select } = await render(products);
    await select(0);
    await select(1);

    editActionsService.run('create');

    expect(navigate).toHaveBeenCalledWith(['/products/new'], { queryParams: { from: 'p1,p2' } });
  });

  it('edits the selected products together', async () => {
    const { editActionsService, select } = await render(products);
    await select(1);
    await select(0);

    editActionsService.run('edit');

    expect(navigate).toHaveBeenCalledWith(['/products', 'p2,p1', 'edit']);
  });
});
