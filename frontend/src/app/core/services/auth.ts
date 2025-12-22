// frontend/src/app/core/services/auth.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators'; // <--- 1. IMPORT ADDED HERE

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/auth';
  private router = inject(Router);

  currentUser = signal<any>(null);

  // reg meth
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // login meth
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  logout() {
    localStorage.removeItem('token');
    // Clear the current user signal on logout
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  // save token to brow storage
  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  // get token
  getToken() {
    return localStorage.getItem('token');
  }

  updateProfile(data: { username?: string; password?: string }): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    return this.http.put('http://localhost:3000/api/auth/profile', data, { headers });
  }

  deleteAccount(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    return this.http.delete('http://localhost:3000/api/auth', { headers });
  }

  getCurrentUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      // decode middle part of payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch (e) {
      return null;
    }
  }

  getProfile() {
    // 2. ADDED HEADER HERE (Usually profile needs auth token)
    const token = this.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    return this.http.get<any>(`${this.apiUrl}/profile`, { headers }).pipe(
      // 3. ADDED TYPE '(user: any)'
      tap((user: any) => {
        this.currentUser.set(user);
      })
    );
  }

  // helper upload
  uploadAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = this.getToken();
    // Don't set Content-Type manually for files
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    return this.http.post('http://localhost:3000/api/auth/avatar', formData, { headers });
  }
}
