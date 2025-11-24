import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { Branch, BranchListResponse } from './types/branches.types';
import { OrgService } from './org.service';

@Injectable({
  providedIn: 'root',
})
export class BranchesService {
  private readonly http = inject(HttpClient);
  private readonly orgService = inject(OrgService);
  private readonly apiUrl = environment.apiBaseUrl;

  generateQr(restaurantId: string, branchId: string): Observable<{ qrUrl: string }> {
    const url = `${this.apiUrl}/branches/generate-qr/${restaurantId}/${branchId}`;
    return this.http.post<{ qrUrl: string }>(url, {});
  }

  listByRestaurant(params: {
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Observable<BranchListResponse> {
    const restaurantId = this.orgService.selectedRestaurantId();

    if (!restaurantId) {
      throw new Error('No restaurant selected');
    }

    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.isActive !== undefined) {
      httpParams = httpParams.set('isActive', params.isActive.toString());
    }
    if (params.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.offset !== undefined) {
      httpParams = httpParams.set('offset', params.offset.toString());
    }

    return this.http.get<BranchListResponse>(`${this.apiUrl}/branches/restaurant/${restaurantId}`, {
      params: httpParams,
    });
  }

  create(newBranch: Partial<Branch>): Observable<Branch> {
    const restaurantId = this.orgService.selectedRestaurantId();

    if (!restaurantId) {
      throw new Error('No restaurant selected');
    }

    return this.http
      .post<Branch>(`${this.apiUrl}/branches/${restaurantId}`, newBranch)
      .pipe(tap(() => this.orgService.refreshGlobalBranches()));
  }

  update(branchId: string, updatedBranch: Partial<Branch>): Observable<Branch> {
    const restaurantId = this.orgService.selectedRestaurantId();

    if (!restaurantId) {
      throw new Error('No restaurant selected');
    }

    return this.http
      .patch<Branch>(`${this.apiUrl}/branches/restaurant/${restaurantId}/${branchId}`, {
        ...updatedBranch,
      })
      .pipe(tap(() => this.orgService.refreshGlobalBranches()));
  }

  activate(branchId: string): Observable<Branch> {
    const restaurantId = this.orgService.selectedRestaurantId();

    if (!restaurantId) {
      throw new Error('No restaurant selected');
    }

    return this.http
      .patch<Branch>(`${this.apiUrl}/branches/activate/${restaurantId}/${branchId}`, {})
      .pipe(tap(() => this.orgService.refreshGlobalBranches()));
  }

  deactivate(branchId: string): Observable<Branch> {
    const restaurantId = this.orgService.selectedRestaurantId();

    if (!restaurantId) {
      throw new Error('No restaurant selected');
    }

    return this.http
      .delete<Branch>(`${this.apiUrl}/branches/${restaurantId}/${branchId}`)
      .pipe(tap(() => this.orgService.refreshGlobalBranches()));
  }

  bulkUploadByCsv(file: File): Observable<void> {
    const restaurantId = this.orgService.selectedRestaurantId();

    if (!restaurantId) {
      throw new Error('No restaurant selected');
    }

    const form = new FormData();
    form.append('file', file);

    return this.http
      .post<void>(`${this.apiUrl}/branches/bulk-upload/${restaurantId}`, form)
      .pipe(tap(() => this.orgService.refreshGlobalBranches()));
  }
}
