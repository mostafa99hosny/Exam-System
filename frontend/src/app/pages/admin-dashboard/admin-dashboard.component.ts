import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { ExamService } from '../../services/exam.service';
import { QuestionService } from '../../services/question.service';
import { ResultService } from '../../services/result.service';
import { AuthService } from '../../services/auth.service';
import { ExamRetryService, ExamRetry, RetryPermissionRequest } from '../../services/exam-retry.service';
import { ExamResetManagerComponent } from '../../components/exam-reset-manager/exam-reset-manager.component';
import { Exam } from '../../models/exam.model';
import { Question } from '../../models/question.model';
import { Result } from '../../models/result.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatListModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDialogModule,
    FlexLayoutModule,
    FormsModule,
    ExamResetManagerComponent
  ]
})
export class AdminDashboardComponent implements OnInit {
  // Navigation and UI state
  activeTab: string = 'overview';
  loading = false;

  // Data arrays
  exams: Exam[] = [];
  questions: Question[] = [];
  results: Result[] = [];
  users: User[] = [];
  retries: ExamRetry[] = [];
  filteredResults: Result[] = [];

  // Search and filters
  selectedExamId: string | null = null;
  searchTerm: string = '';

  // Retry management
  retryRequest: RetryPermissionRequest = {
    studentId: '',
    examId: '',
    reason: ''
  };

  // Form models
  newExam = { title: '', description: '', duration: 60, isPublished: false };
  newQuestion = { examId: '', text: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 };

  // Editing states
  editingExam: Exam | null = null;
  editingQuestion: Question | null = null;

  // Notifications
  notifications = [
    { id: 1, title: 'New student registered', icon: 'person_add', type: 'info', time: new Date() },
    { id: 2, title: 'Exam completed', icon: 'assignment_turned_in', type: 'success', time: new Date() },
    { id: 3, title: 'System maintenance scheduled', icon: 'warning', type: 'warning', time: new Date() }
  ];

  // Statistics
  stats = {
    totalExams: 0,
    totalQuestions: 0,
    totalUsers: 0,
    totalSubmissions: 0,
    averageScore: 0,
    completionRate: 0
  };

  // Bulk actions
  selectedExams: string[] = [];
  selectedQuestions: string[] = [];
  bulkActionMode = false;

  isCreateQuestionDisabled(): boolean {
    // Disable if no exam is selected, question text is empty, or not all options are filled, or marks is not set
    if (!this.selectedExamId || !this.newQuestion.text || this.newQuestion.marks <= 0) return true;
    if (!this.newQuestion.options.every(opt => !!opt)) return true;
    return false;
  }

  constructor(
    private examService: ExamService,
    private questionService: QuestionService,
    private resultService: ResultService,
    private authService: AuthService,
    private examRetryService: ExamRetryService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('AdminDashboard ngOnInit - checking authentication');
    console.log('Token exists:', !!localStorage.getItem('token'));
    console.log('AuthService isAuthenticated:', this.authService.isAuthenticated());
    console.log('User role:', this.authService.getUserRole());

    this.loadExams();
    this.loadUsers();
    this.loadResults();
    this.updateStats();
  }

  loadExams(): void {
    this.examService.getExams().subscribe({
      next: (data) => (this.exams = data),
      error: () => this.snackBar.open('Error loading exams', 'Close', {
        duration: 3000,
        panelClass: ['snackbar-warn']
      })
    });
  }

  loadUsers(): void {
    this.authService.getUsers().subscribe({
      next: (data) => (this.users = data),
      error: () => this.snackBar.open('Error loading users', 'Close', {
        duration: 3000,
        panelClass: ['snackbar-warn']
      })
    });
  }

  loadQuestions(examId: string): void {
    this.selectedExamId = examId;
    this.questionService.getQuestionsByExam(examId).subscribe({
      next: (data) => (this.questions = data),
      error: () => this.snackBar.open('Error loading questions', 'Close', {
        duration: 3000,
        panelClass: ['snackbar-warn']
      })
    });
  }

