import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { OrgService } from '../../../core/services/org.service';
import { OrdersService } from '../../../core/services/orders.service';
import { todayYYYYMMDD } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private org = inject(OrgService);
  private orders = inject(OrdersService);

  loadingToday = signal<boolean>(false);
  todayCount = signal<number>(0);
  availableMessages = signal<number>(0);
  branchQrUrl = signal<string>('');

  constructor() {
    effect(() => {
      const branchId = this.org.selectedBranchId();

      if (!branchId) {
        this.todayCount.set(0);
        this.availableMessages.set(0);
        this.branchQrUrl.set('');
        return;
      }
      this.fetchToday(branchId);
      this.availableMessages.set(this.org.selectedBranch()?.availableMessages ?? 0);
      this.branchQrUrl.set(this.org.selectedBranch()?.qrUrl ?? '');
    });
  }

  private fetchToday(branchId: string) {
    this.loadingToday.set(true);

    const date = todayYYYYMMDD();
    this.orders.getByDate({ branchId, date }).subscribe({
      next: (res) => {
        this.todayCount.set(res ?? 0);
        this.loadingToday.set(false);
      },
      error: () => {
        this.todayCount.set(0);
        this.loadingToday.set(false);
      },
    });
  }
}
