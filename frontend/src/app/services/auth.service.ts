import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { User, UserUpdateRequest, UserFilter } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCurrentUser();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('x-auth-token', token || '');
  }

  private loadCurrentUser(): void {
    const token = this.getToken();
    console.log('AuthService: loadCurrentUser called, token exists:', !!token);
    if (token) {
      this.getCurrentUser().subscribe({
        next: (user) => {
          console.log('AuthService: Current user loaded:', user);
          this.currentUserSubject.next(user);
        },
        error: (error) => {
          console.error('AuthService: Error loading current user:', error);
          this.logout();
        }
      });
    }
  }

  getUsers(filter?: UserFilter): Observable<User[]> {
    let params = new HttpParams();

    if (filter) {
      if (filter.role) {
        params = params.set('role', filter.role);
      }
      if (filter.searchTerm) {
        params = params.set('search', filter.searchTerm);
      }
      if (filter.isActive !== undefined) {
        params = params.set('isActive', filter.isActive.toString());
      }
    }

    return this.http.get<User[]>(`${this.apiUrl}/users`, {
      headers: this.getHeaders(),
      params
    });
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`, { headers: this.getHeaders() });
  }

  updateUser(userId: string, userData: UserUpdateRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${userId}`, userData, { headers: this.getHeaders() });
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`, { headers: this.getHeaders() });
  }

  login(credentials: { email: string; password: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, credentials);
  }

  register(user: { username: string; email: string; password: string; role?: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/register`, user);
  }

  setToken(token: string): void {
    console.log('AuthService: Setting token in localStorage');
    localStorage.setItem('token', token);
    console.log('AuthService: Token stored successfully');

    // Load full user details from the server
    this.getCurrentUser().subscribe({
      next: (user) => {
        console.log('AuthService: Full user loaded after login:', user);
        this.currentUserSubject.next(user);
      },
      error: (error) => {
        console.error('AuthService: Error loading user after login:', error);
        // Fallback to token decoding
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const user = {
            _id: payload.user.id,
            role: payload.user.role,
            username: 'User',
            email: 'user@example.com'
          };
          console.log('AuthService: Fallback user info from token:', user);
          this.currentUserSubject.next(user as any);
        } catch (decodeError) {
          console.error('AuthService: Error decoding token:', decodeError);
        }
      }
    });
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user.role;
    } catch {
      return null;
    }
  }

  getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user.id;
    } catch {
      return null;
    }
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-password`, {
      currentPassword,
      newPassword
    }, { headers: this.getHeaders() });
  }

  resetPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, { email });
  }
}