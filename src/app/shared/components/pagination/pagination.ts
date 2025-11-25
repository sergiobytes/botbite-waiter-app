import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { IconsService } from '../../../core/services/icons.service';

@Component({
  selector: 'app-pagination',
  imports: [LucideAngularModule],
  templateUrl: './pagination.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  protected readonly iconsService = inject(IconsService);

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
