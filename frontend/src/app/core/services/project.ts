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

  getProjects(params: {
    page: number;
    limit: number;
    search: string;
    sortBy: string;
    order: string;
  }): Observable<any> {
    // Construct Query String manually or use HttpParams
    const query = `?page=${params.page}&limit=${params.limit}&search=${params.search}&sortBy=${params.sortBy}&order=${params.order}`;

    return this.http.get<any>(this.apiUrl + query, this.getHeaders());
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

  deleteTask(taskId: string): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    // ❌ OLD (Wrong: /api/projects/tasks/...)
    // return this.http.delete(`${this.apiUrl}/tasks/${taskId}`, { headers });

    // ✅ NEW (Correct: /api/tasks/...)
    // We assume your base API is running on localhost:3000/api
    return this.http.delete(`http://localhost:3000/api/tasks/${taskId}`, { headers });
  }

  // Add this method inside your ProjectService class
  generateDescription(projectName: string): Observable<{ suggestion: string }> {
    return this.http.post<{ suggestion: string }>(
      'http://localhost:3000/api/ai/generate-description',
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

  getAiTasks(projectId: string, description: string): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    // Send BOTH projectId and description
    return this.http.post(
      'http://localhost:3000/api/ai/generate-tasks',
      { projectId, description },
      { headers }
    );
  }

  updateProject(id: string, data: FormData | any): Observable<any> {
    // If it's FormData, Angular handles headers. If JSON, it handles that too.
    return this.http.put(`${this.apiUrl}/${id}`, data, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authService.getToken()}`,
      }),
    });
  }

  // Invite a user by email
  addMember(projectId: string, email: string): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.post(`${this.apiUrl}/${projectId}/members`, { email }, { headers });
  }

  // Kick a user by ID
  removeMember(projectId: string, userId: string): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.delete(`${this.apiUrl}/${projectId}/members/${userId}`, { headers });
  }

  joinProject(projectId: string): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.post(`${this.apiUrl}/${projectId}/join`, {}, { headers });
  }
}
