import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';
import { ProjectService } from '../../core/services/project';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar'; // Import Sidebar
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink],
  templateUrl: './profile.html',
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  projectService = inject(ProjectService);
  projects = signal<any[]>([]);
  filterStatus = signal('active'); // 'active' | 'archived' | 'all'

  // COMPUTED: The list actually shown in the HTML
  filteredProjects = computed(() => {
    const status = this.filterStatus();
    const all = this.myProjects();

    if (status === 'all') return all;

    // Group "Completed" with "Active" usually, or separate?
    // Let's say:
    // 'active' tab -> shows 'active' AND 'completed'
    // 'archived' tab -> shows 'archived' AND 'abandoned'

    if (status === 'active') {
      return all.filter((p) => p.status === 'active' || p.status === 'completed');
    }

    if (status === 'archived') {
      return all.filter((p) => p.status === 'archived' || p.status === 'abandoned');
    }

    return all;
  });

  user = signal<any>(null);
  myProjects = signal<any[]>([]);

  ngOnInit() {
    // 1. Get User Info
    this.authService.getProfile().subscribe((u) => this.user.set(u));

    // 2. Get My Projects
    this.projectService.getMyProjects().subscribe((p) => this.myProjects.set(p));
  }

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.authService.uploadAvatar(file).subscribe({
        next: (res) => {
          // Update the user signal immediately to show new image
          this.user.update((u) => ({ ...u, avatarUrl: res.avatarUrl }));
          alert('Profile picture updated!');
        },
        error: () => alert('Failed to upload image'),
      });
    }
  }
}
