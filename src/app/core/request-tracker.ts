import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, defer, finalize, tap } from 'rxjs';

export type EntityName = 'product' | 'order' | 'customer';
export type RequestOperation = 'list' | 'delete';
export type RequestName = `${EntityName}.${RequestOperation}`;

type CountKey = RequestName | 'any';

@Injectable({ providedIn: 'root' })
export class RequestTracker {
  private readonly counts = signal<ReadonlyMap<CountKey, number>>(new Map());
  private readonly errors = signal<ReadonlyMap<RequestName, HttpErrorResponse>>(new Map());

  isLoading(...names: RequestName[]): boolean {
    const counts = this.counts();
    return names.length === 0 ? counts.has('any') : names.some((name) => counts.has(name));
  }

  error(name: RequestName): HttpErrorResponse | undefined {
    return this.errors().get(name);
  }

  track(name?: RequestName) {
    return <T>(source: Observable<T>): Observable<T> =>
      defer(() => {
        this.start(name);
        return source.pipe(
          tap({ error: (error: unknown) => this.fail(name, error) }),
          finalize(() => this.changeCount(name, -1)),
        );
      });
  }

  private start(name: RequestName | undefined): void {
    this.changeCount(name, 1);
    if (name) {
      this.setError(name, undefined);
    }
  }

  private fail(name: RequestName | undefined, error: unknown): void {
    if (name && error instanceof HttpErrorResponse) {
      this.setError(name, error);
    }
  }

  private setError(name: RequestName, error: HttpErrorResponse | undefined): void {
    this.errors.update((errors) => {
      if (!error && !errors.has(name)) {
        return errors;
      }
      const next = new Map(errors);
      if (error) {
        next.set(name, error);
      } else {
        next.delete(name);
      }
      return next;
    });
  }

  private changeCount(name: RequestName | undefined, delta: number): void {
    this.counts.update((counts) => {
      const next = new Map(counts);
      const keys: CountKey[] = name ? ['any', name] : ['any'];
      for (const key of keys) {
        const count = (next.get(key) ?? 0) + delta;
        if (count > 0) {
          next.set(key, count);
        } else {
          next.delete(key);
        }
      }
      return next;
    });
  }
}
