import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { catchError, of, tap } from 'rxjs';
import { Restaurant, RestaurantListResponse } from './types/restaurants.types';
import { Branch, BranchListResponse } from './types/branches.types';

@Injectable({
  providedIn: 'root',
})
export class OrgService {
  private http = inject(HttpClient);
  private LS_RESTAURANT = 'botbite.restaurantId';
  private LS_BRANCHKEY = (restaurantId: string) => `botbite.branchId::${restaurantId}`;
  apiUrl = environment.apiBaseUrl;

  restaurants = signal<Restaurant[]>([]);
  selectedRestaurantId = signal<string | null>(null);
  selectedRestaurant = computed(
    () => this.restaurants()?.find((r) => r.id === this.selectedRestaurantId()) ?? null
  );

  branches = signal<Branch[]>([]);
  selectedBranchId = signal<string | null>(null);
  selectedBranch = computed(
    () => this.branches().find((b) => b.id === this.selectedBranchId()) ?? null
  );

  constructor() {
    // Inicializar desde localStorage al crear el servicio
    this.initializeFromStorage();
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
    return this.http.get<RestaurantListResponse>(`${this.apiUrl}/restaurants`).pipe(
      tap((list) => {
        this.restaurants.set(Array.isArray(list.restaurants) ? list.restaurants : []);

        // Mantener la selección actual si existe en la lista
        const currentSelection = this.selectedRestaurantId();
        const exists = currentSelection && list.restaurants.some((r) => r.id === currentSelection);

        if (exists) {
          // Ya está seleccionado y existe, no hacer nada
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
      catchError(() => {
        this.restaurants.set([]);
        this.selectedRestaurantId.set(null);
        return of([]);
      })
    );
  }

  selectRestaurant(id: string | null) {
    this.selectedRestaurantId.set(id);
    if (id) localStorage.setItem(this.LS_RESTAURANT, id);
    else localStorage.removeItem(this.LS_RESTAURANT);
  }

  loadBranches(restaurantId: string) {
    return this.http
      .get<BranchListResponse>(`${this.apiUrl}/branches/restaurant/${restaurantId}`)
      .pipe(
        tap((list) => {
          this.branches.set(Array.isArray(list.branches) ? list.branches : []);

          // Mantener la selección actual si existe en la nueva lista
          const currentSelection = this.selectedBranchId();
          const exists = currentSelection && list.branches.some((b) => b.id === currentSelection);

          if (exists) {
            // Ya está seleccionado y existe, no hacer nada
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
        catchError(() => {
          this.branches.set([]);
          this.selectedBranchId.set(null);
          return of([]);
        })
      );
  }

  selectBranch(branchId: string | null) {
    const rid = this.selectedRestaurantId();
    this.selectedBranchId.set(branchId);
    if (rid && branchId) localStorage.setItem(this.LS_BRANCHKEY(rid), branchId);
    else if (rid && !branchId) localStorage.removeItem(this.LS_BRANCHKEY(rid));
  }

  updateSelectedBranch(patch: Partial<Branch>) {
    const current = this.selectedBranch();
    if (!current) return;

    const updated = { ...current, ...patch };
    const next = this.branches().map((b) => (b.id === updated.id ? updated : b));

    this.branches.set(next);
    this.selectedBranchId.set(updated.id);
  }

  _watchRestaurant = effect(() => {
    const rid = this.selectedRestaurantId();
    if (!rid) {
      this.branches.set([]);
      this.selectedBranchId.set(null);
      return;
    }

    this.loadBranches(rid).subscribe();
  });
}
