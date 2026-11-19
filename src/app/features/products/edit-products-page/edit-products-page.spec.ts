import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { ProductDetails, ProductTypeDefinition } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { ConfirmationService, MessageService } from '@openng/optimus-ui/api';
import { EntityForm } from '@shared/entity-form/entity-form';
import { EditProductsPage } from './edit-products-page';

const productTypes: ProductTypeDefinition[] = [
  {
    type: 'GroupExcursion',
    label: 'Group excursion',
    priceLabel: 'per person',
    attributes: [
      {
        key: 'durationHours',
        label: 'Duration',
        kind: 'WholeNumber',
        required: true,
        min: 1,
        maxLength: null,
      },
      {
        key: 'meetingPoint',
        label: 'Meeting point',
        kind: 'Text',
        required: false,
        min: null,
        maxLength: 10,
      },
    ],
  },
  {
    type: 'IndividualTransfer',
    label: 'Individual transfer',
    priceLabel: 'per car',
    attributes: [
      {
        key: 'durationHours',
        label: 'Duration',
        kind: 'WholeNumber',
        required: true,
        min: 1,
        maxLength: null,
      },
      {
        key: 'vehicle',
        label: 'Vehicle',
        kind: 'Text',
        required: true,
        min: null,
        maxLength: null,
      },
    ],
  },
];

const savedProduct: ProductDetails = {
  id: 'p1',
  type: 'GroupExcursion',
  typeLabel: 'Group excursion',
  name: 'Old town walk',
  seoDescription: 'Walk',
  shortDescription: '',
  description: '',
  price: 25,
  attributes: { durationHours: 3, meetingPoint: 'Square' },
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
    httpTestingController.expectOne('/api/product-types').flush(productTypes);
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

  const attributeLabels = (fixture: ComponentFixture<EditProductsPage>) =>
    [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll(
        'app-product-attributes-fields label',
      ),
    ].map((label) => label.textContent?.trim());

  const save = async () => {
    TestBed.inject(EditActionsService).run('save');
    await new Promise((resolve) => setTimeout(resolve));
  };

  it('shows the attribute fields of the product type with their saved values', async () => {
    const fixture = await render('p1', [savedProduct]);

    expect(attributeLabels(fixture)).toEqual(['Duration', 'Meeting point']);
    expect(productForm(fixture).getRawValue().attributes).toEqual({
      durationHours: 3,
      meetingPoint: 'Square',
    });
  });

  it('keeps the attributes both types share when the type changes and drops the others', async () => {
    const fixture = await render('p1', [savedProduct]);

    await edit(fixture, (form) => form.controls['type'].setValue('IndividualTransfer'));

    expect(attributeLabels(fixture)).toEqual(['Duration', 'Vehicle']);
    expect(productForm(fixture).getRawValue().attributes).toEqual({
      durationHours: 3,
      vehicle: null,
    });
  });

  it('checks the attributes against the rules of the type and sends nothing while they break them', async () => {
    const fixture = await render('p1', [savedProduct]);

    await edit(fixture, (form) =>
      form.controls['attributes'].setValue({ durationHours: 0, meetingPoint: 'Central station' }),
    );
    await save();
    await fixture.whenStable();

    httpTestingController.expectNone((request) => request.method === 'PUT');
    const errors = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll(
        'app-product-attributes-fields .error',
      ),
    ].map((error) => error.textContent?.trim());
    expect(errors).toEqual(['Enter 1 or more.', 'Use 10 characters or fewer.']);
  });

  it('creates a product as a one-item list and reopens the page with the new id', async () => {
    const fixture = await render();

    await edit(fixture, (form) => form.controls['type'].setValue('IndividualTransfer'));
    await edit(fixture, (form) =>
      form.patchValue({
        name: 'Airport transfer',
        seoDescription: 'Transfer',
        price: 40,
        attributes: { durationHours: 1, vehicle: 'Van' },
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
        description: '',
        seoDescription: 'Transfer',
        price: 40,
        attributes: { durationHours: 1, vehicle: 'Van' },
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
        description: '',
        seoDescription: 'Walk',
        price: 30,
        attributes: { durationHours: 3, meetingPoint: 'Square' },
      },
    ]);
  });
});
