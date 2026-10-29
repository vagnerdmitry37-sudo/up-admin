import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import { firstValueFrom } from 'rxjs';
import { AccessToken } from './api/models';

const TOKEN_EXPIRY_MARGIN_MS = 1000;

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly httpClient = inject(HttpClient);
  private readonly authUrl = `${inject(API_BASE_URL)}/auth`;
  private readonly token = signal<string | null>(null);
  private expiresAt: number | null = null;
  private refreshing: Promise<string | null> | null = null;

  readonly accessToken = this.token.asReadonly();
  readonly isAuthenticated = computed(() => this.token() !== null);

  async login(email: string, password: string): Promise<boolean> {
    try {
      await this.requestToken('login', { email, password });
      return true;
    } catch (error) {
      if (this.isRejectedCredential(error)) {
        return false;
      }
      throw error;
    }
  }

  restore = () => this.refresh().catch(() => null);

  isExpired = () =>
    this.token() !== null &&
    this.expiresAt !== null &&
    this.expiresAt - Date.now() <= TOKEN_EXPIRY_MARGIN_MS;

  refresh(): Promise<string | null> {
    this.refreshing ??= this.requestRefresh().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.httpClient.post<void>(`${this.authUrl}/logout`, {}));
    } finally {
      this.clearToken();
    }
  }

  private async requestRefresh(): Promise<string | null> {
    try {
      return await this.requestToken('refresh', {});
    } catch (error) {
      if (!this.isRejectedCredential(error)) {
        throw error;
      }
      this.clearToken();
      return null;
    }
  }

  private async requestToken(endpoint: 'login' | 'refresh', body: object): Promise<string> {
    const { accessToken, expiresAt } = await firstValueFrom(
      this.httpClient.post<AccessToken>(`${this.authUrl}/${endpoint}`, body),
    );
    this.expiresAt = Date.parse(expiresAt);
    this.token.set(accessToken);
    return accessToken;
  }

  private clearToken(): void {
    this.expiresAt = null;
    this.token.set(null);
  }

  private isRejectedCredential(error: unknown) {
    const rejectedCredentialStatuses = [400, 401];
    return error instanceof HttpErrorResponse && rejectedCredentialStatuses.includes(error.status);
  }
}
