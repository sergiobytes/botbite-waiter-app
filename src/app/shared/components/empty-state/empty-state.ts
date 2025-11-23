import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  imports: [],
  templateUrl: './empty-state.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  loading = input.required<boolean>();
  isEmpty = input.required<boolean>();
  colspan = input.required<number>();
  message = input<string>('No hay registros para mostrar.');
}
