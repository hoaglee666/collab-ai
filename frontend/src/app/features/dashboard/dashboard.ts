// frontend/src/app/features/dashboard/dashboard.component.ts
import { Component, inject, OnDestroy, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService } from '../../core/services/project';
import { io, Socket } from 'socket.io-client';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { HeaderComponent } from '../../shared/components/header/header';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SidebarComponent, HeaderComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private fb = inject(FormBuilder);
  private socket!: Socket;
  //data signals
  projects = signal<any[]>([]);
  isLoading = signal(false);
  isAiLoading = signal(false); // New signal for the sparkle button loading state
  selectedFile: File | null = null; //hold file
  //get access to html elem
  @ViewChild('fileInput') fileInput!: ElementRef;
  //form new project
  projectForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    deadline: [''],
  });

  ngOnInit() {
    this.loadProjects();
    this.setupSocketConnection(); //start listening
  }

  ngOnDestroy() {
    //clean up when leave page
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  setupSocketConnection() {
    //connect to backend
    this.socket = io('http://localhost:3000');
    //listen new projes
    this.socket.on('project:created', (newProject: any) => {
      console.log('⚡ Real-time update received:', newProject);
      //update list without api call
      this.projects.update((list) => [...list, newProject]);
    });
  }

  loadProjects() {
    this.projectService.getMyProjects().subscribe({
      // Was getProjects()
      next: (data) => {
        this.projects.set(data);
        this.isLoading.set(false);
      },
      error: (err) => console.error('Failed to load projects', err),
    });
  }

  //detect file loca
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  createProject() {
    if (this.projectForm.invalid) return;

    this.isLoading.set(true);

    // Prepare FormData
    const formData = new FormData();
    formData.append('name', this.projectForm.get('name')?.value || '');
    formData.append('description', this.projectForm.get('description')?.value || '');

    const deadline = this.projectForm.get('deadline')?.value;
    if (deadline) {
      formData.append('deadline', deadline);
    }

    if (this.selectedFile) {
      formData.append('image', this.selectedFile); // 'image' matches upload.single('image') in backend
    }

    // Send FormData
    this.projectService.createProject(formData).subscribe({
      next: (newProject) => {
        // We don't need to manually update the list because Socket.io does it!
        // Just reset the form
        this.projectForm.reset();
        this.selectedFile = null;

        // 2. Wipe the input clean
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        alert('Error creating project');
        this.isLoading.set(false);
      },
    });
  }

  askAi() {
    const name = this.projectForm.get('name')?.value;
    if (!name) {
      alert('Please type a project name first!');
      return;
    }

    this.isAiLoading.set(true);

    this.projectService.generateDescription(name).subscribe({
      next: (res) => {
        // Auto-fill the description box
        this.projectForm.patchValue({ description: res.suggestion });
        this.isAiLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        alert('AI failed to respond');
        this.isAiLoading.set(false);
      },
    });
  }

  logout() {
    localStorage.removeItem('token'); // Destroy the key
    this.router.navigate(['/login']); // Go back to safety
  }
}
