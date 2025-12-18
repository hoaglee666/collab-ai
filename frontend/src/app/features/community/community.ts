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
  totalItems = signal(0);
  totalPages = signal(0);

  //filters (state signal)
  searchQuery = signal('');
  currentPage = signal(1);
  sortBy = signal('createdAt'); //createdat or name
  sortOrder = signal('DESC'); //asc or desc
  isLoading = signal(false);

  filteredProjects = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const all = this.projects();

    if (!query) return all; // If empty, show everything

    return all.filter(
      (p) => p.name.toLowerCase().includes(query) || p.User?.username.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    this.fetchProjects();
  }

  fetchProjects() {
    this.isLoading.set(true);

    this.projectService
      .getProjects({
        page: this.currentPage(),
        limit: 6, // 6 cards per page
        search: this.searchQuery(),
        sortBy: this.sortBy(),
        order: this.sortOrder(),
      })
      .subscribe({
        next: (res) => {
          this.projects.set(res.projects);
          this.totalItems.set(res.totalItems);
          this.totalPages.set(res.totalPages);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  //actions
  onSearch() {
    this.currentPage.set(1); // Reset to page 1 when searching
    this.fetchProjects();
  }

  onSortChange(event: any) {
    const value = event.target.value; // e.g., "name-ASC"
    const [field, order] = value.split('-');

    this.sortBy.set(field);
    this.sortOrder.set(order);
    this.fetchProjects();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.fetchProjects();
    }
  }
}
