import { TestBed } from '@angular/core/testing';
import { Activity, HttpActivity } from '@core/http-activity.service';
import { NavMenu } from './nav-menu';

const SPINNER_TURN_MS = 2000;

describe('NavMenu', () => {
  let httpActivity: HttpActivity;

  const render = () => {
    const fixture = TestBed.createComponent(NavMenu);
    TestBed.tick();
    const element: HTMLElement = fixture.nativeElement;
    const button = () => element.querySelector<HTMLButtonElement>('button.trigger')!;
    const spinnerShown = () =>
      element.querySelector('app-progress-ring p-progress-spinner') !== null;
    return { button, spinnerShown };
  };

  const startRequest = () => {
    const request = httpActivity.start({ kind: 'request', method: 'GET', url: '/api/products' });
    TestBed.tick();
    return request;
  };

  const finish = (request: Activity) => {
    httpActivity.finish(request, 'succeeded');
    TestBed.tick();
  };

  const advance = (ms: number) => {
    vi.advanceTimersByTime(ms);
    TestBed.tick();
  };

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [NavMenu] });
    httpActivity = TestBed.inject(HttpActivity);
  });

  afterEach(() => vi.useRealTimers());

  it('shows no busy ring while nothing is loading', () => {
    const { button, spinnerShown } = render();

    expect(spinnerShown()).toBe(false);
    expect(button().hasAttribute('aria-busy')).toBe(false);
    expect(button().classList).not.toContain('trigger-busy');
  });

  it('marks the menu button busy while a request is in flight', () => {
    const { button, spinnerShown } = render();

    startRequest();

    expect(spinnerShown()).toBe(true);
    expect(button().getAttribute('aria-busy')).toBe('true');
    expect(button().classList).toContain('trigger-busy');
  });

  it('ignores operations that send no request of their own', () => {
    const { spinnerShown } = render();

    httpActivity.start({ kind: 'operation', operation: 'save', source: 'action-menu' });
    TestBed.tick();

    expect(spinnerShown()).toBe(false);
  });

  it('keeps a fast request spinning for one full turn before clearing', () => {
    const { button, spinnerShown } = render();

    finish(startRequest());
    advance(SPINNER_TURN_MS - 1);

    expect(spinnerShown()).toBe(true);
    expect(button().getAttribute('aria-busy')).toBe('true');

    advance(1);

    expect(spinnerShown()).toBe(false);
    expect(button().hasAttribute('aria-busy')).toBe(false);
    expect(button().classList).not.toContain('trigger-busy');
  });

  it('clears straight away when a request outlasted one turn', () => {
    const { spinnerShown } = render();
    const request = startRequest();

    advance(SPINNER_TURN_MS * 2);
    finish(request);
    advance(0);

    expect(spinnerShown()).toBe(false);
  });

  it('keeps spinning when a new request starts before the turn ends', () => {
    const { spinnerShown } = render();

    finish(startRequest());
    advance(SPINNER_TURN_MS / 2);
    const second = startRequest();
    advance(SPINNER_TURN_MS);

    expect(spinnerShown()).toBe(true);

    finish(second);
    advance(0);

    expect(spinnerShown()).toBe(false);
  });
});
