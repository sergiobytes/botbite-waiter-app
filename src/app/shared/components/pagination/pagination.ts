import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  imports: [],
  templateUrl: './pagination.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  total = input.required<number>();
  pageFrom = input.required<number>();
  pageTo = input.required<number>();

  canPrev = input.required<boolean>();
  canNext = input.required<boolean>();

  currentLimit = input<number>(10);
  showLimitSelector = input<boolean>(true);

  previousPage = output<void>();
  nextPage = output<void>();
  limitChange = output<Event>();
}
