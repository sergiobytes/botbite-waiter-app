import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'shared-title',
  imports: [],
  templateUrl: './title.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TitleComponent {
  title = input.required<string>();
  description = input.required<string>();
}
