import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StudentExamHistory {
  exam: {
    _id: string;
    title: string;
    description: string;
    duration: number;
  };
  attempts: {
    _id: string;
    score: number;
    totalMarks: number;
    percentage: number;
    submittedAt: Date;
    attemptNumber: number;
  }[];
  totalAttempts: number;
  bestScore: number;
  lastAttempt: Date;
  canReset: boolean;
  hasFailed: boolean;
}

export interface FailedStudent {
  student: {
    _id: string;
    username: string;
    email: string;
    role?: string;
    createdAt?: Date;
    __v?: number;
  };
  failedExams: {
    exam: {
      _id: string;
      title: string;
      description: string;
    };
    attempts: {
      score: number;
      percentage: number;
      submittedAt: Date;
      attemptNumber: number;
    }[];
    canReset: boolean;
    totalAttempts: number;
  }[];
}

export interface ExamResetRequest {
  studentId: string;
  examId: string;
  reason: string;
}

export interface ExamResetResponse {
  msg: string;
  reset: {
    _id: string;
    studentId: any;
    examId: any;
    reason: string;
    grantedBy: any;
    attemptsLeft: number;
    canRetry: boolean;
    grantedAt: Date;
  };
  attemptsUsed: number;
  attemptsRemaining: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExamResetService {
  private apiUrl = 'http://localhost:5000/api/results';

  constructor(private http: HttpClient) { }

  // Get student's exam history for reset management
  getStudentExamHistory(studentId: string): Observable<StudentExamHistory[]> {
    console.log('Fetching exam history for student ID:', studentId);
    console.log('API URL:', `${this.apiUrl}/student/${studentId}/history`);
    return this.http.get<StudentExamHistory[]>(`${this.apiUrl}/student/${studentId}/history`);
  }

  // Reset exam for student (allow retake)
  resetExamForStudent(request: ExamResetRequest): Observable<ExamResetResponse> {
    return this.http.post<ExamResetResponse>(`${this.apiUrl}/reset-exam`, request);
  }

  // Get all failed students who can have exam resets
  getFailedStudents(): Observable<FailedStudent[]> {
    return this.http.get<FailedStudent[]>(`${this.apiUrl}/failed-students`);
  }
}
