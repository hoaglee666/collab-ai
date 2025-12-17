// frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { RegisterComponent } from './features/auth/register/register';
import { LoginComponent } from './features/auth/login/login';
import { authGuard } from './core/guards/auth-guard';
import { DashboardComponent } from './features/dashboard/dashboard';
import { ProjectDetailComponent } from './features/project-detail/project-detail';
import { SettingsComponent } from './features/settings/settings';

export const routes: Routes = [
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
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
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'register', pathMatch: 'full' }, // Default to register for now
];
