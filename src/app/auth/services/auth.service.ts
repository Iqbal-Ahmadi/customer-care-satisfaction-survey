import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap, delay, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiClientService } from '../../shared/api/api-client.service';
import { LoginResponse, UserProfile, UserRole } from '../../shared/models/auth.models';
import { MockStoreService } from '../../shared/services/mock-store.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'access_token';
  private readonly profileKey = 'user_profile';
  private readonly userSubject = new BehaviorSubject<UserProfile | null>(this.loadUserProfile());

  readonly user$ = this.userSubject.asObservable();

  constructor(
    private readonly apiClient: ApiClientService,
    private readonly mockStoreService: MockStoreService
  ) { }

  login(username: string, password: string): Observable<LoginResponse> {
    // Use a mock login response when the backend is not available.
    if (environment.useMockAuth) {
      return this.handleMockLogin(username, password);
    }

    // Call the backend login API and persist the session on success.
    return this.apiClient
      .post<LoginResponse>('api/auth/dev-token', { username, password })
      .pipe(tap((response) => this.setSession(response.access_token, response.user)));
  }

  logout(): void {
    // Clear the session without relying on a backend logout endpoint.
    this.clearSession();
  }

  clearSession(): void {
    // Remove session storage values and notify subscribers.
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.profileKey);
    this.userSubject.next(null);
  }

  getToken(): string | null {
    // Read the current access token from session storage.
    return sessionStorage.getItem(this.tokenKey);
  }

  getUserProfile(): UserProfile | null {
    // Read the cached user profile from the subject.
    return this.userSubject.value;
  }

  isLoggedIn(): boolean {
    // A valid access token indicates an authenticated session.
    return Boolean(this.getToken());
  }

  private setSession(token: string, profile: UserProfile): void {
    // Persist session data for reloads and refresh the observable.
    sessionStorage.setItem(this.tokenKey, token);
    sessionStorage.setItem(this.profileKey, JSON.stringify(profile));
    this.userSubject.next(profile);
  }

  private loadUserProfile(): UserProfile | null {
    // Restore the user profile from session storage if available.
    const rawProfile = sessionStorage.getItem(this.profileKey);
    if (!rawProfile) {
      return null;
    }

    try {
      return JSON.parse(rawProfile) as UserProfile;
    } catch {
      return null;
    }
  }

  private handleMockLogin(username: string, password: string): Observable<LoginResponse> {
    // Simulate authentication and LDAP profile retrieval.
    const store = this.mockStoreService.getStore();
    const normalized = (username || '').trim();

    if (!normalized) {
      return throwError(() => ({ status: 401 }));
    }

    const existingUser = store.users.find(
      (user) => user.employee_id === normalized || user.name.toLowerCase() === normalized.toLowerCase()
    );

    const role = this.resolveMockRole(normalized, existingUser?.role);
    const userProfile: UserProfile = {
      employee_id: existingUser?.employee_id ?? normalized.toUpperCase(),
      name: existingUser?.name ?? normalized,
      role
    };

    if (existingUser?.locked) {
      return throwError(() => ({ status: 423 }));
    }

    if (!existingUser) {
      store.users.push({
        employee_id: userProfile.employee_id,
        name: userProfile.name,
        role: userProfile.role,
        locked: false
      });
      this.mockStoreService.saveStore(store);
    } else if (existingUser.role !== role) {
      existingUser.role = role;
      this.mockStoreService.saveStore(store);
    }

    const response: LoginResponse = {
      access_token: `mock-token-${Date.now()}`,
      token_type: 'Bearer',
      expires_in: 3600,
      user: userProfile
    };

    return of(response).pipe(
      delay(300),
      tap((mockResponse) => this.setSession(mockResponse.access_token, mockResponse.user))
    );
  }

  private resolveMockRole(username: string, existingRole?: UserRole): UserRole {
    // Determine the mock role based on the username keyword or existing role.
    const normalized = username.toLowerCase();
    if (normalized.includes('super')) {
      return 'SUPER_ADMIN';
    }

    if (normalized.includes('admin')) {
      return 'ADMIN';
    }

    return existingRole ?? 'USER';
  }
}