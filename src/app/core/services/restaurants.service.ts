import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { OrgService } from './org.service';
import { Observable, map } from 'rxjs';
import { Restaurant } from './types/restaurants.types';

interface RestaurantResponse {
  restaurant: Restaurant;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class RestaurantsService {
  private readonly http = inject(HttpClient);
  private readonly org = inject(OrgService);
  private readonly apiUrl = environment.apiBaseUrl;

  createRestaurant(newRestaurant: Partial<Restaurant>): Observable<Restaurant> {
    return this.http
      .post<RestaurantResponse>(`${this.apiUrl}/restaurants`, newRestaurant)
      .pipe(
        map((response) => {
          this.org.restaurants.update((restaurants) => [...restaurants, response.restaurant]);
          return response.restaurant;
        })
      );
  }

  updateRestaurant(id: string, updatedRestaurant: Partial<Restaurant>): Observable<Restaurant> {
    return this.http
      .patch<RestaurantResponse>(`${this.apiUrl}/restaurants/${id}`, updatedRestaurant)
      .pipe(
        map((response) => {
          this.org.restaurants.update((restaurants) =>
            restaurants.map((res) => (res.id === id ? response.restaurant : res))
          );
          return response.restaurant;
        })
      );
  }

  removeRestaurant(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/restaurants/${id}`).pipe(
      map(() => {
        this.org.restaurants.update((restaurants) => restaurants.filter((res) => res.id !== id));
      })
    );
  }
}
