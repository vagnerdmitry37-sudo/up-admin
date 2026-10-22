import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormShell } from './form-shell';

describe('FormShell', () => {
  const render = (value: string) => {
    const form = new FormGroup({ name: new FormControl(value, Validators.required) });
    const fixture = TestBed.createComponent(FormShell);
    fixture.componentRef.setInput('heading', 'New product');
    fixture.componentRef.setInput('form', form);
    const submitted = vi.fn();
    fixture.componentInstance.submitted.subscribe(submitted);
    return { shell: fixture.componentInstance, form, submitted, fixture };
  };

  it('shows the heading', async () => {
    const { fixture } = render('Walk');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('New product');
  });

  it('reports a valid form as submitted', () => {
    const { shell, submitted } = render('Walk');

    shell.submit();

    expect(submitted).toHaveBeenCalledTimes(1);
  });

  it('marks an invalid form touched instead of submitting it', () => {
    const { shell, form, submitted } = render('');

    shell.submit();

    expect(submitted).not.toHaveBeenCalled();
    expect(form.controls.name.touched).toBe(true);
  });
});
