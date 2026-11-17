import { TestBed } from '@angular/core/testing';
import { Product } from '@core/api/models';
import { ProductTabs } from './product-tabs';

const walk: Product = {
  id: 'p1',
  type: 'GroupExcursion',
  typeLabel: 'Group excursion',
  name: 'Old Town Walk',
  description: 'Three hours',
  seoDescription: '',
  shortDescription: '',
  price: 25,
  attributes: {},
};
const transfer: Product = {
  id: 'p2',
  type: 'IndividualTransfer',
  typeLabel: 'Individual transfer',
  name: 'Airport to hotel',
  description: 'Door to door',
  seoDescription: '',
  shortDescription: '',
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

    expect(element.querySelector('p-tab')).toBeNull();
    expect(element.querySelectorAll('app-product-form')).toHaveLength(1);
  });

  it('shows one tab per product, named after it', async () => {
    const { element } = await render([walk, transfer]);

    expect([...element.querySelectorAll('p-tab')].map((tab) => tab.textContent?.trim())).toEqual([
      'Old Town Walk',
      'Airport to hotel',
    ]);
  });
});
