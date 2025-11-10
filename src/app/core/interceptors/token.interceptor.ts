import { HttpClient, HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

let isRefreshing = false;

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const http = inject(HttpClient);

  const token = auth.accessToken;
  const withAuth = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(withAuth).pipe(
    catchError((err: HttpErrorResponse) => {
      // Solo intentar refresh si: 401, tenemos refresh token, no estamos refrescando ya,
      // y no es la petición de refresh en sí misma
      if (
        err.status === 401 &&
        auth.refreshToken &&
        !isRefreshing &&
        !req.url.includes('/auth/refresh-token')
      ) {
        isRefreshing = true;

        return http
          .post<RefreshTokenResponse>(`${environment.apiBaseUrl}/auth/refresh-token`, {
            refreshToken: auth.refreshToken,
          })
          .pipe(
            switchMap((res) => {
              isRefreshing = false;

              if (res?.accessToken) {
                localStorage.setItem('botbite.access', res.accessToken);

                // Reintentar la petición original con el nuevo token
                const retried = req.clone({
                  setHeaders: { Authorization: `Bearer ${res.accessToken}` },
                });
                return next(retried);
              }

              // Si no hay token en la respuesta, hacer logout
              auth.logout();
              return throwError(() => err);
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              auth.logout();
              return throwError(() => refreshErr);
            })
          );
      }

      return throwError(() => err);
    })
  );
};
