// frontend/src/app/core/guards/auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Check if token exists
  if (authService.getToken()) {
    return true; // Pass!
  } else {
    // 2. No token? Kick them out to login
    router.navigate(['/login']);
    return false; // Stop!
  }
};
