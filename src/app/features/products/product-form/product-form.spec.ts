import { TestBed } from '@angular/core/testing';
import { Product } from '@core/api/models';
import { ProductForm } from './product-form';

const product: Product = {
  id: 'p1',
  type: 'IndividualTransfer',
  typeLabel: 'Individual transfer',
  name: 'Airport to hotel',
  description: 'Door to door',
  seoDescription: '',
  shortDescription: '',
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

  it('does not report an invalid form on save', async () => {
    const { form } = await render();
    const submitted = vi.fn();
    form.submitted.subscribe(submitted);

    form.save();

    expect(submitted).not.toHaveBeenCalled();
  });

  it('has no unsaved changes when it shows a product as loaded', async () => {
    const { form } = await render(product);

    expect(form.hasUnsavedChanges()).toBe(false);
  });

  it('has unsaved changes once a field is edited, and none once it is saved', async () => {
    const { form, name, fixture } = await render(product);

    type(name, 'Night transfer');
    await fixture.whenStable();
    expect(form.hasUnsavedChanges()).toBe(true);

    form.markSaved();
    await fixture.whenStable();
    expect(form.hasUnsavedChanges()).toBe(false);
  });

  it('has unsaved changes while images are pending, and none once they are cleared', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    const { form, fixture } = await render(product);
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'app-image-upload input[type="file"]',
    )!;
    Object.defineProperty(input, 'files', {
      value: [new File(['a'], 'photo.jpg', { type: 'image/jpeg' })],
    });
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(form.hasUnsavedChanges()).toBe(true);

    form.clearPendingImages();
    await fixture.whenStable();
    expect(form.hasUnsavedChanges()).toBe(false);
  });
});
