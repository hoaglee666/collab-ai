// frontend/src/app/app.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // <--- Import this

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // <--- Add this to imports
  template: ` <router-outlet></router-outlet> `,
})
export class AppComponent {
  // We don't need the test logic anymore!
}
