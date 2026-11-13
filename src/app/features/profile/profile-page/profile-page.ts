import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import { UserProfile } from '@core/api/models';
import { PageTitle } from '@shared/page-title/page-title';

@Component({
  selector: 'app-profile-page',
  imports: [PageTitle],
  templateUrl: './profile-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  private readonly url = `${inject(API_BASE_URL)}/user-profile`;

  protected readonly profile = httpResource<UserProfile>(() => this.url);
}
