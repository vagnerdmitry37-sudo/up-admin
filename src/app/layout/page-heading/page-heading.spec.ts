import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
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
            title: 'Products',
            children: [
              { path: '', component: EmptyPage },
              {
                path: 'editor',
                title: 'Editor',
                component: EmptyPage,
              },
            ],
          },
          { path: '**', component: EmptyPage },
        ]),
      ],
    });
  });

  it('shows only the parent heading on a list page', async () => {
    const { navigate, text } = await render();

    await navigate('/products');

    expect(text()).toBe('Products');
  });

  it('joins the parent and child headings on an edit page whatever records are open', async () => {
    const { navigate, text } = await render();

    await navigate('/products/editor');
    expect(text()).toBe('Products / Editor');

    await navigate('/products/editor?ids=1,2');
    expect(text()).toBe('Products / Editor');

    await navigate('/products/editor?ids=new-1,7');
    expect(text()).toBe('Products / Editor');
  });

  it('shows no heading on a route without one', async () => {
    const { navigate, text } = await render();
    await navigate('/products');

    await navigate('/missing');

    expect(text()).toBe('');
  });
});
