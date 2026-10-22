import { TestBed } from '@angular/core/testing';
import { Product } from '@core/api/models';
import { ProductTabs } from './product-tabs';

const walk: Product = {
  id: 'p1',
  type: 'Excursion',
  name: 'Old Town Walk',
  description: 'Three hours',
  price: 25,
  attributes: {},
};
const transfer: Product = {
  id: 'p2',
  type: 'Transfer',
  name: 'Airport to hotel',
  description: 'Door to door',
  price: 40,
  attributes: {},
};

describe('ProductTabs', () => {
  const render = async (products: Product[]) => {
    const fixture = TestBed.createComponent(ProductTabs);
    fixture.componentRef.setInput('heading', 'Edit product');
    fixture.componentRef.setInput('products', products);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const openTab = async (index: number) => {
      (element.querySelectorAll('p-tab')[index] as HTMLElement).click();
      await fixture.whenStable();
    };
    const typeName = (value: string) => {
      const input = (element.querySelector('p-tabpanel:not([hidden]) app-text-field input') ??
        element.querySelector('app-text-field input')) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const activeTab = () =>
      [...element.querySelectorAll('p-tab')].findIndex(
        (tab) => tab.getAttribute('aria-selected') === 'true',
      );
    return { fixture, tabs: fixture.componentInstance, element, openTab, typeName, activeTab };
  };

  it('shows a single product without tabs', async () => {
    const { element } = await render([walk]);

    expect(element.querySelector('p-tabs')).toBeNull();
    expect(element.querySelectorAll('app-product-form')).toHaveLength(1);
  });

  it('shows one tab per product, named after it', async () => {
    const { element } = await render([walk, transfer]);

    expect([...element.querySelectorAll('p-tab')].map((tab) => tab.textContent?.trim())).toEqual([
      'Old Town Walk',
      'Airport to hotel',
    ]);
  });

  it('returns every product as plain form values without ids, even unopened tabs', async () => {
    const { tabs, typeName } = await render([walk, transfer]);
    typeName('Night Walk');

    const values = tabs.values();

    expect(values?.map(({ value }) => value)).toEqual([
      { type: 'Excursion', name: 'Night Walk', description: 'Three hours', price: 25 },
      { type: 'Transfer', name: 'Airport to hotel', description: 'Door to door', price: 40 },
    ]);
    expect(values?.map(({ product }) => product.id)).toEqual(['p1', 'p2']);
  });

  it('keeps unsaved edits when switching tabs', async () => {
    const { tabs, openTab, typeName } = await render([walk, transfer]);
    await openTab(1);
    typeName('Hotel to airport');

    await openTab(0);

    expect(tabs.values()?.[1].value.name).toBe('Hotel to airport');
  });

  it('returns nothing and opens the first invalid tab', async () => {
    const { fixture, tabs, openTab, typeName, activeTab } = await render([walk, transfer]);
    await openTab(1);
    typeName('');
    await openTab(0);

    expect(tabs.values()).toBeUndefined();
    await fixture.whenStable();

    expect(activeTab()).toBe(1);
  });
});
