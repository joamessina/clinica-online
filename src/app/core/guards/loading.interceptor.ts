import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
