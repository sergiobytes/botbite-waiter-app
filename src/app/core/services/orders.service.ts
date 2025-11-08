import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { OrdersByDateResponse } from './types/orders.type';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private http = inject(HttpClient);
  apiUrl = environment.apiBaseUrl;

  getByDate(opts: { branchId: string; date: string }): Observable<number> {
    const params = new HttpParams().set('branchId', opts.branchId).set('date', opts.date);

    return this.http
      .get<OrdersByDateResponse>(`${this.apiUrl}/orders/by-date`, { params })
      .pipe(map((res: OrdersByDateResponse) => res.count));
  }
}
