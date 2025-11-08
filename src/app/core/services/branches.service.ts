import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BranchesService {
  private http = inject(HttpClient);
  apiUrl = environment.apiBaseUrl;

  generateQr(restaurantId: string, branchId: string): Observable<{ qrUrl: string }> {
    const url = `${this.apiUrl}/branches/generate-qr/${restaurantId}/${branchId}`;

    return this.http.post<{ qrUrl: string }>(url, {}).pipe(
      map((res) => {
        return res;
      })
    );
  }
}
