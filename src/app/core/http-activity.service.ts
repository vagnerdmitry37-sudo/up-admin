import { Injectable, signal } from '@angular/core';
import { Observable, Subject, filter } from 'rxjs';

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type RequestStatus = 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface TrackedRequest {
  readonly id: number;
  readonly method: RequestMethod;
  readonly url: string;
  readonly status: RequestStatus;
}

@Injectable({ providedIn: 'root' })
export class HttpActivity {
  private nextId = 0;
  private readonly runningRequests = signal<readonly TrackedRequest[]>([]);
  private readonly statusChanges = new Subject<TrackedRequest>();

  readonly running = this.runningRequests.asReadonly();
  readonly changes: Observable<TrackedRequest> = this.statusChanges.asObservable();

  readonly isRunning = (method?: RequestMethod) =>
    this.runningRequests().some((request) => method === undefined || request.method === method);

  readonly on = (method: RequestMethod, status?: RequestStatus) =>
    this.changes.pipe(
      filter(
        (request) =>
          request.method === method && (status === undefined || request.status === status),
      ),
    );

  readonly start = (method: RequestMethod, url: string): TrackedRequest => {
    const request: TrackedRequest = { id: ++this.nextId, method, url, status: 'running' };
    this.runningRequests.update((requests) => [...requests, request]);
    this.statusChanges.next(request);
    return request;
  };

  readonly finish = (request: TrackedRequest, status: Exclude<RequestStatus, 'running'>) => {
    if (!this.runningRequests().includes(request)) {
      return;
    }
    this.runningRequests.update((requests) => requests.filter((running) => running !== request));
    this.statusChanges.next({ ...request, status });
  };
}
