import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Now this works because we added 'currentUser' to the service!
  const user = authService.currentUser();

  if (user && user.role === 'admin') {
    return true;
  }

  // If user is not loaded yet (page refresh), you might want to redirect to dashboard
  // or allow the profile fetch to finish. For now, redirecting is safer.
  router.navigate(['/dashboard']);
  return false;
};
