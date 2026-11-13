import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageTitle } from '@shared/page-title/page-title';

@Component({
  selector: 'app-home-page',
  imports: [PageTitle],
  templateUrl: './home-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}
