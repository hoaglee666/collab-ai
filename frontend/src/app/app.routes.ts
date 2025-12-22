// frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { RegisterComponent } from './features/auth/register/register';
import { LoginComponent } from './features/auth/login/login';
import { authGuard } from './core/guards/auth-guard';
import { DashboardComponent } from './features/dashboard/dashboard';
import { ProjectDetailComponent } from './features/project-detail/project-detail';
import { SettingsComponent } from './features/settings/settings';
import { CommunityComponent } from './features/community/community';
import { ProfileComponent } from './features/profile/profile';
import { LoginSuccessComponent } from './features/login-success/login-success';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'login-success', component: LoginSuccessComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard], //bouncer
  },
  {
    path: 'projects/:id', //:id dynamic
    component: ProjectDetailComponent,
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboardComponent),
    canActivate: [authGuard, adminGuard], // 🔒 Double Lock: Must be Logged In AND Admin
  },
  { path: 'community', component: CommunityComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'register', pathMatch: 'full' }, // Default to register for now
];
