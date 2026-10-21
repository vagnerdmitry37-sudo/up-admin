import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IftaLabel } from '@openng/optimus-ui/iftalabel';
import { FormField } from '../form-field';

@Component({
  selector: 'app-field-frame',
  imports: [IftaLabel],
  templateUrl: './field-frame.html',
  styleUrl: './field-frame.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldFrame {
  protected readonly field = inject(FormField);
}
