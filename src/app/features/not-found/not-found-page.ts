import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageTitle } from '@shared/page-title/page-title';

@Component({
  selector: 'app-not-found-page',
  imports: [PageTitle, RouterLink],
  templateUrl: './not-found-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
