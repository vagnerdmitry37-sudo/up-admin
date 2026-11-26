import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { routeTitles } from './route-titles';

@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = routeTitles(snapshot.root).join(' / ');
    this.title.setTitle(pageTitle ? `${pageTitle} · UP` : 'UP');
  }
}
