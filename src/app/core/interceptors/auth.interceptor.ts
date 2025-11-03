import { HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, switchMap, catchError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<any> {
  const authService = inject(AuthService);
  // Skip auth for login/register endpoints
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    return next(req);
  }

  // Add token to requests
  const token = authService.getAccessToken();
  if (token && !authService.isTokenExpired()) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        // Do not force-logout; simply propagate the error and let callers decide
        return throwError(() => error);
      }
      return throwError(() => error);
    })
  );
}
