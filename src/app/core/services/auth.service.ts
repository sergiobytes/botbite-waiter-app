import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { tap, from } from 'rxjs';

export type LoginDto = {
  email: string;
  password: string;
};

export type LoginRes = {
  access_token: string;
  refresh_token?: string;
  user?: { id: string; email: string; name?: string; roles?: string[] };
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private LS_ACCESS = 'botbite.access';
  private LS_REFRESH = 'botbite.refresh';
  apiUrl = environment.apiBaseUrl;

  login(payload: LoginDto) {
    return this.http.post<LoginRes>(`${this.apiUrl}/auth/login`, payload).pipe(
      tap((res) => {
        if (res?.access_token) localStorage.setItem(this.LS_ACCESS, res.access_token);
        if (res?.refresh_token) localStorage.setItem(this.LS_REFRESH, res.refresh_token);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.LS_ACCESS);
    localStorage.removeItem(this.LS_REFRESH);
  }

  get accessToken(): string | null {
    return localStorage.getItem(this.LS_ACCESS);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(this.LS_REFRESH);
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}
