import { Injectable, computed, inject } from '@angular/core';
import { ApiClient } from '@core/api-client';
import { API_BASE_URL } from '@core/api-base-url';
import { ReferenceData } from '@core/api/models';

@Injectable({ providedIn: 'root' })
export class ReferenceDataService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly referenceData = inject(ApiClient).resource<ReferenceData>(
    () => `${this.apiBaseUrl}/reference-data`,
  );

  readonly productTypes = computed(() => this.referenceData.value()?.productTypes ?? []);
}
