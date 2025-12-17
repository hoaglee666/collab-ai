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

  getMyProjects(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my`, this.getHeaders());
  }

  createProject(projectData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, projectData, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authService.getToken()}`,
        // Do NOT set Content-Type here, let browser handle it
      }),
    });
  }

  deleteProject(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders());
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

  //get task
  getTasks(projectId: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3000/api/tasks/${projectId}`, this.getHeaders());
  }
  //add task
  createTask(projectId: string, description: string): Observable<any> {
    return this.http.post<any>(
      `http://localhost:3000/api/tasks`,
      { projectId, description },
      this.getHeaders()
    );
  }
  //check uncheck
  toggleTask(taskId: string): Observable<any> {
    return this.http.patch<any>(
      `http://localhost:3000/api/tasks/${taskId}/toggle`,
      {},
      this.getHeaders()
    );
  }

  getAiTasks(description: string): Observable<{ tasks: string[] }> {
    return this.http.post<{ tasks: string[] }>(
      'http://localhost:3000/api/ai/suggest-tasks',
      { description },
      this.getHeaders()
    );
  }
}
