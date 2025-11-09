import { HttpClient, HttpXsrfTokenExtractor } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { OrgService } from './org.service';
import { Observable, tap, map } from 'rxjs';
import { RestaurantDetails } from './types/org.types';

// Tipos para las respuestas del backend
interface RestaurantResponse {
  restaurant: RestaurantDetails;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class RestaurantsService {
  private http = inject(HttpClient);
  private org = inject(OrgService);
  apiUrl = environment.apiBaseUrl;

  createRestaurant(newRestaurant: Partial<RestaurantDetails>): Observable<RestaurantDetails> {
    return this.http
      .post<RestaurantResponse>(`${this.apiUrl}/restaurants`, {
        ...newRestaurant,
      })
      .pipe(
        map((response) => {
          const restaurant = response.restaurant;
          this.org.restaurants.update((restaurants) => [...restaurants, restaurant]);
          return restaurant;
        })
      );
  }

  updateRestaurant(
    id: string,
    updatedRestaurant: Partial<RestaurantDetails>
  ): Observable<RestaurantDetails> {
    const url = `${this.apiUrl}/restaurants/${id}`;



    return this.http
      .patch<RestaurantResponse>(url, {
        ...updatedRestaurant,
      })
      .pipe(
        map((response) => {
          const restaurant = response.restaurant;
          this.org.restaurants.update((restaurants) =>
            restaurants.map((res) => (res.id === id ? restaurant : res))
          );
          return restaurant;
        })
      );
  }

  removeRestaurant(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/restaurants/${id}`).pipe(
      tap(() => {
        this.org.restaurants.update((restaurants) => restaurants.filter((res) => res.id !== id));
      })
    );
  }
}
