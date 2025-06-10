import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Result, ResultFilter, ResultAnalytics, Answer } from '../models/result.model';

@Injectable({
  providedIn: 'root',
})
export class ResultService {
  private apiUrl = 'http://localhost:5000/api/results';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('x-auth-token', token || '');
  }

  getAllResults(filter?: ResultFilter): Observable<Result[]> {
    let params = new HttpParams();

    if (filter) {
      if (filter.dateFrom) {
        params = params.set('dateFrom', filter.dateFrom.toISOString());
      }
      if (filter.dateTo) {
        params = params.set('dateTo', filter.dateTo.toISOString());
      }
      if (filter.examId) {
        params = params.set('examId', filter.examId);
      }
      if (filter.studentRole) {
        params = params.set('studentRole', filter.studentRole);
      }
      if (filter.status) {
        params = params.set('status', filter.status);
      }
    }

    return this.http.get<Result[]>(this.apiUrl, {
      headers: this.getHeaders(),
      params
    });
  }

  getResultById(id: string): Observable<Result> {
    return this.http.get<Result>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  getStudentResults(studentId?: string): Observable<Result[]> {
    const url = studentId ? `${this.apiUrl}/student/${studentId}` : `${this.apiUrl}/my-results`;
    return this.http.get<Result[]>(url, { headers: this.getHeaders() });
  }

  getExamResults(examId: string): Observable<Result[]> {
    return this.http.get<Result[]>(`${this.apiUrl}/exam/${examId}`, { headers: this.getHeaders() });
  }

  submitResult(data: { examId: string; answers: Answer[] }): Observable<Result> {
    return this.http.post<Result>(this.apiUrl, data, { headers: this.getHeaders() });
  }

  getResultAnalytics(examId?: string): Observable<ResultAnalytics> {
    const url = examId ? `${this.apiUrl}/analytics/${examId}` : `${this.apiUrl}/analytics`;
    return this.http.get<ResultAnalytics>(url, { headers: this.getHeaders() });
  }

  exportResults(format: 'pdf' | 'csv', filter?: ResultFilter): Observable<Blob> {
    let params = new HttpParams().set('format', format);

    if (filter) {
      if (filter.dateFrom) {
        params = params.set('dateFrom', filter.dateFrom.toISOString());
      }
      if (filter.dateTo) {
        params = params.set('dateTo', filter.dateTo.toISOString());
      }
      if (filter.examId) {
        params = params.set('examId', filter.examId);
      }
    }

    return this.http.get(`${this.apiUrl}/export`, {
      headers: this.getHeaders(),
      params,
      responseType: 'blob'
    });
  }

  deleteResult(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}