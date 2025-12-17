// frontend/src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/auth';
  private router = inject(Router);
  //reg meth
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  //login meth
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  //save token to brow storage
  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  //get token
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
}
