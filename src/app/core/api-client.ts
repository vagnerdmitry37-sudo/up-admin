import { HttpClient, HttpParams, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RequestName, RequestTracker } from '@core/request-tracker';
import { Observable } from 'rxjs';

type ParamValue = string | number | boolean;

export interface ApiRequestOptions {
  readonly params?: HttpParams | Record<string, ParamValue | readonly ParamValue[]>;
  readonly track?: RequestName;
}

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly httpClient = inject(HttpClient);
  private readonly tracker = inject(RequestTracker);

  private tracked<T>(request: Observable<T>, name: RequestName | undefined): Observable<T> {
    return name ? request.pipe(this.tracker.track(name)) : request;
  }

  readonly get = <T>(url: string, options?: ApiRequestOptions) =>
    this.tracked(this.httpClient.get<T>(url, options), options?.track);

  readonly post = <T>(url: string, body: unknown, options?: ApiRequestOptions) =>
    this.tracked(this.httpClient.post<T>(url, body, options), options?.track);

  readonly put = <T>(url: string, body: unknown, options?: ApiRequestOptions) =>
    this.tracked(this.httpClient.put<T>(url, body, options), options?.track);

  readonly delete = <T>(url: string, options?: ApiRequestOptions) =>
    this.tracked(this.httpClient.delete<T>(url, options), options?.track);

  readonly resource = <T>(url: () => string) => httpResource<T>(url);
}
