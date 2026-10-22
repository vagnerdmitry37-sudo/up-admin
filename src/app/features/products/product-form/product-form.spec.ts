import { TestBed } from '@angular/core/testing';
import { Product } from '@core/api/models';
import { ProductForm } from './product-form';

const product: Product = {
  id: 'p1',
  type: 'Transfer',
  name: 'Airport to hotel',
  description: 'Door to door',
  price: 40,
  attributes: {},
};

const type = (input: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event('input'));
};

describe('ProductForm', () => {
  const render = async (start?: Product) => {
    const fixture = TestBed.createComponent(ProductForm);
    if (start) {
      fixture.componentRef.setInput('product', start);
    }
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    return {
      fixture,
      form: fixture.componentInstance,
      name: element.querySelector('app-text-field input') as HTMLInputElement,
      description: element.querySelector('app-textarea-field textarea') as HTMLTextAreaElement,
      errors: () =>
        [...element.querySelectorAll('.error')]
          .map((error) => error.textContent?.trim())
          .filter(Boolean),
    };
  };

  it('fills the fields from the given product', async () => {
    const { form, name } = await render(product);

    expect(name.value).toBe('Airport to hotel');
    expect(form.validValue()).toEqual({
      type: 'Transfer',
      name: 'Airport to hotel',
      description: 'Door to door',
      price: 40,
    });
  });

  it('returns the edited values without an id', async () => {
    const { form, name } = await render(product);

    type(name, 'Hotel to airport');

    const value = form.validValue();
    expect(value?.name).toBe('Hotel to airport');
    expect(value).not.toHaveProperty('id');
  });

  it('returns nothing and shows the errors when the form is invalid', async () => {
    const { fixture, form, errors } = await render();

    expect(form.validValue()).toBeUndefined();
    await fixture.whenStable();

    expect(errors()).toEqual(['Enter a name.', 'Enter a description.']);
  });

  it('reports a valid form on save', async () => {
    const { form, name, description } = await render();
    const submitted = vi.fn();
    form.submitted.subscribe(submitted);
    type(name, 'Old Town Walk');
    type(description, 'Three hours');

    form.save();

    expect(submitted).toHaveBeenCalledWith({
      type: 'Excursion',
      name: 'Old Town Walk',
      description: 'Three hours',
      price: 0,
    });
  });

  it('does not report an invalid form on save', async () => {
    const { form } = await render();
    const submitted = vi.fn();
    form.submitted.subscribe(submitted);

    form.save();

    expect(submitted).not.toHaveBeenCalled();
  });
});
