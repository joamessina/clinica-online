import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  // Si vas a usar HttpClient para endpoints externos/signedURL, mostrás loader:
  // loader.show();
  return next(req);
  // .finally(() => loader.hide());
};
