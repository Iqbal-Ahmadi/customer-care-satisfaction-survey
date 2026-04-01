import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, options?: { params?: HttpParams; headers?: HttpHeaders }): Observable<T> {
    // Compose the API URL for GET requests.
    return this.http.get<T>(this.buildUrl(path), options);
  }

  post<T>(path: string, body: unknown, options?: { params?: HttpParams; headers?: HttpHeaders }): Observable<T> {
    // Compose the API URL for POST requests.
    return this.http.post<T>(this.buildUrl(path), body, options);
  }

  put<T>(path: string, body: unknown, options?: { params?: HttpParams; headers?: HttpHeaders }): Observable<T> {
    // Compose the API URL for PUT requests.
    return this.http.put<T>(this.buildUrl(path), body, options);
  }
  delete<T>(path: string, options?: { params?: HttpParams; headers?: HttpHeaders }): Observable<T> {
  return this.http.delete<T>(this.buildUrl(path), options);
}


  private buildUrl(path: string): string {
    // Ensure API requests always use the configured base URL.
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${environment.apiBaseUrl}${normalizedPath}`;
  }
}