  loadResults(): void {
    this.resultService.getAllResults().subscribe({
      next: (data) => {
        this.results = data;
        this.filterResults();
      },
      error: () => this.snackBar.open('Error loading results', 'Close', {
        duration: 3000,
        panelClass: ['snackbar-warn']
      })
    });
  }



  createExam(): void {
    console.log('Creating exam with data:', this.newExam);

    // Check if user is authenticated using AuthService
    const isAuthenticated = this.authService.isAuthenticated();
    const token = this.authService.getToken();
    const userRole = this.authService.getUserRole();

    console.log('AuthService isAuthenticated:', isAuthenticated);
    console.log('Token exists:', !!token);
    console.log('User role:', userRole);

    if (!isAuthenticated || !token) {
      console.error('User not authenticated');
      this.snackBar.open('Authentication required. Please login again.', 'Close', {
        duration: 3000,
        panelClass: ['snackbar-warn']
      });
      // Redirect to login
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    if (userRole !== 'admin') {
      console.error('User is not an admin');
      this.snackBar.open('Admin access required', 'Close', {
        duration: 3000,
        panelClass: ['snackbar-warn']
      });
      return;
    }

    this.loading = true;

    // Create a clean exam object without isPublished if it's false
    const examData = {
      title: this.newExam.title.trim(),
      description: this.newExam.description.trim(),
      duration: this.newExam.duration
    };

    console.log('Sending exam data:', examData);

    this.examService.createExam(examData).subscribe({
      next: (exam) => {
        console.log('Exam created successfully:', exam);
        this.exams.push(exam);
        this.resetExamForm();
        this.loading = false;
        this.updateStats();
        this.snackBar.open('Exam created successfully! 🎉', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });

        // Force form validation reset
        setTimeout(() => {
          this.resetExamForm();
        }, 100);
      },
      error: (error) => {
        console.error('Error creating exam:', error);
        this.loading = false;
        let errorMessage = 'Error creating exam';

        if (error.status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid exam data. Please check your inputs.';
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }

        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['snackbar-warn']
        });
      }
    });
  }

  updateExam(): void {
    if (this.editingExam) {
      this.examService.updateExam(this.editingExam._id, this.editingExam).subscribe({
        next: (updatedExam) => {
          const index = this.exams.findIndex(e => e._id === updatedExam._id);
          if (index !== -1) this.exams[index] = updatedExam;
          this.editingExam = null;
          this.snackBar.open('Exam updated successfully', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
        },
        error: () => this.snackBar.open('Error updating exam', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-warn']
        })
      });
    }
  }

  deleteExam(examId: string): void {
    const exam = this.exams.find(e => e._id === examId);
    if (!exam) return;

    const confirmed = confirm(`⚠️ Delete Exam: "${exam.title}"\n\nThis will permanently delete:\n• The exam and all its questions\n• All student results for this exam\n• This action cannot be undone\n\nAre you sure you want to continue?`);

    if (confirmed) {
      this.loading = true;
      this.examService.deleteExam(examId).subscribe({
        next: () => {
          this.exams = this.exams.filter(e => e._id !== examId);
          this.questions = this.questions.filter(q => q.examId !== examId);
          if (this.selectedExamId === examId) {
            this.selectedExamId = null;
          }
          this.loading = false;
          this.updateStats();
          this.snackBar.open('Exam deleted successfully! 🗑️', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
        },
        error: (error) => {
          this.loading = false;
          console.error('Error deleting exam:', error);
          let errorMessage = 'Error deleting exam';

          if (error.status === 401) {
            errorMessage = 'Not authorized to delete this exam';
          } else if (error.status === 404) {
            errorMessage = 'Exam not found';
          } else if (error.error && error.error.msg) {
            errorMessage = error.error.msg;
          }

          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['snackbar-warn']
          });
        }
      });
    }
  }

  createQuestion(): void {
    if (this.selectedExamId) {
      this.newQuestion.examId = this.selectedExamId;
      this.questionService.createQuestion(this.newQuestion).subscribe({
        next: (question) => {
          this.questions.push(question);
          this.resetQuestionForm();
          this.snackBar.open('Question created successfully! 🎉', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });

          // Force form validation reset
          setTimeout(() => {
            this.resetQuestionForm();
          }, 100);
        },
        error: () => this.snackBar.open('Error creating question', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-warn']
        })
      });
    }
  }

  updateQuestion(): void {
    if (!this.editingQuestion) return;

    // Validate question data
    if (!this.editingQuestion.text.trim()) {
      this.snackBar.open('Question text is required', 'Close', {
        duration: 3000,
        panelClass: ['snackbar-warn']
      });
      return;
    }

    if (this.editingQuestion.options.some(option => !option.trim())) {
      this.snackBar.open('All answer options must be filled', 'Close', {
        duration: 3000,
        panelClass: ['snackbar-warn']
      });
      return;
    }

    if (this.editingQuestion.marks < 1 || this.editingQuestion.marks > 10) {
      this.snackBar.open('Marks must be between 1 and 10', 'Close', {
        duration: 3000,
        panelClass: ['snackbar-warn']
      });
      return;
    }

    this.loading = true;
    console.log('Updating question:', this.editingQuestion);

    this.questionService.updateQuestion(this.editingQuestion._id, this.editingQuestion).subscribe({
      next: (updatedQuestion) => {
        console.log('Question updated successfully:', updatedQuestion);
        const index = this.questions.findIndex(q => q._id === updatedQuestion._id);
        if (index !== -1) {
          this.questions[index] = updatedQuestion;
        }
        this.editingQuestion = null;
        this.loading = false;
        this.snackBar.open('Question updated successfully! ✏️', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      },
      error: (error) => {
        console.error('Error updating question:', error);
        this.loading = false;

        let errorMessage = 'Error updating question';
        if (error.status === 401) {
          errorMessage = 'Not authorized to update this question';
        } else if (error.status === 404) {
          errorMessage = 'Question not found';
        } else if (error.error && error.error.msg) {
          errorMessage = error.error.msg;
        }

        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['snackbar-warn']
        });
      }
    });
  }

  deleteQuestion(questionId: string): void {
    const question = this.questions.find(q => q._id === questionId);
    if (!question) return;

    const confirmed = confirm(`⚠️ Delete Question\n\n"${question.text.substring(0, 100)}${question.text.length > 100 ? '...' : ''}"\n\nThis will permanently delete:\n• The question and all its options\n• Any student answers to this question\n• This action cannot be undone\n\nAre you sure you want to continue?`);

    if (confirmed) {
      this.loading = true;
      console.log('Deleting question:', questionId);

      this.questionService.deleteQuestion(questionId).subscribe({
        next: () => {
          console.log('Question deleted successfully');
          this.questions = this.questions.filter(q => q._id !== questionId);

          // If we were editing this question, clear the editing state
          if (this.editingQuestion && this.editingQuestion._id === questionId) {
            this.editingQuestion = null;
          }

          this.loading = false;
          this.snackBar.open('Question deleted successfully! 🗑️', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
        },
        error: (error) => {
          console.error('Error deleting question:', error);
          this.loading = false;

          let errorMessage = 'Error deleting question';
          if (error.status === 401) {
            errorMessage = 'Not authorized to delete this question';
          } else if (error.status === 404) {
            errorMessage = 'Question not found';
          } else if (error.error && error.error.msg) {
            errorMessage = error.error.msg;
          }

          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['snackbar-warn']
          });
        }
      });
    }
  }

  startEditingExam(exam: Exam): void {
    this.editingExam = { ...exam };
  }

  startEditingQuestion(question: Question): void {
    this.editingQuestion = { ...question };
  }

  cancelEditing(): void {
    this.editingExam = null;
    this.editingQuestion = null;
  }

  onSearchChange(): void {
    this.filterResults();
  }

  // Navigation methods
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.updateStats();
  }

  // Notification methods
  clearNotifications(): void {
    this.notifications = [];
  }



  // User management
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Statistics calculation
  updateStats(): void {
    this.stats = {
      totalExams: this.exams.length,
      totalQuestions: this.questions.length,
      totalUsers: this.users.length,
      totalSubmissions: this.results.length,
      averageScore: this.calculateAverageScore(),
      completionRate: this.calculateCompletionRate()
    };
  }

  private calculateAverageScore(): number {
    if (this.results.length === 0) return 0;

    // Filter out invalid results and use percentage instead of score
    const validResults = this.results.filter(r =>
      r.percentage !== undefined &&
      !isNaN(r.percentage) &&
      r.percentage >= 0
    );

    if (validResults.length === 0) return 0;

    const totalPercentage = validResults.reduce((sum, result) => sum + (result.percentage || 0), 0);
    return Math.round((totalPercentage / validResults.length) * 100) / 100;
  }

  private calculateCompletionRate(): number {
    if (this.exams.length === 0 || this.users.length === 0) return 0;
    const totalPossibleSubmissions = this.exams.length * this.users.filter(u => u.role === 'student').length;
    return Math.round((this.results.length / totalPossibleSubmissions) * 100);
  }

  // Enhanced exam creation with validation
  isCreateExamDisabled(): boolean {
    return !this.newExam.title.trim() ||
           !this.newExam.description.trim() ||
           this.newExam.duration <= 0 ||
           this.loading;
  }

  // Enhanced question creation with better validation
  isCreateQuestionFormValid(): boolean {
    return this.selectedExamId !== null &&
           this.newQuestion.text.trim() !== '' &&
           this.newQuestion.options.every(opt => opt.trim() !== '') &&
           this.newQuestion.marks > 0 &&
           this.newQuestion.correctAnswer >= 0 &&
           this.newQuestion.correctAnswer < this.newQuestion.options.length;
  }

  // Form reset methods
  resetExamForm(): void {
    this.newExam = { title: '', description: '', duration: 60, isPublished: false };
  }

  resetQuestionForm(): void {
    this.newQuestion = { examId: '', text: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 };
  }

  // Helper methods for displaying counts
  getQuestionCount(examId: string): number {
    return this.questions.filter(q => q.examId === examId).length;
  }

  getSubmissionCount(examId: string): number {
    return this.results.filter(result =>
      (typeof result.examId === 'string' ? result.examId : result.examId._id) === examId
    ).length;
  }

  // Helper method for option labels
  getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }

  // Helper method for score styling
  getScoreClass(score: number): string {
    if (score >= 80) return 'high-score';
    if (score >= 60) return 'medium-score';
    return 'low-score';
  }

  // Bulk Actions
  toggleBulkMode(): void {
    this.bulkActionMode = !this.bulkActionMode;
    if (!this.bulkActionMode) {
      this.selectedExams = [];
      this.selectedQuestions = [];
    }
  }

  toggleExamSelection(examId: string): void {
    const index = this.selectedExams.indexOf(examId);
    if (index > -1) {
      this.selectedExams.splice(index, 1);
    } else {
      this.selectedExams.push(examId);
    }
  }

  selectAllExams(): void {
    this.selectedExams = this.exams.map(exam => exam._id);
  }

  deselectAllExams(): void {
    this.selectedExams = [];
  }

  bulkDeleteExams(): void {
    if (this.selectedExams.length === 0) return;

    const confirmed = confirm(`⚠️ Bulk Delete ${this.selectedExams.length} Exams\n\nThis will permanently delete all selected exams and their associated questions and results.\n\nThis action cannot be undone.\nAre you sure you want to continue?`);

    if (confirmed) {
      this.loading = true;
      let deletedCount = 0;
      const totalToDelete = this.selectedExams.length;

      this.selectedExams.forEach(examId => {
        this.examService.deleteExam(examId).subscribe({
          next: () => {
            deletedCount++;
            this.exams = this.exams.filter(e => e._id !== examId);

            if (deletedCount === totalToDelete) {
              this.loading = false;
              this.selectedExams = [];
              this.bulkActionMode = false;
              this.updateStats();
              this.snackBar.open(`${deletedCount} exams deleted successfully! 🗑️`, 'Close', {
                duration: 3000,
                panelClass: ['snackbar-success']
              });
            }
          },
          error: (error) => {
            console.error('Error deleting exam:', error);
            deletedCount++;

            if (deletedCount === totalToDelete) {
              this.loading = false;
              this.selectedExams = [];
              this.bulkActionMode = false;
              this.updateStats();
              this.snackBar.open('Some exams could not be deleted', 'Close', {
                duration: 5000,
                panelClass: ['snackbar-warn']
              });
            }
          }
        });
      });
    }
  }

  // Export functionality
  exportResults(): void {
    this.resultService.exportResults('csv').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `exam-results-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.snackBar.open('Results exported successfully! 📊', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      },
      error: (error) => {
        console.error('Error exporting results:', error);
        this.snackBar.open('Error exporting results', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-warn']
        });
      }
    });
  }

  // Advanced search and filtering
  filterResults(): void {
    if (!this.searchTerm.trim()) {
      this.filteredResults = this.results;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredResults = this.results.filter(result =>
      result.studentId.username.toLowerCase().includes(searchLower) ||
      result.examId.title.toLowerCase().includes(searchLower) ||
      result.score.toString().includes(searchLower)
    );
  }

  // Quick stats methods
  getPassingRate(): number {
    if (this.results.length === 0) return 0;
    const passingResults = this.results.filter(result => result.score >= 60);
    return Math.round((passingResults.length / this.results.length) * 100);
  }

  getTopPerformers(): any[] {
    return this.results
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(result => ({
        student: result.studentId.username,
        exam: result.examId.title,
        score: result.score
      }));
  }

  getRecentActivity(): any[] {
    return this.results
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 10)
      .map(result => ({
        student: result.studentId.username,
        exam: result.examId.title,
        score: result.score,
        date: result.submittedAt
      }));
  }

  // Retry Management Methods
  grantRetryPermission(): void {
    if (!this.retryRequest.studentId || !this.retryRequest.examId || !this.retryRequest.reason.trim()) {
      this.snackBar.open('Please fill all fields', 'Close', {
        duration: 3000,
        panelClass: ['snackbar-warn']
      });
      return;
    }

    this.loading = true;
    this.examRetryService.grantRetry(this.retryRequest).subscribe({
      next: (retry) => {
        this.retries.push(retry);
        this.retryRequest = { studentId: '', examId: '', reason: '' };
        this.loading = false;
        this.snackBar.open('Retry permission granted successfully! 🔄', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      },
      error: (error) => {
        this.loading = false;
        const errorMessage = error.error?.msg || 'Error granting retry permission';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['snackbar-warn']
        });
      }
    });
  }

  loadRetries(): void {
    this.examRetryService.getAllRetries().subscribe({
      next: (retries) => {
        this.retries = retries;
      },
      error: (error) => {
        console.error('Error loading retries:', error);
      }
    });
  }

  revokeRetry(retryId: string): void {
    const confirmed = confirm('Are you sure you want to revoke this retry permission?');
    if (!confirmed) return;

    this.examRetryService.revokeRetry(retryId).subscribe({
      next: () => {
        this.retries = this.retries.filter(r => r._id !== retryId);
        this.snackBar.open('Retry permission revoked', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      },
      error: (error) => {
        const errorMessage = error.error?.msg || 'Error revoking retry permission';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 3000,
          panelClass: ['snackbar-warn']
        });
      }
    });
  }

  getFailedStudents(): { studentId: string; studentName: string; examId: string; examTitle: string }[] {
    return this.results
      .filter(result => result.percentage < 60 && result.attemptNumber === 1)
      .map(result => ({
        studentId: result.studentId._id,
        studentName: result.studentId.username,
        examId: result.examId._id,
        examTitle: result.examId.title
      }));
  }
}