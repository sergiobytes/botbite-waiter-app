import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { OrderDetails, OrdersList } from './types/orders.type';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private http = inject(HttpClient);
  apiUrl = environment.apiBaseUrl;

  getAll(opts: { branchId: string; date: string }): Observable<OrderDetails[]> {
    const params = new HttpParams().set('branchId', opts.branchId).set('date', opts.date);

    return this.http
      .get<OrdersList>(`${this.apiUrl}/orders`, { params })
      .pipe(map((res: OrdersList) => res.orders));
  }
}
