import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { Order, OrderListResponse } from './types/orders.type';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private http = inject(HttpClient);
  apiUrl = environment.apiBaseUrl;

  getAll(opts: { branchId: string; date: string }): Observable<Order[]> {
    const params = new HttpParams().set('branchId', opts.branchId).set('date', opts.date);

    return this.http
      .get<OrderListResponse>(`${this.apiUrl}/orders`, { params })
      .pipe(map((res: OrderListResponse) => res.orders));
  }
}
