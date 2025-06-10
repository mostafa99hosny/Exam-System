
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    RouterModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Initialize component
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.snackBar.open('Please enter valid credentials', 'Close', {
        duration: 2500,
        panelClass: ['snackbar-warn']
      });
      return;
    }

    this.loading = true;
    const credentials = this.loginForm.value;

    this.authService.login(credentials)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          console.log('Login response:', response);
          console.log('Setting token:', response.token);

          this.authService.setToken(response.token);

          // Verify token was stored
          const storedToken = localStorage.getItem('token');
          console.log('Token stored successfully:', !!storedToken);
          console.log('AuthService isAuthenticated after setToken:', this.authService.isAuthenticated());

          // Decode token to get user role
          const payload = JSON.parse(atob(response.token.split('.')[1]));
          const role = payload.user.role;
          console.log('User role:', role);

          this.snackBar.open('Login successful', 'Close', {
            duration: 2000,
            panelClass: ['snackbar-success']
          });

          setTimeout(() => {
            console.log('Attempting navigation to:', role === 'admin' ? '/admin-dashboard' : '/student-dashboard');
            console.log('Token before navigation:', !!localStorage.getItem('token'));

            if (role === 'admin') {
              this.router.navigate(['/admin-dashboard']).then(success => {
                console.log('Navigation success:', success);
                console.log('Token after navigation:', !!localStorage.getItem('token'));
              }).catch(error => {
                console.error('Navigation error:', error);
              });
            } else {
              this.router.navigate(['/student-dashboard']).then(success => {
                console.log('Navigation success:', success);
                console.log('Token after navigation:', !!localStorage.getItem('token'));
              }).catch(error => {
                console.error('Navigation error:', error);
              });
            }
          }, 500);
        },
        error: (error) => {
          const errorMessage = error.error?.message || error.error?.msg || 'Invalid credentials';
          this.snackBar.open(`Login failed: ${errorMessage}`, 'Close', {
            duration: 3000,
            panelClass: ['snackbar-warn']
          });
        }
      });
  }
}
