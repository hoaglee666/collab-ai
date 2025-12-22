// frontend/src/app/app.ts
import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // <--- Import this
import { ThemeService } from './core/services/theme';
import { ChatbotComponent } from './shared/components/chatbot/chatbot';
import { AuthService } from './core/services/auth';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatbotComponent], // <--- Add this to imports
  template: ` <router-outlet></router-outlet> <app-chatbot></app-chatbot>`,
})
export class AppComponent implements OnInit {
  authService = inject(AuthService);

  ngOnInit() {
    if (this.authService.getToken()) {
      this.authService.getProfile().subscribe();
    }
  }
  // We don't need the test logic anymore!
  constructor(private themeService: ThemeService) {}
}
