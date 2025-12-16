// frontend/src/app/features/dashboard/dashboard.component.ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {
  private router = inject(Router);
  // We will add a logout method to AuthService in a second,
  // but for now we can just clear storage here manually.

  logout() {
    localStorage.removeItem('token'); // Destroy the key
    this.router.navigate(['/login']); // Go back to safety
  }
}
