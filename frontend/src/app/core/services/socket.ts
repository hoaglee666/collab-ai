import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor() {
    // Connect to Backend
    this.socket = io('http://localhost:3000');
  }

  // Tell server we are looking at a specific project
  joinProject(projectId: string) {
    this.socket.emit('joinProject', projectId);
  }

  // Listen for new tasks
  onTaskCreated(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('task:created', (task) => {
        observer.next(task);
      });
    });
  }

  // Listen for task updates (checkbox toggles)
  onTaskUpdated(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('task:updated', (task) => {
        observer.next(task);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
