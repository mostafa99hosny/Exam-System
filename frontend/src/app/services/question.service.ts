import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Question, QuestionCreateRequest, QuestionUpdateRequest, QuestionImport } from '../models/question.model';

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  private apiUrl = 'http://localhost:5000/api/questions';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('x-auth-token', token || '');
  }

  getQuestionsByExam(examId: string): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/exam/${examId}`, { headers: this.getHeaders() });
  }

  getQuestionById(id: string): Observable<Question> {
    return this.http.get<Question>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  createQuestion(question: QuestionCreateRequest): Observable<Question> {
    return this.http.post<Question>(this.apiUrl, question, { headers: this.getHeaders() });
  }

  updateQuestion(id: string, question: QuestionUpdateRequest): Observable<Question> {
    return this.http.put<Question>(`${this.apiUrl}/${id}`, question, { headers: this.getHeaders() });
  }

  deleteQuestion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  reorderQuestions(examId: string, questionIds: string[]): Observable<Question[]> {
    return this.http.patch<Question[]>(`${this.apiUrl}/exam/${examId}/reorder`,
      { questionIds }, { headers: this.getHeaders() });
  }

  importQuestions(examId: string, questions: QuestionImport[]): Observable<Question[]> {
    return this.http.post<Question[]>(`${this.apiUrl}/exam/${examId}/import`,
      { questions }, { headers: this.getHeaders() });
  }

  exportQuestions(examId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/exam/${examId}/export`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  bulkDeleteQuestions(questionIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bulk-delete`,
      { questionIds }, { headers: this.getHeaders() });
  }
}
