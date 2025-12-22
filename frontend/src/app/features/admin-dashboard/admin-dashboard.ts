import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/services/auth';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  stats = signal<any>(null);
  isLoading = signal(true);

  ngOnInit() {
    this.fetchStats();
  }

  fetchStats() {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get('http://localhost:3000/api/admin/stats', { headers }).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        alert('You are not authorized to view this page.');
        this.isLoading.set(false);
      },
    });
  }
}
