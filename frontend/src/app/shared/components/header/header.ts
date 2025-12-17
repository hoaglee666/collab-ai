import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
})
export class HeaderComponent implements OnInit {
  @Input() title = 'Overview'; // Default title
  @Input() subtitle = 'Welcome back.';

  private authService = inject(AuthService);
  user = signal<any>(null);

  ngOnInit() {
    // We need a way to get the current user's info!
    // For now, let's fetch it from the profile endpoint (which we will create next)
    // OR just use what we have in localStorage if you stored it.
    // Let's assume we fetch it via a new method or stored locally.

    // Quick Fix: Retrieve from LocalStorage if you saved it during login,
    // OR call the API. Let's call the API to be safe.
    this.authService.getProfile().subscribe({
      next: (u) => this.user.set(u),
      error: () => {},
    });
  }
}
