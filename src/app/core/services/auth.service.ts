import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { API_ENDPOINTS, API_BASE_URL } from '../constants/api.constants';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_STORAGE_KEY = 'corpo_agent_token';
  
  // Simple properties
  public isAuthenticated = false;
  public user: User | null = null;
  public isLoading = false;
  public error: string | null = null;

  constructor(private http: HttpClient) {
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    const token = this.getStoredToken();
    if (token && !this.isTokenExpired(token)) {
      this.isAuthenticated = true;
      this.loadUserProfile();
    }
  }

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private storeToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_STORAGE_KEY, token);
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  private clearStoredToken(): void {
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
  }

  private loadUserProfile(): void {
    this.http.get<User>(`${API_BASE_URL}${API_ENDPOINTS.AUTH.PROFILE}`).subscribe({
      next: (user) => {
        this.user = user;
      },
      error: (error) => {
        console.error('Failed to load user profile:', error);
        if (error?.status === 401) {
          this.logout();
        } else {
          // Keep session if token is present and not expired
          if (this.getStoredToken() && !this.isTokenExpired()) {
            this.isAuthenticated = true;
          }
        }
      }
    });
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.isLoading = true;
    this.error = null;
    return this.http.post<AuthResponse>(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, credentials)
      .pipe(
        tap(response => {
          // Backend returns 'access_token'
          this.storeToken(response.access_token);
          //console.log('Storing token:', response.access_token);
          
          this.isAuthenticated = true;
          this.user = response.user;
          this.isLoading = false;
        }),
        catchError(error => {
          this.error = error.error?.message || 'Login failed';
          this.isLoading = false;
          return throwError(() => error);
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    this.isLoading = true;
    this.error = null;

    return this.http.post<AuthResponse>(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, userData)
      .pipe(
        tap(response => {
          // Backend returns 'access_token'
          this.storeToken(response.access_token);
          this.isAuthenticated = true;
          this.user = response.user;
          this.isLoading = false;
        }),
        catchError(error => {
          this.error = error.error?.message || 'Registration failed';
          this.isLoading = false;
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    this.clearStoredToken();
    this.isAuthenticated = false;
    this.user = null;
    this.error = null;
  }

  refreshToken(): Observable<AuthResponse> {
    // For now, we'll implement a simple refresh
    // In a real app, you'd store and use the refresh token
    return throwError(() => new Error('Refresh token not implemented'));
  }

  getAccessToken(): string | null {
    return this.getStoredToken();
  }

  isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || this.getAccessToken();
    if (!tokenToCheck) return true;

    try {
      const payload = JSON.parse(atob(tokenToCheck.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  // Debug method to check auth state
  debugAuthState(): void {
    console.log('🔍 Auth State Debug:', {
      isAuthenticated: this.isAuthenticated,
      user: this.user,
      hasToken: !!this.getAccessToken(),
      tokenExpired: this.isTokenExpired(),
      storedToken: this.getStoredToken()
    });
  }
}