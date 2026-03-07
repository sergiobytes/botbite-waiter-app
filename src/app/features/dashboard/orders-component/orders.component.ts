import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { IconsService } from '../../../core/services/icons.service';
import { OrdersService } from '../../../core/services/orders.service';
import { OrgService } from '../../../core/services/org.service';
import { SocketService } from '../../../core/services/socket.service';
import { TitleComponent } from '../../../shared/components/title/title';
import { Conversation } from '../../../core/services/types/conversations.types';

interface OrderDetails {
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

@Component({
  selector: 'app-orders.component',
  imports: [CommonModule, LucideAngularModule, TitleComponent],
  templateUrl: './orders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersComponent implements OnInit, OnDestroy {
  protected readonly orgService = inject(OrgService);
  private readonly ordersService = inject(OrdersService);
  private readonly toastrService = inject(ToastrService);
  private readonly socketService = inject(SocketService);
  protected readonly iconsService = inject(IconsService);

  protected readonly activeOrders = signal<Conversation[]>([]);
  private socketSubscription?: Subscription;

  ngOnInit(): void {
    const branchId = this.orgService.selectedBranchId();

    if (!branchId) {
      this.toastrService.error('No se ha seleccionado una sucursal.');
      return;
    }

    // Unirse a la room de la sucursal
    this.socketService.joinBranch(branchId);

    this.loadOrders(branchId);

    this.socketSubscription = this.socketService
      .getOrderUpdates()
      .subscribe(() => {
        this.loadOrders(branchId);
      });
  }

  private loadOrders(branchId: string): void {
    this.ordersService.activeOrders(branchId).subscribe({
      next: (orders) => {
        this.activeOrders.set(orders.conversations);
      },
      error: () => {
        this.toastrService.error('Error al cargar las órdenes activas.');
      },
    });
  }

  ngOnDestroy(): void {
    this.socketSubscription?.unsubscribe();
    this.activeOrders.set([]);
  }

  transformLastOrderSentToCashier(
    orderData: Record<
      string,
      { price: number; quantity: number; menuItemId: string; notes?: string }
    >
  ): OrderDetails[] {
    const details: OrderDetails[] = [];

    Object.entries(orderData).forEach((detail) => {
      const name = detail[0].split('||').at(0) ?? 'Desconocido';
      const price = detail[1].price;
      const quantity = detail[1].quantity;
      const notes = detail[1].notes ?? '';

      details.push({
        name,
        price,
        quantity,
        notes,
      });
    });

    return details;
  }

  calculateTotal(
    orderData: Record<
      string,
      { price: number; quantity: number; menuItemId: string; notes?: string }
    >
  ): number {
    return Object.values(orderData).reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  }
}
