import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { ProductDetails } from '@core/api/models';
import { ActionMenuService } from '@core/action-menu.service';
import { ConfirmationService, MessageService } from '@openng/optimus-ui/api';
import { EntityForm } from '@shared/entity-form/entity-form';
import { EditProductsPage } from './edit-products-page';

const savedProduct: ProductDetails = {
  id: 'p1',
  type: 'GroupExcursion',
  name: 'Old town walk',
  seoDescription: 'Walk',
  shortDescription: '',
  price: 25,
  images: [],
};

describe('EditProductsPage', () => {
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

  const render = async (ids?: string, products: ProductDetails[] = []) => {
    const fixture = TestBed.createComponent(EditProductsPage);
    fixture.componentRef.setInput('ids', ids);
    TestBed.tick();
    if (ids) {
      httpTestingController
        .expectOne((request) => request.url === '/api/products/by-ids')
        .flush(products);
    }
    await fixture.whenStable();
    return fixture;
  };

  const productForm = (fixture: ComponentFixture<EditProductsPage>) =>
    fixture.debugElement
      .query(By.directive(EntityForm))
      .injector.get(EntityForm)
      .form() as FormGroup;

  const edit = async (
    fixture: ComponentFixture<EditProductsPage>,
    change: (form: FormGroup) => void,
  ) => {
    const form = productForm(fixture);
    change(form);
    form.markAsDirty();
    await fixture.whenStable();
  };

  const save = async () => {
    TestBed.inject(ActionMenuService).run('save');
    await new Promise((resolve) => setTimeout(resolve));
  };

  it('creates a product as a one-item list and reopens the page with the new id', async () => {
    const fixture = await render();

    await edit(fixture, (form) => form.controls['type'].setValue('IndividualTransfer'));
    await edit(fixture, (form) =>
      form.patchValue({
        name: 'Airport transfer',
        seoDescription: 'Transfer',
        price: 40,
      }),
    );
    await save();

    const request = httpTestingController.expectOne('/api/products');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual([
      {
        type: 'IndividualTransfer',
        name: 'Airport transfer',
        shortDescription: '',
        seoDescription: 'Transfer',
        price: 40,
      },
    ]);
    request.flush([{ ...savedProduct, id: 'p9' }]);
    await new Promise((resolve) => setTimeout(resolve));
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { ids: 'p9' } }),
    );
  });

  it('saves a changed product together with its id', async () => {
    const fixture = await render('p1', [savedProduct]);

    await edit(fixture, (form) => form.controls['price'].setValue(30));
    await save();

    const request = httpTestingController.expectOne('/api/products');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual([
      {
        id: 'p1',
        type: 'GroupExcursion',
        name: 'Old town walk',
        shortDescription: '',
        seoDescription: 'Walk',
        price: 30,
      },
    ]);
  });
});
