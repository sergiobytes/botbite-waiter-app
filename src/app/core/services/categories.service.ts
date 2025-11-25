import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Category, CategoryListResponse, CategoryResponse } from './types/category.types';
import { map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  readonly categories = signal<Category[]>([]);
  readonly totalCategories = signal<number>(0);

  list(params: {
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Observable<CategoryListResponse> {
    let httpParams = new HttpParams();

    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.isActive !== undefined) {
      httpParams = httpParams.set('isActive', params.isActive.toString());
    }
    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params?.offset !== undefined) {
      httpParams = httpParams.set('offset', params.offset.toString());
    }

    return this.http
      .get<CategoryListResponse>(`${this.apiUrl}/categories`, { params: httpParams })
      .pipe(
        tap((response) => {
          this.categories.set(response.categories);
          this.totalCategories.set(response.total);
        })
      );
  }

  create(newCategory: Partial<Category>): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(`${this.apiUrl}/categories`, {
      name: newCategory.name,
      isActive: newCategory.isActive,
    });
  }

  update(id: number, updatedCategory: Partial<Category>): Observable<CategoryResponse> {
    return this.http.patch<CategoryResponse>(`${this.apiUrl}/categories/${id}`, {
      name: updatedCategory.name,
      isActive: updatedCategory.isActive,
    });
  }

  remove(id: number): Observable<CategoryResponse> {
    return this.http.delete<CategoryResponse>(`${this.apiUrl}/categories/${id}`);
  }
}
