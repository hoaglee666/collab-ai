// frontend/src/app/features/settings/settings.component.ts
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  themeService = inject(ThemeService);

  // Form: Allow updating Username and Password
  settingsForm = this.fb.group({
    username: [''], // Leave empty, user types new one if they want
    password: ['', [Validators.minLength(6)]],
    confirmPassword: [''],
  });

  onSubmit() {
    if (this.settingsForm.invalid) return;

    const { username, password, confirmPassword } = this.settingsForm.value;

    // Simple validation
    if (password && password !== confirmPassword) {
      this.errorMessage.set('Passwords do not match!');
      return;
    }

    if (!username && !password) {
      this.errorMessage.set('Please change at least one field.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload: any = {};
    if (username) payload.username = username;
    if (password) payload.password = password;

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.successMessage.set('Profile updated successfully!');
        this.isLoading.set(false);
        this.settingsForm.reset();
      },
      error: (err) => {
        this.errorMessage.set(err.error.message || 'Update failed');
        this.isLoading.set(false);
      },
    });
  }
  onDeleteAccount() {
    const confirmed = window.confirm(
      '⚠️ Are you sure? This will delete your account and ALL your projects permanently. This cannot be undone.'
    );

    if (confirmed) {
      this.isLoading.set(true);
      this.authService.deleteAccount().subscribe({
        next: () => {
          alert('Account deleted. Goodbye!');
          this.authService.logout(); // Clear token
          this.router.navigate(['/login']);
        },
        error: (err) => {
          alert('Failed to delete account.');
          this.isLoading.set(false);
        },
      });
    }
  }
}
