import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Category } from './types/category.types';
import { Observable, tap, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private http = inject(HttpClient);
  apiUrl = environment.apiBaseUrl;

  categories = signal<Category[]>([]);

  getCategories(): Observable<Category[]> {
    return this.http
      .get<Category[]>(`${this.apiUrl}/categories`)
      .pipe(tap((categories) => this.categories.set(categories)));
  }

  createCategory(newCategory: Partial<Category>): Observable<Category> {
    return this.http
      .post<Category>(`${this.apiUrl}/categories`, {
        name: newCategory.name,
        isActive: newCategory.isActive,
      })
      .pipe(
        map((response) => response),
        tap((category) => {
          this.categories.update((categories) => [...categories, category]);
        })
      );
  }

  updateCategory(id: number, updatedCategory: Partial<Category>): Observable<Category> {
    return this.http
      .patch<Category>(`${this.apiUrl}/categories/${id}`, {
        name: updatedCategory.name,
        isActive: updatedCategory.isActive,
      })
      .pipe(
        map((response) => response),
        tap((uCategory) => {
          this.categories.update((categories) =>
            categories.map((cat) => (cat.id === id ? uCategory : cat))
          );
        })
      );
  }

  removeCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`).pipe(
      tap(() => {
        this.categories.update((categories) => categories.filter((cat) => cat.id !== id));
      })
    );
  }
}
