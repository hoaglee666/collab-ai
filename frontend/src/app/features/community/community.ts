import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../core/services/project';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './community.html',
})
export class CommunityComponent implements OnInit {
  private projectService = inject(ProjectService);

  // Use a signal for the list
  projects = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    // Fetch ALL projects
    this.projectService.getProjects().subscribe({
      next: (data) => {
        this.projects.set(data);
        this.isLoading.set(false);
      },
      error: (err) => console.error(err),
    });
  }
}
