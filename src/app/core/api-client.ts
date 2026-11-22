import { HttpClient, HttpContext, HttpParams, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ActivityEntity, REQUEST_TAG, RequestTag } from '@core/http-activity.service';

type ParamValue = string | number | boolean;

export interface ApiRequestOptions extends Omit<RequestTag, 'entity'> {
  readonly params?: HttpParams | Record<string, ParamValue | readonly ParamValue[]>;
}

const requestOptions = (
  entity: ActivityEntity,
  { params, untracked, handledStatuses }: ApiRequestOptions = {},
) => ({
  params,
  context: new HttpContext().set(REQUEST_TAG, { entity, untracked, handledStatuses }),
});

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly httpClient = inject(HttpClient);

  readonly forEntity = (entity: ActivityEntity) => ({
    get: <T>(url: string, options?: ApiRequestOptions) =>
      this.httpClient.get<T>(url, requestOptions(entity, options)),
    post: <T>(url: string, body: unknown, options?: ApiRequestOptions) =>
      this.httpClient.post<T>(url, body, requestOptions(entity, options)),
    put: <T>(url: string, body: unknown, options?: ApiRequestOptions) =>
      this.httpClient.put<T>(url, body, requestOptions(entity, options)),
    delete: <T>(url: string, options?: ApiRequestOptions) =>
      this.httpClient.delete<T>(url, requestOptions(entity, options)),
    resource: <T>(url: () => string) =>
      httpResource<T>(() => ({ url: url(), context: requestOptions(entity).context })),
  });
}
