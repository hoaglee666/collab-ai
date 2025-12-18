import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/notification'; // Import
import { SocketService } from '../../../core/services/socket'; // Import

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
})
export class HeaderComponent implements OnInit {
  @Input() title = 'Overview';
  @Input() subtitle = 'Welcome back.';

  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private socketService = inject(SocketService);

  user = signal<any>(null);

  // Notification Signals
  notifications = signal<any[]>([]);
  showDropdown = signal(false);
  unreadCount = signal(0);

  ngOnInit() {
    // 1. Load User
    this.authService.getProfile().subscribe((u) => {
      this.user.set(u);

      // 2. Join Real-time Room
      if (u && u.id) {
        this.socketService.joinUser(u.id);
      }
    });

    // 3. Load Existing Notifications
    this.loadNotifications();

    // 4. Listen for NEW Notifications (Real-time!)
    this.socketService.onNotification().subscribe((newNotif) => {
      // Add to top of list
      this.notifications.update((list) => [newNotif, ...list]);
      // Increment Badge
      this.unreadCount.update((c) => c + 1);
      // Optional: Play a sound?
      // new Audio('/assets/ping.mp3').play().catch(() => {});
    });
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe((list) => {
      this.notifications.set(list);
      // Count unread
      const unread = list.filter((n: any) => !n.isRead).length;
      this.unreadCount.set(unread);
    });
  }

  toggleDropdown() {
    this.showDropdown.update((v) => !v);
  }

  handleNotificationClick(notif: any) {
    // Mark as read immediately in UI
    if (!notif.isRead) {
      this.notificationService.markAsRead(notif.id).subscribe();
      notif.isRead = true;
      this.unreadCount.update((c) => Math.max(0, c - 1));
    }
    this.showDropdown.set(false);
  }
}
