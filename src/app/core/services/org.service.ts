import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { catchError, finalize, of, tap } from 'rxjs';
import { Restaurant, RestaurantListResponse } from './types/restaurants.types';
import { Branch, BranchListResponse } from './types/branches.types';

@Injectable({
  providedIn: 'root',
})
export class OrgService {
  private readonly http = inject(HttpClient);
  private readonly LS_RESTAURANT = 'botbite.restaurantId';
  private readonly LS_BRANCHKEY = (restaurantId: string) => `botbite.branchId::${restaurantId}`;
  private readonly apiUrl = environment.apiBaseUrl;

  readonly restaurants = signal<Restaurant[]>([]);
  readonly selectedRestaurantId = signal<string | null>(null);
  readonly selectedRestaurant = computed(
    () => this.restaurants()?.find((r) => r.id === this.selectedRestaurantId()) ?? null
  );

  readonly branches = signal<Branch[]>([]);
  readonly selectedBranchId = signal<string | null>(null);
  readonly selectedBranch = computed(
    () => this.branches().find((b) => b.id === this.selectedBranchId()) ?? null
  );

  readonly loadingRestaurants = signal<boolean>(false);
  readonly loadingBranches = signal<boolean>(false);

  constructor() {
    this.initializeFromStorage();

    // Effect para cargar branches automáticamente cuando cambia el restaurante
    effect(() => {
      const rid = this.selectedRestaurantId();

      if (!rid) {
        this.branches.set([]);
        this.selectedBranchId.set(null);
        return;
      }

      this.loadBranches(rid).subscribe();
    });
  }

  private initializeFromStorage(): void {
    const savedRestaurant = localStorage.getItem(this.LS_RESTAURANT);
    if (savedRestaurant) {
      this.selectedRestaurantId.set(savedRestaurant);

      const savedBranch = localStorage.getItem(this.LS_BRANCHKEY(savedRestaurant));
      if (savedBranch) {
        this.selectedBranchId.set(savedBranch);
      }
    }
  }

  loadRestaurants() {
    this.loadingRestaurants.set(true);

    return this.http.get<RestaurantListResponse>(`${this.apiUrl}/restaurants`).pipe(
      tap((list) => {
        this.restaurants.set(Array.isArray(list.restaurants) ? list.restaurants : []);

        // Mantener la selección actual si existe en la lista
        const currentSelection = this.selectedRestaurantId();
        const exists = currentSelection && list.restaurants.some((r) => r.id === currentSelection);

        if (exists) {
          return;
        }

        // Si no existe la selección actual, buscar en localStorage
        const saved = localStorage.getItem(this.LS_RESTAURANT);
        const savedExists = saved && list.restaurants.some((r) => r.id === saved);
        const fallback = list.restaurants[0]?.id ?? null;

        const newSelection = savedExists ? saved! : fallback;
        this.selectedRestaurantId.set(newSelection);

        if (newSelection) {
          localStorage.setItem(this.LS_RESTAURANT, newSelection);
        }
      }),
      catchError((error) => {
        console.error('Error loading restaurants:', error);
        this.restaurants.set([]);
        this.selectedRestaurantId.set(null);
        return of({ restaurants: [], total: 0, pagination: {} as any });
      }),
      finalize(() => this.loadingRestaurants.set(false))
    );
  }

  selectRestaurant(id: string | null): void {
    this.selectedRestaurantId.set(id);
    if (id) {
      localStorage.setItem(this.LS_RESTAURANT, id);
    } else {
      localStorage.removeItem(this.LS_RESTAURANT);
    }
  }

  loadBranches(
    restaurantId: string,
    params?: {
      search?: string;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    this.loadingBranches.set(true);

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
      .get<BranchListResponse>(`${this.apiUrl}/branches/restaurant/${restaurantId}`, {
        params: httpParams
      })
      .pipe(
        tap((list) => {
          this.branches.set(Array.isArray(list.branches) ? list.branches : []);

          // Mantener la selección actual si existe en la nueva lista
          const currentSelection = this.selectedBranchId();
          const exists = currentSelection && list.branches.some((b) => b.id === currentSelection);

          if (exists) {
            return;
          }

          // Si no existe la selección actual, buscar en localStorage
          const saved = localStorage.getItem(this.LS_BRANCHKEY(restaurantId));
          const savedExists = saved && list.branches.some((b) => b.id === saved);
          const fallback = list.branches[0]?.id ?? null;

          const nextBranchId = savedExists ? saved : fallback;
          this.selectedBranchId.set(nextBranchId);

          if (nextBranchId) {
            localStorage.setItem(this.LS_BRANCHKEY(restaurantId), nextBranchId);
          }
        }),
        catchError((error) => {
          console.error('Error loading branches:', error);
          this.branches.set([]);
          this.selectedBranchId.set(null);
          return of({ branches: [], total: 0 });
        }),
        finalize(() => this.loadingBranches.set(false))
      );
  }

  selectBranch(branchId: string | null): void {
    const rid = this.selectedRestaurantId();
    this.selectedBranchId.set(branchId);

    if (rid && branchId) {
      localStorage.setItem(this.LS_BRANCHKEY(rid), branchId);
    } else if (rid && !branchId) {
      localStorage.removeItem(this.LS_BRANCHKEY(rid));
    }
  }

  updateSelectedBranch(patch: Partial<Branch>): void {
    const current = this.selectedBranch();
    if (!current) return;

    const updated = { ...current, ...patch };
    const next = this.branches().map((b) => (b.id === updated.id ? updated : b));

    this.branches.set(next);
  }
}
