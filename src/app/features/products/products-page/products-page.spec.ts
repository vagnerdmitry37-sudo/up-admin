import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Product } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
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

describe('ProductsPage', () => {
  let navigate: ReturnType<typeof vi.spyOn>;

  const render = async (list: Product[]) => {
    const fixture = TestBed.createComponent(ProductsPage);
    TestBed.tick();
    TestBed.inject(HttpTestingController).expectOne('/api/products').flush(list);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    return {
      element,
      actions: TestBed.inject(EditActionsService),
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
  });

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

  it('suggests Create when there are no products', async () => {
    const { element, actions } = await render([]);

    expect(element.textContent).toContain('No products yet');
    expect(actions.suggested()).toBe('create');
  });

  it('creates an empty product when nothing is selected', async () => {
    const { actions } = await render(products);

    expect(Object.keys(actions.handlers())).toEqual(['create']);
    actions.run('create');

    expect(navigate).toHaveBeenCalledWith(['/products/new'], {});
  });

  it('copies the selected products with Create', async () => {
    const { actions, select } = await render(products);
    await select(0);
    await select(1);

    actions.run('create');

    expect(navigate).toHaveBeenCalledWith(['/products/new'], { queryParams: { from: 'p1,p2' } });
  });

  it('edits the selected products together', async () => {
    const { actions, select } = await render(products);
    await select(1);
    await select(0);

    actions.run('edit');

    expect(navigate).toHaveBeenCalledWith(['/products', 'p2,p1', 'edit']);
  });
});
