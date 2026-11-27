import { Injectable, Signal, computed, signal } from '@angular/core';
import { Observable, defer, finalize, tap } from 'rxjs';

export type RequestName = 'products.list';
export type RequestStatus = 'loading' | 'completed';

export interface RequestState {
  readonly status: RequestStatus;
  readonly error?: unknown;
}

export class RequestCancelledError extends Error {
  constructor(readonly requestKey: string) {
    super(`Request "${requestKey}" was cancelled.`);
    this.name = 'RequestCancelledError';
  }
}

@Injectable({ providedIn: 'root' })
export class RequestTracker {
  private readonly states = signal<ReadonlyMap<string, RequestState>>(new Map());
  private readonly running = new Map<string, number>();

  status(key: RequestName): Signal<RequestState | undefined> {
    return computed(() => this.states().get(key));
  }

  track(key: RequestName) {
    return <T>(source: Observable<T>): Observable<T> =>
      defer(() => {
        this.start(key);
        let settled = false;
        const settle = (error?: unknown) => {
          if (!settled) {
            settled = true;
            this.finish(key, error);
          }
        };
        return source.pipe(
          tap({
            complete: () => settle(),
            error: (error: unknown) => settle(error),
          }),
          finalize(() => settle(new RequestCancelledError(key))),
        );
      });
  }

  private start(key: string): void {
    this.running.set(key, (this.running.get(key) ?? 0) + 1);
    this.publish(key, { status: 'loading' });
  }

  private finish(key: string, error?: unknown): void {
    const remaining = (this.running.get(key) ?? 1) - 1;
    if (remaining > 0) {
      this.running.set(key, remaining);
      return;
    }
    this.running.delete(key);
    this.publish(key, { status: 'completed', error });
  }

  private publish(key: string, state: RequestState): void {
    this.states.update((states) => new Map(states).set(key, state));
  }
}
