// frontend/src/app/core/services/project.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:3000/api/projects';

  // Helper to get headers with the token
  private getHeaders() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  getProjects(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, this.getHeaders());
  }

  createProject(projectData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, projectData, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authService.getToken()}`,
        // Do NOT set Content-Type here, let browser handle it
      }),
    });
  }

  // Add this method inside your ProjectService class
  generateDescription(projectName: string): Observable<{ suggestion: string }> {
    return this.http.post<{ suggestion: string }>(
      'http://localhost:3000/api/ai/generate',
      { projectName },
      this.getHeaders()
    );
  }

  getProjectById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, this.getHeaders());
  }
}
