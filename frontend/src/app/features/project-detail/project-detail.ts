// frontend/src/app/features/project-detail/project-detail.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router'; // To read URL
import { ProjectService } from '../../core/services/project';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);

  project = signal<any>(null);
  isLoading = signal(true);

  ngOnInit() {
    // 1. Get the 'id' from the URL (e.g. projects/123 -> id = 123)
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.loadProject(id);
    }
  }

  loadProject(id: string) {
    this.projectService.getProjectById(id).subscribe({
      next: (data) => {
        this.project.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      },
    });
  }
}
