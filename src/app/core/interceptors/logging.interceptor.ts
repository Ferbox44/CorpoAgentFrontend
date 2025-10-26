import { HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export function loggingInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<any> {
    const startTime = Date.now();
    
  console.log(` ${req.method} ${req.url}`, {
    headers: req.headers,
    body: req.body
  });

  return next(req).pipe(
    tap({
      next: (event) => {
        const duration = Date.now() - startTime;
        console.log(` ${req.method} ${req.url} - ${duration}ms`, event);
      },
      error: (error) => {
        const duration = Date.now() - startTime;
        console.error(` ${req.method} ${req.url} - ${duration}ms`, error);
      }
    })
  );
}
