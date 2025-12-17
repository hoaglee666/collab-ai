import { Component, inject, OnInit, signal } from '@angular/core';
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
