import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Exam, ExamCreateRequest, ExamUpdateRequest } from '../models/exam.model';

@Injectable({
  providedIn: 'root',
})
export class ExamService {
  private apiUrl = 'http://localhost:5000/api/exams';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('x-auth-token', token || '');
  }

  getExams(): Observable<Exam[]> {
    return this.http.get<Exam[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getPublishedExams(): Observable<Exam[]> {
    return this.getExams().pipe(
      map(exams => exams.filter(exam => exam.isPublished !== false))
    );
  }

  getExamById(id: string): Observable<Exam> {
    return this.http.get<Exam>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  createExam(exam: ExamCreateRequest): Observable<Exam> {
    console.log('ExamService: Creating exam with data:', exam);
    console.log('ExamService: Headers:', this.getHeaders());
    return this.http.post<Exam>(this.apiUrl, exam, { headers: this.getHeaders() });
  }

  updateExam(id: string, exam: ExamUpdateRequest): Observable<Exam> {
    return this.http.put<Exam>(`${this.apiUrl}/${id}`, exam, { headers: this.getHeaders() });
  }

  deleteExam(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  deleteMultipleExams(ids: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bulk-delete`, { ids }, { headers: this.getHeaders() });
  }

  publishExam(id: string): Observable<Exam> {
    return this.http.patch<Exam>(`${this.apiUrl}/${id}/publish`, {}, { headers: this.getHeaders() });
  }

  unpublishExam(id: string): Observable<Exam> {
    return this.http.patch<Exam>(`${this.apiUrl}/${id}/unpublish`, {}, { headers: this.getHeaders() });
  }

  togglePublishStatus(id: string, isPublished: boolean): Observable<Exam> {
    return isPublished ? this.publishExam(id) : this.unpublishExam(id);
  }

  getExamPreview(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/preview`, { headers: this.getHeaders() });
  }
}