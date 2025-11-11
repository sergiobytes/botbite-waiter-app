import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, switchMap } from 'rxjs';
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
  }): Observable<BranchListResponse | never[]> {
    const restaurantId = this.orgService.selectedRestaurantId();

    if (!restaurantId) {
      throw new Error('No restaurant selected');
    }

    return this.orgService.loadBranches(restaurantId, params);
  }

  create(newBranch: Partial<Branch>): Observable<BranchListResponse | never[]> {
    const restaurantId = this.orgService.selectedRestaurantId();

    if (!restaurantId) {
      throw new Error('No restaurant selected');
    }

    return this.http
      .post(`${this.apiUrl}/branches/${restaurantId}`, newBranch)
      .pipe(switchMap(() => this.orgService.loadBranches(restaurantId)));
  }

  update(
    branchId: string,
    updatedBranch: Partial<Branch>
  ): Observable<BranchListResponse | never[]> {
    const restaurantId = this.orgService.selectedRestaurantId();

    console.log('Updating branch:', { ...updatedBranch });
    console.log('Restaurant ID:', restaurantId);

    if (!restaurantId) {
      throw new Error('No restaurant selected');
    }

    return this.http
      .patch(`${this.apiUrl}/branches/restaurant/${restaurantId}/${branchId}`, {
        ...updatedBranch,
      })
      .pipe(switchMap(() => this.orgService.loadBranches(restaurantId)));
  }

  activate(branchId: string): Observable<BranchListResponse | never[]> {
    const restaurantId = this.orgService.selectedRestaurantId();

    if (!restaurantId) {
      throw new Error('No restaurant selected');
    }

    return this.http
      .patch(`${this.apiUrl}/branches/activate/${restaurantId}/${branchId}`, {})
      .pipe(switchMap(() => this.orgService.loadBranches(restaurantId)));
  }

  deactivate(branchId: string): Observable<BranchListResponse | never[]> {
    const restaurantId = this.orgService.selectedRestaurantId();

    if (!restaurantId) {
      throw new Error('No restaurant selected');
    }

    return this.http
      .delete(`${this.apiUrl}/branches/${restaurantId}/${branchId}`)
      .pipe(switchMap(() => this.orgService.loadBranches(restaurantId)));
  }

  bulkUploadByCsv(file: File): Observable<BranchListResponse | never[]> {
    const restaurantId = this.orgService.selectedRestaurantId();

    if (!restaurantId) {
      throw new Error('No restaurant selected');
    }

    const form = new FormData();
    form.append('file', file);

    return this.http
      .post(`${this.apiUrl}/branches/bulk-upload/${restaurantId}`, form)
      .pipe(switchMap(() => this.orgService.loadBranches(restaurantId)));
  }
}
