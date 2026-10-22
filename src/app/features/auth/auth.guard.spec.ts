import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { SessionService } from '@core/session.service';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';

const runGuard = (guard: typeof authGuard) =>
  TestBed.runInInjectionContext(() => guard({}, [], {} as Parameters<typeof authGuard>[2]));

describe('auth guards', () => {
  let authenticated: boolean;

  beforeEach(() => {
    authenticated = false;
    TestBed.configureTestingModule({
      providers: [{ provide: SessionService, useValue: { isAuthenticated: () => authenticated } }],
    });
  });

  it('authGuard lets a signed-in user through', () => {
    authenticated = true;

    expect(runGuard(authGuard)).toBe(true);
  });

  it('authGuard sends a guest to the login page', () => {
    const result = runGuard(authGuard) as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login');
  });

  it('guestGuard lets a guest through', () => {
    expect(runGuard(guestGuard)).toBe(true);
  });

  it('guestGuard sends a signed-in user to the home page', () => {
    authenticated = true;

    const result = runGuard(guestGuard) as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/');
  });
});
