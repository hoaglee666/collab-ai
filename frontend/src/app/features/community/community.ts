import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../core/services/project';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent, FormsModule],
  templateUrl: './community.html',
})
export class CommunityComponent implements OnInit {
  private projectService = inject(ProjectService);

  // Use a signal for the list
  projects = signal<any[]>([]);

  searchQuery = signal('');

  filteredProjects = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const all = this.projects();

    if (!query) return all; // If empty, show everything

    return all.filter(
      (p) => p.name.toLowerCase().includes(query) || p.User?.username.toLowerCase().includes(query)
    );
  });

  isLoading = signal(true);

  ngOnInit() {
    this.projectService.getProjects().subscribe({
      next: (data) => {
        this.projects.set(data);
        this.isLoading.set(false);
      },
      error: (err) => console.error(err),
    });
  }
}
