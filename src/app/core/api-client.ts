import { HttpClient, HttpParams, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

type ParamValue = string | number | boolean;

export interface ApiRequestOptions {
  readonly params?: HttpParams | Record<string, ParamValue | readonly ParamValue[]>;
}

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly httpClient = inject(HttpClient);

  readonly get = <T>(url: string, options?: ApiRequestOptions) =>
    this.httpClient.get<T>(url, options);

  readonly post = <T>(url: string, body: unknown, options?: ApiRequestOptions) =>
    this.httpClient.post<T>(url, body, options);

  readonly put = <T>(url: string, body: unknown, options?: ApiRequestOptions) =>
    this.httpClient.put<T>(url, body, options);

  readonly delete = <T>(url: string, options?: ApiRequestOptions) =>
    this.httpClient.delete<T>(url, options);

  readonly resource = <T>(url: () => string) => httpResource<T>(url);
}
