import { HttpClient, HttpContext, HttpParams, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TrackedRequest } from '@core/request-tracker';
import { TRACKED_REQUEST } from '@core/request-tracker.interceptor';

type ParamValue = string | number | boolean;

export interface ApiRequestOptions {
  readonly params?: HttpParams | Record<string, ParamValue | readonly ParamValue[]>;
  readonly track?: TrackedRequest;
}

const httpOptions = (options?: ApiRequestOptions) => {
  return {
    params: options?.params,
    context: new HttpContext().set(TRACKED_REQUEST, options?.track),
  };
};

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly httpClient = inject(HttpClient);

  readonly get = <T>(url: string, options?: ApiRequestOptions) =>
    this.httpClient.get<T>(url, httpOptions(options));

  readonly post = <T>(url: string, body: unknown, options?: ApiRequestOptions) =>
    this.httpClient.post<T>(url, body, httpOptions(options));

  readonly put = <T>(url: string, body: unknown, options?: ApiRequestOptions) =>
    this.httpClient.put<T>(url, body, httpOptions(options));

  readonly delete = <T>(url: string, options?: ApiRequestOptions) =>
    this.httpClient.delete<T>(url, httpOptions(options));

  readonly resource = <T>(url: () => string) => httpResource<T>(url);
}
