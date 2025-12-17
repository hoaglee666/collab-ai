import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // Signal to track state
  darkMode = signal<boolean>(false);

  constructor() {
    // 1. Check LocalStorage or System Preference on load
    const saved = localStorage.getItem('theme');
    if (saved) {
      this.darkMode.set(saved === 'dark');
    } else {
      // Check if computer is set to dark mode
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.darkMode.set(systemDark);
    }

    // 2. React to changes automatically
    effect(() => {
      if (this.darkMode()) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    });
  }

  toggle() {
    this.darkMode.update((v) => !v);
  }
}
