// frontend/src/app/features/project-detail/project-detail.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // <--- Import FormsModule for the input
import { ProjectService } from '../../core/services/project';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule], // <--- Add FormsModule here
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);

  project = signal<any>(null);
  tasks = signal<any[]>([]); // <--- New: Store the list of tasks
  isLoading = signal(true);
  newTaskDescription = ''; // <--- New: To hold the input text
  isAiLoading = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProject(id);
      this.loadTasks(id); // <--- Load tasks when page opens
    }
  }

  loadProject(id: string) {
    this.projectService.getProjectById(id).subscribe({
      next: (data) => {
        this.project.set(data);
        this.isLoading.set(false);
      },
      error: (err) => console.error(err),
    });
  }

  // --- NEW TASK FUNCTIONS ---

  loadTasks(projectId: string) {
    this.projectService.getTasks(projectId).subscribe({
      next: (data) => this.tasks.set(data),
      error: (err) => console.error(err),
    });
  }

  addTask() {
    if (!this.newTaskDescription.trim() || !this.project()) return;

    this.projectService.createTask(this.project().id, this.newTaskDescription).subscribe({
      next: (newTask) => {
        // Add to list immediately
        this.tasks.update((list) => [...list, newTask]);
        this.newTaskDescription = ''; // Clear input
      },
      error: (err) => alert('Failed to add task'),
    });
  }

  toggleTask(task: any) {
    // Optimistic update (toggle UI immediately before server responds)
    this.tasks.update((list) =>
      list.map((t) => (t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t))
    );

    this.projectService.toggleTask(task.id).subscribe({
      error: () => {
        // Revert if server fails
        this.tasks.update((list) =>
          list.map((t) => (t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t))
        );
        alert('Sync failed');
      },
    });
  }

  generateAiTasks() {
    if (!this.project()?.description) {
      alert('This project has no description for the AI to read!');
      return;
    }
    this.isAiLoading.set(true);
    //ask ai for ideas
    this.projectService.getAiTasks(this.project().description).subscribe({
      next: (res) => {
        //save to db
        res.tasks.forEach((taskDesc) => {
          this.createTaskFromAi(taskDesc);
        });
        this.isAiLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        alert('AI failed to suggest tasks');
        this.isAiLoading.set(false);
      },
    });
  }
  //helper to save silently
  createTaskFromAi(desc: string) {
    this.projectService.createTask(this.project().id, desc).subscribe({
      next: (newTask) => {
        this.tasks.update((list) => [...list, newTask]);
      },
    });
  }
}
