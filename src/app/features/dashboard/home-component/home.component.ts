import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { OrgService } from '../../../core/services/org.service';
import { OrdersService } from '../../../core/services/orders.service';
import { todayYYYYMMDD } from '../../../shared/utils/date.utils';
import { BranchesService } from '../../../core/services/branches.service';
import { ToastrService } from 'ngx-toastr';
import { Order } from '../../../core/services/types/orders.type';
import { Branch } from '../../../core/services/types/branches.types';
import { catchError, finalize, of } from 'rxjs';

interface MetricCard {
  label: string;
  value: string | number;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly org = inject(OrgService);
  private readonly orders = inject(OrdersService);
  private readonly branches = inject(BranchesService);
  private readonly toast = inject(ToastrService);

  protected readonly loadingToday = signal<boolean>(false);
  protected readonly generatingQr = signal<boolean>(false);
  protected readonly downloadingQr = signal<boolean>(false);

  private readonly todayCount = signal<number>(0);
  private readonly avgInteractions = signal<number>(0);
  protected readonly availableMessages = signal<number>(0);
  protected readonly branchQrUrl = signal<string>('');

  protected readonly metrics = computed<MetricCard[]>(() => [
    {
      label: 'Órdenes totales',
      value: this.todayCount(),
    },
    {
      label: 'Mensajes disponibles',
      value: this.availableMessages(),
    },
    {
      label: 'Interacciones promedio con el asistente',
      value: this.avgInteractions(),
    },
  ]);

  constructor() {
    effect(() => {
      const branchId = this.org.selectedBranchId();

      if (!branchId) {
        this.resetMetrics();
        this.branchQrUrl.set('');
        return;
      }

      this.fetchToday(branchId);
      this.availableMessages.set(this.org.selectedBranch()?.availableMessages ?? 0);
      this.branchQrUrl.set(this.org.selectedBranch()?.qrUrl ?? '');
    });
  }

  private fetchToday(branchId: string): void {
    this.loadingToday.set(true);

    const date = todayYYYYMMDD();
    this.orders
      .getAll({ branchId, date })
      .pipe(
        catchError(() => {
          this.resetMetrics();
          return of([]);
        }),
        finalize(() => this.loadingToday.set(false))
      )
      .subscribe((orders) => {
        this.updateMetrics(orders);
      });
  }

  private updateMetrics(orders: Order[]): void {
    this.todayCount.set(orders.length);

    if (orders.length > 0) {
      const totalInteractions = orders.reduce((acc, order) => acc + order.interactions, 0);
      this.avgInteractions.set(Math.round(totalInteractions / orders.length));
    } else {
      this.avgInteractions.set(0);
    }
  }

  private resetMetrics(): void {
    this.todayCount.set(0);
    this.avgInteractions.set(0);
    this.availableMessages.set(0);
  }

  generateBranchQr(): void {
    const { restaurantId, branchId } = this.getSelectedIds();

    if (!this.validateSelection(restaurantId, branchId) || this.generatingQr()) {
      return;
    }

    this.generatingQr.set(true);

    this.branches
      .generateQr(restaurantId!, branchId!)
      .pipe(
        catchError(() => {
          this.toast.error('Error al generar el QR');
          return of({ qrUrl: '' });
        }),
        finalize(() => this.generatingQr.set(false))
      )
      .subscribe(({ qrUrl }) => {
        this.handleQrGenerated(qrUrl);
      });
  }

  private getSelectedIds(): { restaurantId: string | null; branchId: string | null } {
    return {
      restaurantId: this.org.selectedRestaurantId(),
      branchId: this.org.selectedBranchId(),
    };
  }

  private validateSelection(restaurantId: string | null, branchId: string | null): boolean {
    if (!restaurantId) {
      this.toast.warning('Necesitas tener un restaurante para generar el QR');
      return false;
    }

    if (!branchId) {
      this.toast.warning('Necesitas tener una sucursal para generar el QR');
      return false;
    }

    return true;
  }

  private handleQrGenerated(qrUrl: string): void {
    if (qrUrl) {
      this.org.updateSelectedBranch({ qrUrl });
      this.toast.success('QR generado correctamente');
    } else {
      this.toast.warning('Se generó el QR pero no se recibió la URL');
    }
  }

  async downloadBranchQr(): Promise<void> {
    const url = this.branchQrUrl();
    const branch = this.org.selectedBranch();

    if (!url || !branch) return;

    this.downloadingQr.set(true);

    try {
      await this.downloadQrDirectly(url, branch);
      this.toast.success('Descarga iniciada');
    } catch {
      this.handleDownloadFallback(url);
    } finally {
      this.downloadingQr.set(false);
    }
  }

  private async downloadQrDirectly(url: string, branch: Branch): Promise<void> {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    const filename = this.generateQrFilename(branch, blob);

    this.triggerDownload(blob, filename);
  }

  private generateQrFilename(branch: Branch, blob: Blob): string {
    const ext = (blob.type?.split('/')?.[1] || 'png').replace('+xml', '');
    const sanitizedName = branch.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    return `qr-${sanitizedName}.${ext}`;
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(objectUrl);
  }

  private handleDownloadFallback(url: string): void {
    this.toast.info('No se pudo descargar automáticamente. Abriendo en nueva pestaña.');
    window.open(url, '_blank');
  }
}
