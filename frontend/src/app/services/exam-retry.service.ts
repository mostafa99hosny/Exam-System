import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ExamRetry {
  _id: string;
  studentId: { _id: string; username: string; email: string };
  examId: { _id: string; title: string };
  grantedBy: { _id: string; username: string };
  reason: string;
  isUsed: boolean;
  grantedAt: Date;
  usedAt?: Date;
}

export interface RetryPermissionRequest {
  studentId: string;
  examId: string;
  reason: string;
}

export interface CanRetryResponse {
  canRetry: boolean;
  reason: string;
  retry?: ExamRetry;
}

@Injectable({
  providedIn: 'root',
})
export class ExamRetryService {
  private apiUrl = 'http://localhost:5000/api/exam-retry';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('x-auth-token', token || '');
  }

  // Grant retry permission (admin only)
  grantRetry(request: RetryPermissionRequest): Observable<ExamRetry> {
    return this.http.post<ExamRetry>(`${this.apiUrl}/grant`, request, { headers: this.getHeaders() });
  }

  // Get all retry permissions (admin only)
  getAllRetries(): Observable<ExamRetry[]> {
    return this.http.get<ExamRetry[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // Get retry permissions for a specific student
  getStudentRetries(studentId?: string): Observable<ExamRetry[]> {
    const url = studentId ? `${this.apiUrl}/student/${studentId}` : `${this.apiUrl}/my-retries`;
    return this.http.get<ExamRetry[]>(url, { headers: this.getHeaders() });
  }

  // Check if student can retry an exam
  canRetryExam(examId: string): Observable<CanRetryResponse> {
    return this.http.get<CanRetryResponse>(`${this.apiUrl}/can-retry/${examId}`, { headers: this.getHeaders() });
  }

  // Revoke retry permission (admin only)
  revokeRetry(retryId: string): Observable<{ msg: string }> {
    return this.http.delete<{ msg: string }>(`${this.apiUrl}/${retryId}`, { headers: this.getHeaders() });
  }
}
