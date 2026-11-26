import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AppRouteData } from '@core/app-route';
import { PageHeading } from './page-heading';

@Component({ template: '' })
class EmptyPage {}

describe('PageHeading', () => {
  const render = async () => {
    const fixture = TestBed.createComponent(PageHeading);
    const element: HTMLElement = fixture.nativeElement;
    const navigate = async (url: string) => {
      await TestBed.inject(Router).navigateByUrl(url);
      await fixture.whenStable();
    };
    const text = () =>
      [...element.querySelectorAll('span')].map((span) => span.textContent?.trim()).join(' ');
    return { navigate, text };
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'products',
            data: { heading: 'Products' } satisfies AppRouteData,
            component: EmptyPage,
          },
          {
            path: 'edit-products-page',
            data: { heading: 'Products', editPage: true } satisfies AppRouteData,
            component: EmptyPage,
          },
          { path: '**', component: EmptyPage },
        ]),
      ],
    });
  });

  it('shows the heading of a list page without an action', async () => {
    const { navigate, text } = await render();

    await navigate('/products');

    expect(text()).toBe('Products');
  });

  it('shows Editor on an edit page whatever records are open', async () => {
    const { navigate, text } = await render();

    await navigate('/edit-products-page');
    expect(text()).toBe('Products / Editor');

    await navigate('/edit-products-page?ids=1,2');
    expect(text()).toBe('Products / Editor');

    await navigate('/edit-products-page?ids=new-1,7');
    expect(text()).toBe('Products / Editor');
  });

  it('shows no heading on a route without one', async () => {
    const { navigate, text } = await render();
    await navigate('/products');

    await navigate('/missing');

    expect(text()).toBe('');
  });
});
