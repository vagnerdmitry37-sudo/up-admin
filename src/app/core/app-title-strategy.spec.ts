import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import { AppTitleStrategy } from './app-title-strategy';

@Component({ template: '' })
class EmptyPage {}

describe('AppTitleStrategy', () => {
  const navigate = async (url: string) => {
    await TestBed.inject(Router).navigateByUrl(url);
    return TestBed.inject(Title).getTitle();
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
              { path: 'editor', title: 'Editor', component: EmptyPage },
            ],
          },
          { path: '**', component: EmptyPage },
        ]),
        { provide: TitleStrategy, useClass: AppTitleStrategy },
      ],
    });
  });

  it('joins the route titles and adds the app name', async () => {
    expect(await navigate('/products')).toBe('Products · UP');
    expect(await navigate('/products/editor?ids=1,2')).toBe('Products / Editor · UP');
  });

  it('shows only the app name on a route without a title', async () => {
    expect(await navigate('/missing')).toBe('UP');
  });
});
