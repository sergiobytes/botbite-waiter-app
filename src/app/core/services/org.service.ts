import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { RestaurantDetails, RestaurantsList } from './types/org.types';
import { environment } from '../../../environments/environment';
import { catchError, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrgService {
  private http = inject(HttpClient);
  private LS_RESTAURANT = 'botbite.restaurantId';
  apiUrl = environment.apiBaseUrl;

  restaurants = signal<RestaurantDetails[]>([]);
  selectedRestaurantId = signal<string | null>(null);

  selectedRestaurant = computed(
    () => this.restaurants()?.find((r) => r.id === this.selectedRestaurantId()) ?? null
  );

  loadRestaurants() {
    return this.http.get<RestaurantsList>(`${this.apiUrl}/restaurants`).pipe(
      tap((list) => {
        console.log(list);

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
}
