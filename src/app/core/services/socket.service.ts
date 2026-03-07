import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CashierNotification {
  id: string;
  message: string;
  phoneNumber?: string;
  branchId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface NotificationUpdate {
  branchId: string;
  notification: CashierNotification;
}

@Injectable({
  providedIn: 'root',
})
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;
  private orderUpdateSubject = new Subject<{ branchId: string }>();
  private notificationSubject = new Subject<NotificationUpdate>();

  constructor() {
    this.connect();
  }

  private connect(): void {
    // Extraer el host base de la URL de la API
    const apiUrl = environment.apiBaseUrl.replace('/v1', '');

    this.socket = io(`${apiUrl}/orders`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('orderUpdate', (data: { branchId: string }) => {
      this.orderUpdateSubject.next(data);
    });

    this.socket.on('notificationUpdate', (data: NotificationUpdate) => {
      this.notificationSubject.next(data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  getOrderUpdates(): Observable<{ branchId: string }> {
    return this.orderUpdateSubject.asObservable();
  }

  getNotificationUpdates(): Observable<NotificationUpdate> {
    return this.notificationSubject.asObservable();
  }

  joinBranch(branchId: string): void {
    if (this.socket) {
      this.socket.emit('joinBranch', branchId);
      console.log(`Joined branch room: ${branchId}`);
    }
  }

  leaveBranch(branchId: string): void {
    if (this.socket) {
      this.socket.emit('leaveBranch', branchId);
      console.log(`Left branch room: ${branchId}`);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
