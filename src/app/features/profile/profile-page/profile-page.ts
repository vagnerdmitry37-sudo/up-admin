import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import { UserProfile } from '../user-profile';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  private readonly url = `${inject(API_BASE_URL)}/user-profile`;

  protected readonly profile = httpResource<UserProfile>(() => this.url);
}
