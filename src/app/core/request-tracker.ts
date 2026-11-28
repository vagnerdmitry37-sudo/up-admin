import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, defer, finalize, tap } from 'rxjs';

export type EntityName = 'product' | 'order' | 'customer';
export type RequestOperation = 'list' | 'get' | 'delete';

export interface TrackedRequest {
  readonly entity: EntityName;
  readonly operation: RequestOperation;
}

type Query = Partial<TrackedRequest> & Pick<TrackedRequest, 'operation'>;

interface FailedRequest {
  readonly request: TrackedRequest;
  readonly error: HttpErrorResponse;
}

const sameRequest = (a: TrackedRequest, b: TrackedRequest) =>
  a.entity === b.entity && a.operation === b.operation;

const matches = (request: TrackedRequest, query: Query) =>
  request.operation === query.operation && (!query.entity || request.entity === query.entity);

@Injectable({ providedIn: 'root' })
export class RequestTracker {
  private readonly running = signal<readonly TrackedRequest[]>([]);
  private readonly failures = signal<readonly FailedRequest[]>([]);

  isLoading(query: Query, ...more: Query[]): boolean {
    const queries = [query, ...more];
    return this.running().some((request) => queries.some((each) => matches(request, each)));
  }

  error(request: TrackedRequest): HttpErrorResponse | undefined {
    return this.failures().find((failure) => sameRequest(failure.request, request))?.error;
  }

  track(request?: TrackedRequest) {
    return <T>(source: Observable<T>): Observable<T> =>
      request ? defer(() => this.watch(request, source)) : source;
  }

  private watch<T>(request: TrackedRequest, source: Observable<T>): Observable<T> {
    const entry: TrackedRequest = { ...request };
    this.running.update((running) => [...running, entry]);
    this.clearError(request);
    return source.pipe(
      tap({ error: (error: unknown) => this.fail(request, error) }),
      finalize(() => this.running.update((running) => running.filter((each) => each !== entry))),
    );
  }

  private fail(request: TrackedRequest, error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      this.failures.update((failures) => [
        ...failures.filter((failure) => !sameRequest(failure.request, request)),
        { request, error },
      ]);
    }
  }

  private clearError(request: TrackedRequest): void {
    if (this.failures().some((failure) => sameRequest(failure.request, request))) {
      this.failures.update((failures) =>
        failures.filter((failure) => !sameRequest(failure.request, request)),
      );
    }
  }
}
