import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth'; // Import your AuthService

@Component({
  selector: 'app-login-success',
  standalone: true,
  template: '<p>Logging you in...</p>',
})
export class LoginSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  // Inject AuthService directly or use localStorage manually if AuthService is private
  // Let's assume we just save to localStorage manually for simplicity here

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      if (token) {
        localStorage.setItem('token', token); // Save Token!
        this.router.navigate(['/dashboard']); // Go to Dashboard
      } else {
        this.router.navigate(['/login']); // Failed
      }
    });
  }
}
