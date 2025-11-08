import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { OrgService } from '../../../core/services/org.service';
import { OrdersService } from '../../../core/services/orders.service';
import { todayYYYYMMDD } from '../../../shared/utils/date.utils';
import { BranchesService } from '../../../core/services/branches.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private org = inject(OrgService);
  private orders = inject(OrdersService);
  private branches = inject(BranchesService);
  private toast = inject(ToastrService);

  loadingToday = signal<boolean>(false);
  generatingQr = signal<boolean>(false);

  todayCount = signal<number>(0);
  avgInteractions = signal<number>(0);
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
    this.orders.getAll({ branchId, date }).subscribe({
      next: (res) => {
        this.todayCount.set(res.length);

        const totalInteractions = res.reduce((acc, order) => acc + order.interactions, 0);
        this.avgInteractions.set(totalInteractions / res.length);

        this.loadingToday.set(false);
      },
      error: () => {
        this.todayCount.set(0);
        this.loadingToday.set(false);
      },
    });
  }

  generateBranchQr() {
    const restaurantId = this.org.selectedRestaurantId();
    const branchId = this.org.selectedBranchId();

    if (!restaurantId) {
      this.toast.warning('Necesitas tener un restaurante para generar el QR');
      return;
    }

    if (!branchId) {
      this.toast.warning('Necesitas tener una sucursal para generar el QR');
      return;
    }

    if (this.generatingQr()) {
      return;
    }

    this.generatingQr.set(true);

    this.branches.generateQr(restaurantId, branchId).subscribe({
      next: ({ qrUrl }) => {
        if (qrUrl) {
          this.org.updateSelectedBranch({ qrUrl });
          this.toast.success('QR generado correctamente');
        } else {
          this.toast.warning('Se generó el QR pero no se recibió la URL');
        }
        this.generatingQr.set(false);
      },
      error: () => {
        this.toast.error('Error al generar el QR');
        this.generatingQr.set(false);
      },
    });
  }
}
