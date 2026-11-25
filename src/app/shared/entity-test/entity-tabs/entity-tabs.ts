import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TabsModule } from '@openng/optimus-ui/tabs';

@Component({
  selector: 'app-entity-tabs',
  imports: [TabsModule],
  templateUrl: './entity-tabs.html',
  styleUrl: './entity-tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityTabs<T> {
  tabs = input.required<any[]>();
}
