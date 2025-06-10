import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { ExamResetService, FailedStudent, StudentExamHistory, ExamResetRequest } from '../../services/exam-reset.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-exam-reset-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatExpansionModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './exam-reset-manager.component.html',
  styleUrl: './exam-reset-manager.component.css'
})
export class ExamResetManagerComponent implements OnInit {
  failedStudents: FailedStudent[] = [];
  allStudents: User[] = [];
  selectedStudent: User | null = null;
  studentExamHistory: StudentExamHistory[] = [];
  loading = false;
  loadingHistory = false;

  // Reset form
  resetRequest: ExamResetRequest = {
    studentId: '',
    examId: '',
    reason: ''
  };

  constructor(
    private examResetService: ExamResetService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadFailedStudents();
    this.loadAllStudents();
  }

  loadFailedStudents(): void {
    this.loading = true;
    console.log('Loading failed students...');
    this.examResetService.getFailedStudents().subscribe({
      next: (students) => {
        console.log('Failed students loaded:', students);
        this.failedStudents = students;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading failed students:', error);
        this.loading = false;

        let errorMessage = 'Error loading failed students';
        if (error.status === 403) {
          errorMessage = 'Admin access required to view failed students';
        } else if (error.error?.msg) {
          errorMessage = error.error.msg;
        }

        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['snackbar-warn']
        });
      }
    });
  }

  loadAllStudents(): void {
    console.log('Loading all students...');
    this.authService.getUsers().subscribe({
      next: (users) => {
        console.log('All users loaded:', users);
        this.allStudents = users.filter(user => user.role === 'student');
        console.log('Students filtered:', this.allStudents);
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.snackBar.open('Error loading students. Please check your admin permissions.', 'Close', {
          duration: 5000,
          panelClass: ['snackbar-warn']
        });
      }
    });
  }

  onStudentSelected(): void {
    if (this.selectedStudent) {
      this.loadStudentExamHistory(this.selectedStudent._id);
    }
  }

  selectFailedStudent(student: any): void {
    // Convert the failed student object to match User interface
    this.selectedStudent = {
      _id: student._id,
      username: student.username,
      email: student.email,
      role: 'student',
      createdAt: new Date(),
      __v: 0
    } as User;
    this.onStudentSelected();
  }

  loadStudentExamHistory(studentId: string): void {
    this.loadingHistory = true;
    this.examResetService.getStudentExamHistory(studentId).subscribe({
      next: (history) => {
        this.studentExamHistory = history || [];
        this.loadingHistory = false;
        console.log('Student exam history loaded:', history);
      },
      error: (error) => {
        console.error('Error loading student exam history:', error);
        this.loadingHistory = false;

        let errorMessage = 'Error loading student exam history';
        if (error.status === 403) {
          errorMessage = 'Admin access required';
        } else if (error.status === 404) {
          errorMessage = 'Student not found';
        } else if (error.error?.msg) {
          errorMessage = error.error.msg;
        }

        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['snackbar-warn']
        });
      }
    });
  }

  resetExam(studentId: string, examId: string, examTitle: string): void {
    const reason = prompt(`Enter reason for resetting "${examTitle}" for this student:`);
    if (!reason) return;

    const request: ExamResetRequest = {
      studentId,
      examId,
      reason
    };

    this.examResetService.resetExamForStudent(request).subscribe({
      next: (response) => {
        this.snackBar.open(response.msg, 'Close', {
          duration: 5000,
          panelClass: ['snackbar-success']
        });
        
        // Refresh data
        this.loadFailedStudents();
        if (this.selectedStudent) {
          this.loadStudentExamHistory(this.selectedStudent._id);
        }
      },
      error: (error) => {
        const errorMessage = error.error?.msg || 'Error resetting exam';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['snackbar-warn']
        });
      }
    });
  }

  getScoreColor(percentage: number): string {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'primary';
    return 'warn';
  }

  getGradeFromScore(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getAttemptStatus(attempts: any[]): string {
    const maxAttempts = 3;
    const currentAttempts = attempts.length;
    return `${currentAttempts}/${maxAttempts} attempts used`;
  }
}
