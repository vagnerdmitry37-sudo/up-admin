import { Route } from '@angular/router';

export interface AppRouteData {
  heading: string;
  editPage?: boolean;
}

export interface AppRoute extends Route {
  data?: Partial<AppRouteData>;
  children?: AppRoute[];
}
