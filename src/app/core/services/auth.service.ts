import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { API_ENDPOINTS, API_BASE_URL } from '../constants/api.constants';
import { LoginRequest, RegisterRequest, AuthResponse, User, AuthState } from '../models/auth.models';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly AUTH_STORAGE_KEY = 'corpo_agent_auth';
  private readonly TOKEN_STORAGE_KEY = 'corpo_agent_token';
  // Signals for reactive state management
  private authState = signal<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: false,
    error: null
  });

  // Public readonly signals
  public readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  public readonly user = computed(() => this.authState().user);
  public readonly isLoading = computed(() => this.authState().isLoading);
  public readonly error = computed(() => this.authState().error);

  constructor(private http: HttpClient, private router: Router) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const storedAuth = this.getStoredAuth();
    if (storedAuth) {
      this.authState.set({
        isAuthenticated: storedAuth.isAuthenticated ?? false,
        user: storedAuth.user ?? null,
        accessToken: storedAuth.accessToken ?? null,
        refreshToken: storedAuth.refreshToken ?? null,
        isLoading: false,
        error: null
      });
    }
  }

  private getStoredAuth(): Partial<AuthState> | null {
    try {
      const stored = localStorage.getItem(this.AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private storeAuth(authData: Partial<AuthState>): void {
    try {
      localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(authData));
    } catch (error) {
      console.error('Failed to store auth data:', error);
    }
  }

  private clearStoredAuth(): void {
    localStorage.removeItem(this.AUTH_STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.authState.update(state => ({ ...state, isLoading: true, error: null }));

    return this.http.post<AuthResponse>(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, credentials)
      .pipe(
        tap(response => {
          const newState: AuthState = {
            isAuthenticated: true,
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isLoading: false,
            error: null
          };
          this.authState.set(newState);
          this.storeAuth(newState);
        }),
        catchError(error => {
          this.authState.update(state => ({
            ...state,
            isLoading: false,
            error: error.error?.message || 'Login failed'
          }));
          return throwError(() => error);
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    this.authState.update(state => ({ ...state, isLoading: true, error: null }));

    return this.http.post<AuthResponse>(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, userData)
      .pipe(
        tap(response => {
          const newState: AuthState = {
            isAuthenticated: true,
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isLoading: false,
            error: null
          };
          this.authState.set(newState);
          this.storeAuth(newState);
        }),
        catchError(error => {
          this.authState.update(state => ({
            ...state,
            isLoading: false,
            error: error.error?.message || 'Registration failed'
          }));
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    this.clearStoredAuth();
    this.authState.set({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null
    });
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.authState().refreshToken;
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, { refreshToken })
      .pipe(
        tap(response => {
          const newState: AuthState = {
            ...this.authState(),
            accessToken: response.accessToken,
            refreshToken: response.refreshToken
          };
          this.authState.set(newState);
          this.storeAuth(newState);
        }),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        })
      );
  }

  getAccessToken(): string | null {
    return this.authState().accessToken;
  }

  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
}
