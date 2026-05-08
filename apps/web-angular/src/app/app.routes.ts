import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ShellComponent } from './components/shell/shell.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) 
      },
      { 
        path: 'upload', 
        loadComponent: () => import('./components/upload/upload.component').then(m => m.UploadComponent) 
      },
      { 
        path: 'admin/users', 
        loadComponent: () => import('./components/admin/users/users.component').then(m => m.UsersComponent) 
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
