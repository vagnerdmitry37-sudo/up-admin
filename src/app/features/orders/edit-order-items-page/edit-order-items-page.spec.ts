import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Order, OrderItem } from '@core/api/models';
import { ActionMenuService } from '@core/action-menu.service';
import { ConfirmationService, MessageService } from '@openng/optimus-ui/api';
import { EntityForm } from '@shared/entity/entity-form/entity-form';
import { EditOrderItemsPage } from './edit-order-items-page';

const orderItem = (id: string, pickupAddress: string): OrderItem =>
  ({
    id,
    productId: 'p1',
    productType: 'GroupExcursion',
    productName: `Product ${id}`,
    unitPrice: 40,
    startsAt: '2026-12-01T09:00:00.000Z',
    passengers: 2,
    pickupAddress,
    notes: '',
    totalPrice: 80,
  }) as OrderItem;

const order = (items: OrderItem[]): Order => ({
  id: 'o1',
  number: 'N-o1',
  status: 'Pending',
  customer: null,
  createdAt: '2026-01-01T00:00:00Z',
  totalPrice: 0,
  items,
});

describe('EditOrderItemsPage', () => {
  let httpTestingController: HttpTestingController;
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
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpTestingController.verify());

  const render = async (ids?: string, items: OrderItem[] = []) => {
    const fixture = TestBed.createComponent(EditOrderItemsPage);
    fixture.componentRef.setInput('orderId', 'o1');
    fixture.componentRef.setInput('ids', ids);
    TestBed.tick();
    if (ids) {
      httpTestingController
        .expectOne(
          (request) =>
            request.url === '/api/orders/by-ids' && request.params.getAll('ids')?.join() === 'o1',
        )
        .flush([order(items)]);
    }
    await fixture.whenStable();
    return fixture;
  };

  const itemForm = (fixture: ComponentFixture<EditOrderItemsPage>) =>
    fixture.debugElement.query(By.directive(EntityForm)).injector.get(EntityForm).form();

  const edit = async (fixture: ComponentFixture<EditOrderItemsPage>, value: object) => {
    const form = itemForm(fixture);
    form.patchValue(value);
    form.markAsDirty();
    await fixture.whenStable();
  };

  const save = async () => {
    TestBed.inject(ActionMenuService).run('save');
    await new Promise((resolve) => setTimeout(resolve));
  };

  const tabLabels = (fixture: ComponentFixture<EditOrderItemsPage>) =>
    [...(fixture.nativeElement as HTMLElement).querySelectorAll('p-tab')].map((tab) =>
      tab.textContent?.trim(),
    );

  const shownTabLabel = (fixture: ComponentFixture<EditOrderItemsPage>) =>
    (fixture.nativeElement as HTMLElement)
      .querySelector('p-tab[aria-selected="true"]')
      ?.textContent?.trim();

  const closeButton = (fixture: ComponentFixture<EditOrderItemsPage>, label: string) =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      `button[aria-label="Close ${label}"]`,
    );

  const showTab = async (fixture: ComponentFixture<EditOrderItemsPage>, label: string) => {
    [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('p-tab')]
      .find((tab) => tab.textContent?.trim() === label)
      ?.click();
    await fixture.whenStable();
  };

  const closeTab = async (fixture: ComponentFixture<EditOrderItemsPage>, label: string) => {
    closeButton(fixture, label)?.click();
    await new Promise((resolve) => setTimeout(resolve));
    const lastCall = navigate.mock.lastCall;
    const ids = lastCall?.[1]?.queryParams?.ids;
    if (ids) {
      fixture.componentRef.setInput('ids', ids);
    }
    await fixture.whenStable();
  };

  const threeItems = () => [
    orderItem('i1', 'Old Town'),
    orderItem('i2', 'Airport'),
    orderItem('i3', 'Castle'),
  ];

  it('closes a tab by dropping its id from the address without loading the items again', async () => {
    const fixture = await render('i1,i2,i3', threeItems());

    await closeTab(fixture, 'Product i2');

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { ids: 'i1,i3' }, replaceUrl: true }),
    );
    expect(tabLabels(fixture)).toEqual(['Product i1', 'Product i3']);
    httpTestingController.expectNone((request) => request.url === '/api/orders/by-ids');
  });

  it('keeps unsaved changes in the other tabs when one tab is closed', async () => {
    const fixture = await render('i1,i2', threeItems().slice(0, 2));
    await edit(fixture, { pickupAddress: 'Changed' });

    await closeTab(fixture, 'Product i2');

    expect(itemForm(fixture).getRawValue().pickupAddress).toBe('Changed');
    expect(itemForm(fixture).dirty).toBe(true);
  });

  it('shows the right neighbour after closing the shown tab, or the left one when it was last', async () => {
    const fixture = await render('i1,i2,i3', threeItems());
    await showTab(fixture, 'Product i2');

    await closeTab(fixture, 'Product i2');
    expect(shownTabLabel(fixture)).toBe('Product i3');

    await closeTab(fixture, 'Product i3');
    expect(shownTabLabel(fixture)).toBe('Product i1');
  });

  it('returns to the order when the last open item is closed', async () => {
    const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = await render('i1', [orderItem('i1', 'Old Town')]);

    expect(tabLabels(fixture)).toEqual(['Product i1']);
    await closeTab(fixture, 'Product i1');

    expect(navigateByUrl).toHaveBeenCalledWith('/orders/editor?ids=o1', { replaceUrl: true });
  });

  it('shows a New order item tab when creating and returns to the order when it is closed', async () => {
    const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const confirm = vi.spyOn(TestBed.inject(ConfirmationService), 'confirm');
    const fixture = await render();

    expect(tabLabels(fixture)).toEqual(['New order item']);
    await closeTab(fixture, 'New order item');

    expect(confirm).not.toHaveBeenCalled();
    expect(navigateByUrl).toHaveBeenCalledWith('/orders/editor?ids=o1', { replaceUrl: true });
  });

  it('asks before cancelling a changed new item and leaves only on Discard', async () => {
    const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const confirm = vi.spyOn(TestBed.inject(ConfirmationService), 'confirm');
    const fixture = await render();
    await edit(fixture, { pickupAddress: 'Hotel Pupp' });

    await closeTab(fixture, 'New order item');

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Close New order item and discard its unsaved changes?' }),
    );
    expect(navigateByUrl).not.toHaveBeenCalled();

    await confirm.mock.lastCall?.[0].accept?.();
    expect(navigateByUrl).toHaveBeenCalledWith('/orders/editor?ids=o1', { replaceUrl: true });
  });

  it('asks before closing a tab with unsaved changes and closes it only on Discard', async () => {
    const confirm = vi.spyOn(TestBed.inject(ConfirmationService), 'confirm');
    const fixture = await render('i1,i2', threeItems().slice(0, 2));
    await edit(fixture, { passengers: 9 });

    await closeTab(fixture, 'Product i1');

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Close Product i1 and discard its unsaved changes?' }),
    );
    expect(navigate).not.toHaveBeenCalled();

    await confirm.mock.lastCall?.[0].accept?.();
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { ids: 'i2' }, replaceUrl: true }),
    );
  });

  it('disables closing tabs while saving', async () => {
    const fixture = await render('i1,i2', threeItems().slice(0, 2));
    await edit(fixture, { passengers: 5 });

    await save();
    await fixture.whenStable();
    expect(closeButton(fixture, 'Product i1')?.disabled).toBe(true);

    httpTestingController.expectOne('/api/orders/o1/items').flush([]);
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    httpTestingController
      .expectOne((request) => request.url === '/api/orders/by-ids')
      .flush([order(threeItems())]);
    await fixture.whenStable();
    expect(closeButton(fixture, 'Product i1')?.disabled).toBe(false);
  });

  it('creates an item in its order with the product id and the start as ISO time', async () => {
    const fixture = await render();

    await edit(fixture, {
      product: { id: 'p7', name: 'Prague by night', type: 'GroupExcursion' },
      startsAt: new Date('2026-12-24T18:30:00.000Z'),
      passengers: 3,
      pickupAddress: 'Hotel Pupp',
      notes: 'Child seat',
    });
    await save();

    const request = httpTestingController.expectOne('/api/orders/o1/items');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      productId: 'p7',
      startsAt: '2026-12-24T18:30:00.000Z',
      passengers: 3,
      pickupAddress: 'Hotel Pupp',
      notes: 'Child seat',
    });
    request.flush(orderItem('i9', 'Hotel Pupp'));
    await new Promise((resolve) => setTimeout(resolve));
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { ids: 'i9' } }),
    );
  });

  it('opens only the requested item of the order and saves its changes as one bulk update', async () => {
    const fixture = await render('i2', [orderItem('i1', 'Old Town'), orderItem('i2', 'Airport')]);
    expect(itemForm(fixture).getRawValue()).toEqual(
      expect.objectContaining({
        pickupAddress: 'Airport',
        product: expect.objectContaining({ id: 'p1' }),
      }),
    );

    await edit(fixture, { passengers: 5 });
    await save();

    const request = httpTestingController.expectOne('/api/orders/o1/items');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual([
      {
        id: 'i2',
        productId: 'p1',
        startsAt: '2026-12-01T09:00:00.000Z',
        passengers: 5,
        pickupAddress: 'Airport',
        notes: '',
      },
    ]);
  });
});
