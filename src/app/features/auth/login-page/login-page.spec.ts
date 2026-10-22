import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SessionService } from '@core/session.service';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let login: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  const render = async () => {
    const fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const type = (selector: string, value: string) => {
      const input = element.querySelector(selector) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const submit = async () => {
      element.querySelector('form')?.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };
    return { element, type, submit };
  };

  beforeEach(() => {
    login = vi.fn();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SessionService, useValue: { login } }],
    });
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  it('shows the field errors and does not sign in when the form is empty', async () => {
    const { element, submit } = await render();

    await submit();

    expect(login).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Enter a valid email.');
    expect(element.textContent).toContain('Enter your password.');
  });

  it('signs in and opens the home page', async () => {
    login.mockResolvedValue(true);
    const { type, submit } = await render();
    type('#email', 'seller@example.com');
    type('#password', 'secret');

    await submit();

    expect(login).toHaveBeenCalledWith('seller@example.com', 'secret');
    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('tells the user when the email or password is wrong', async () => {
    login.mockResolvedValue(false);
    const { element, type, submit } = await render();
    type('#email', 'seller@example.com');
    type('#password', 'wrong');

    await submit();

    expect(element.textContent).toContain('Email or password is incorrect.');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
