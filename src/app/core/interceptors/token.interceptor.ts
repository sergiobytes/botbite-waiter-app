import { HttpClient, HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

let refreshing = false;

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const http = inject(HttpClient);

  const token = auth.accessToken;

  const withAuth = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;  return next(withAuth).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && auth.refreshToken && !refreshing) {
        refreshing = true;

        return http
          .post<any>(
            `${location.origin.includes('localhost') ? '' : ''}${
              (window as any).ENV_API_BASE ?? ''
            }/auth/refresh-token`,
            {
              refreshToken: auth.refreshToken,
            }
          )
          .pipe(
            switchMap((res) => {
              refreshing = false;
              if (res?.accessToken) {
                localStorage.setItem('botbite.access', res.accessToken);
                const retried = req.clone({
                  setHeaders: { Authorization: `Bearer ${res.accessToken}` },
                });
                return next(retried);
              }
              return throwError(() => err);
            }),
            catchError((e) => {
              refreshing = false;
              auth.logout();
              return throwError(() => e);
            })
          );
      }
      return throwError(() => err);
    })
  );
};
