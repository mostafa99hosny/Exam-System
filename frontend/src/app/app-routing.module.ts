import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { StudentDashboardComponent } from './pages/student-dashboard/student-dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard], data: { roles: ['admin'] } },
  { path: 'student-dashboard', component: StudentDashboardComponent, canActivate: [AuthGuard], data: { roles: ['student'] } },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];