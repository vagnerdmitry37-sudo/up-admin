import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-form-row',
  template: '<ng-content />',
  styleUrl: './form-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormRow {}
