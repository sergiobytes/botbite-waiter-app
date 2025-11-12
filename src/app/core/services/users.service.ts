import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, switchMap, tap } from 'rxjs';
import { RegisterUserDto, UserListResponse, UserRow } from './types/users.types';
import { UserRole } from './types/common.types';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  readonly users = signal<UserRow[]>([]);

  list(params: {
    search?: string;
    email?: string;
    role?: UserRole;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Observable<UserListResponse> {
    let httpParams = new HttpParams();

    if (params?.search) httpParams = httpParams.set('search', params.search);

    if (params?.email) httpParams = httpParams.set('email', params.email);

    if (params?.role) httpParams = httpParams.set('role', params.role);

    if (params?.isActive !== undefined) {
      httpParams = httpParams.set('isActive', params.isActive.toString());
    }

    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params?.offset !== undefined) {
      httpParams = httpParams.set('offset', params.offset.toString());
    }

    return this.http.get<UserListResponse>(`${this.apiUrl}/users`, { params: httpParams }).pipe(
      tap((list) => {
        this.users.set(Array.isArray(list.users) ? list.users : []);
      })
    );
  }

  registerUserOrClient(newUser: RegisterUserDto, endpoint: string) {
    return this.http
      .post(`${this.apiUrl}/users/${endpoint}`, { ...newUser })
      .pipe(switchMap(() => this.list({})));
  }

  activateUser(userId: string) {
    return this.http
      .patch(`${this.apiUrl}/users/activate-user/${userId}`, {})
      .pipe(switchMap(() => this.list({})));
  }

  deactivateUser(userId: string) {
    return this.http
      .delete(`${this.apiUrl}/users/deactivate-user/${userId}`)
      .pipe(switchMap(() => this.list({})));
  }

  addAdminRole(userId: string) {
    return this.http
      .patch(`${this.apiUrl}/users/add-admin-role/${userId}`, {})
      .pipe(switchMap(() => this.list({})));
  }

  removeAdminRole(userId: string) {
    return this.http
      .delete(`${this.apiUrl}/users/remove-admin-role/${userId}`)
      .pipe(switchMap(() => this.list({})));
  }
}
