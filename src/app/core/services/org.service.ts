import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { BranchDetails, BranchList, RestaurantDetails, RestaurantsList } from './types/org.types';
import { environment } from '../../../environments/environment';
import { catchError, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrgService {
  private http = inject(HttpClient);
  private LS_RESTAURANT = 'botbite.restaurantId';
  private LS_BRANCHKEY = (restaurantId: string) => `botbite.branchId::${restaurantId}`;
  apiUrl = environment.apiBaseUrl;

  restaurants = signal<RestaurantDetails[]>([]);
  selectedRestaurantId = signal<string | null>(null);
  selectedRestaurant = computed(
    () => this.restaurants()?.find((r) => r.id === this.selectedRestaurantId()) ?? null
  );

  branches = signal<BranchDetails[]>([]);
  selectedBranchId = signal<string | null>(null);
  selectedBranch = computed(
    () => this.branches().find((b) => b.id === this.selectedBranchId()) ?? null
  );

  loadRestaurants() {
    return this.http.get<RestaurantsList>(`${this.apiUrl}/restaurants`).pipe(
      tap((list) => {
        this.restaurants.set(Array.isArray(list.restaurants) ? list.restaurants : []);

        const saved = localStorage.getItem(this.LS_RESTAURANT);
        const exists = saved && list.restaurants.some((r) => r.id === saved);
        const fallback = list.restaurants[0]?.id ?? null;

        this.selectedRestaurantId.set(exists ? saved! : fallback);

        if (exists) return;
        if (fallback) localStorage.setItem(this.LS_RESTAURANT, fallback);
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
    return this.http.get<BranchList>(`${this.apiUrl}/branches/restaurant/${restaurantId}`).pipe(
      tap((list) => {
        this.branches.set(Array.isArray(list.branches) ? list.branches : []);

        const saved = localStorage.getItem(this.LS_BRANCHKEY(restaurantId));
        const exists = saved && list.branches.some((b) => b.id === saved);
        const fallback = list.branches[0]?.id ?? null;

        const nextBranchId = exists ? (saved as string) : fallback;
        this.selectedBranchId.set(nextBranchId);

        if (nextBranchId) localStorage.setItem(this.LS_BRANCHKEY(restaurantId), nextBranchId);
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

  updateSelectedBranch(patch: Partial<BranchDetails>) {
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
