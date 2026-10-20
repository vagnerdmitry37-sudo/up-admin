import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import { firstValueFrom } from 'rxjs';

interface AccessTokenResponse {
  accessToken: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = `${inject(API_BASE_URL)}/auth`;
  private readonly token = signal<string | null>(null);
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

  refresh(): Promise<string | null> {
    this.refreshing ??= this.requestRefresh().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post<void>(`${this.authUrl}/logout`, {}));
    } finally {
      this.token.set(null);
    }
  }

  private async requestRefresh(): Promise<string | null> {
    try {
      return await this.requestToken('refresh', {});
    } catch (error) {
      if (!this.isRejectedCredential(error)) {
        throw error;
      }
      this.token.set(null);
      return null;
    }
  }

  private async requestToken(endpoint: 'login' | 'refresh', body: object): Promise<string> {
    const { accessToken } = await firstValueFrom(
      this.http.post<AccessTokenResponse>(`${this.authUrl}/${endpoint}`, body),
    );
    this.token.set(accessToken);
    return accessToken;
  }

  private isRejectedCredential(error: unknown) {
    const rejectedCredentialStatuses = [400, 401];
    return error instanceof HttpErrorResponse && rejectedCredentialStatuses.includes(error.status);
  }
}
