import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatRadioModule } from '@angular/material/radio';

import { ExamTakingComponent } from '../../components/exam-taking/exam-taking.component';
import { ResultViewComponent } from '../../components/result-view/result-view.component';
import { ExamService } from '../../services/exam.service';
import { QuestionService } from '../../services/question.service';
import { ResultService } from '../../services/result.service';
import { AuthService } from '../../services/auth.service';
import { ExamRetryService, CanRetryResponse } from '../../services/exam-retry.service';
import { Exam } from '../../models/exam.model';
import { Question } from '../../models/question.model';
import { Result, Answer } from '../../models/result.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatToolbarModule,
    MatTabsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatMenuModule,
    MatTooltipModule,
    MatRadioModule,
    FormsModule,
    ExamTakingComponent,
    ResultViewComponent
  ],
templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css'
})
export class StudentDashboardComponent implements OnInit {
  // Navigation and UI state
  activeTab = 'dashboard';
  currentUser: User | null = null;
  loading = false;

  // Exam data
  exams: Exam[] = [];
  availableExams: Exam[] = [];
  completedExams: Exam[] = [];
  takenExamIds: string[] = [];
  selectedExam: Exam | null = null;
  questions: Question[] = [];
  answers: { [questionId: string]: number } = {};
  result: Result | null = null;
  percentage: number | null = null;
  loadingExam = false;

  // Results and statistics
  myResults: Result[] = [];
  retryPermissions: Map<string, CanRetryResponse> = new Map();
  stats = {
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    bestScore: 0,
    totalTimeSpent: 0,
    completionRate: 0
  };

  // Search and filters
  searchTerm = '';
  filteredExams: Exam[] = [];

  // Notifications
  notifications: any[] = [];

  constructor(
    private examService: ExamService,
    private questionService: QuestionService,
    private resultService: ResultService,
    private authService: AuthService,
    private examRetryService: ExamRetryService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadExams();
    this.loadMyResults();
    this.loadNotifications();

    // Subscribe to current user changes for dynamic email display
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        console.log('Current user updated:', user);
      }
    });
  }

  loadCurrentUser(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  loadExams(): void {
    this.loading = true;
    this.examService.getExams().subscribe({
      next: (data) => {
        this.exams = data;
        this.filteredExams = data;
        this.categorizeExams();
        this.updateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading exams:', error);
        this.loading = false;
        this.snackBar.open('Error loading exams', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-warn']
        });
      }
    });
  }

  loadMyResults(): void {
    this.resultService.getStudentResults().subscribe({
      next: (results) => {
        console.log('Loaded my results:', results);
        this.myResults = results;
        this.takenExamIds = results.map(r => {
          if (typeof r.examId === 'string') {
            return r.examId;
          } else {
            return r.examId._id;
          }
        });
        console.log('Taken exam IDs:', this.takenExamIds);
        this.categorizeExams();
        this.updateStats();
        this.checkRetryPermissions();
      },
      error: (error) => {
        console.error('Error loading results:', error);
        this.snackBar.open('Error loading your exam results', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-warn']
        });
      }
    });
  }

  loadNotifications(): void {
    // Simulate notifications - in real app, this would come from an API
    this.notifications = [
      {
        id: 1,
        type: 'info',
        title: 'New Exam Available',
        message: 'A new exam "Advanced Mathematics" has been published',
        timestamp: new Date(),
        read: false
      },
      {
        id: 2,
        type: 'success',
        title: 'Exam Completed',
        message: 'You have successfully completed the "Basic Programming" exam',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        read: true
      }
    ];
  }

  canTakeExam(exam: Exam): boolean {
    const hasTaken = this.takenExamIds.includes(exam._id);
    if (!hasTaken) return true;

    // Check if student failed and can retry (automatic retry for failed students)
    const examResults = this.myResults.filter(r =>
      (typeof r.examId === 'string' ? r.examId : r.examId._id) === exam._id
    );

    if (examResults.length === 0) return true;

    // Sort by attempt number to get latest result
    const latestResult = examResults.sort((a, b) => (b.attemptNumber || 1) - (a.attemptNumber || 1))[0];

    // If failed and only one attempt, allow retry
    if (latestResult.percentage < 60 && (latestResult.attemptNumber || 1) === 1) {
      return true;
    }

    // Check if retry permission exists for other cases
    const retryInfo = this.retryPermissions.get(exam._id);
    return retryInfo?.canRetry || false;
  }

  getExamButtonText(exam: Exam): string {
    const examResults = this.myResults.filter(r =>
      (typeof r.examId === 'string' ? r.examId : r.examId._id) === exam._id
    );

    if (examResults.length === 0) return 'Start Exam';

    // Sort by attempt number to get latest result
    const latestResult = examResults.sort((a, b) => (b.attemptNumber || 1) - (a.attemptNumber || 1))[0];
    const attemptNumber = latestResult.attemptNumber || 1;

    if (latestResult.percentage >= 60) {
      return 'Completed';
    } else if (attemptNumber === 1) {
      return 'Retry Exam';
    } else {
      const retryInfo = this.retryPermissions.get(exam._id);
      if (retryInfo?.canRetry) {
        return 'Retry Exam';
      }
      return 'Completed';
    }
  }

  getExamStatus(exam: Exam): string {
    const examResults = this.myResults.filter(r =>
      (typeof r.examId === 'string' ? r.examId : r.examId._id) === exam._id
    );

    if (examResults.length === 0) return 'Available';

    // Sort by attempt number to get latest result
    const latestResult = examResults.sort((a, b) => (b.attemptNumber || 1) - (a.attemptNumber || 1))[0];
    const attemptNumber = latestResult.attemptNumber || 1;

    if (latestResult.percentage >= 60) {
      return `Passed (${latestResult.percentage.toFixed(1)}%)`;
    } else if (attemptNumber === 1) {
      return `Failed - Retry Available (${latestResult.percentage.toFixed(1)}%)`;
    } else {
      const retryInfo = this.retryPermissions.get(exam._id);
      if (retryInfo?.canRetry) {
        return `Retry Available`;
      }
      return `Failed (${latestResult.percentage.toFixed(1)}%)`;
    }
  }

  getExamStatusClass(exam: Exam): string {
    const status = this.getExamStatus(exam);
    return status.toLowerCase().replace(/[^a-z]/g, '-');
  }

  checkRetryPermissions(): void {
    // Check retry permissions for all exams that have been attempted
    const examIds = [...new Set(this.myResults.map(result =>
      typeof result.examId === 'string' ? result.examId : result.examId._id
    ))];

    examIds.forEach(examId => {
      this.examRetryService.canRetryExam(examId).subscribe({
        next: (response) => {
          this.retryPermissions.set(examId, response);
          console.log(`Retry permission for exam ${examId}:`, response);
        },
        error: (error) => {
          console.error(`Error checking retry permission for exam ${examId}:`, error);
        }
      });
    });
  }

  onTakeExam(exam: Exam): void {
    // Check if student can take the exam (considering retries)
    if (!this.canTakeExam(exam)) {
      const examResults = this.myResults.filter(r =>
        (typeof r.examId === 'string' ? r.examId : r.examId._id) === exam._id
      );

      if (examResults.length > 0) {
        const latestResult = examResults.sort((a, b) => (b.attemptNumber || 1) - (a.attemptNumber || 1))[0];
        const attemptNumber = latestResult.attemptNumber || 1;

        if (latestResult.percentage >= 60) {
          this.snackBar.open('You have already passed this exam! 🎉', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
        } else if (attemptNumber >= 3) {
          this.snackBar.open('Maximum attempts reached for this exam (3/3) 📝', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-warn']
          });
        } else {
          this.snackBar.open('You need admin permission to retry this exam 📝', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-warn']
          });
        }
      } else {
        this.snackBar.open('You cannot take this exam at this time 📝', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-warn']
        });
      }
      return;
    }

    // Check if exam has questions
    this.loadingExam = true;
    this.questionService.getQuestionsByExam(exam._id).subscribe({
      next: (questions) => {
        if (questions.length === 0) {
          this.snackBar.open('This exam has no questions yet. Please try again later.', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-warn']
          });
          this.loadingExam = false;
          return;
        }

        this.selectedExam = exam;
        this.questions = questions;
        this.answers = {};
        this.loadingExam = false;

        console.log('Starting exam:', exam.title, 'with', questions.length, 'questions');
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.loadingExam = false;
        this.snackBar.open('Error loading exam questions. Please try again.', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-warn']
        });
      }
    });
  }

  onSubmitExam(answers: { [questionId: string]: number }): void {
    if (!this.selectedExam) return;

    const answerArray: Answer[] = this.questions.map((q) => ({
      questionId: q._id,
      selectedAnswer: answers[q._id] || 0
    }));

    this.loadingExam = true;
    console.log('Submitting exam:', {
      examId: this.selectedExam._id,
      answers: answerArray
    });

    this.resultService.submitResult({
      examId: this.selectedExam._id,
      answers: answerArray
    }).subscribe({
      next: (result) => {
        console.log('Exam submitted successfully:', result);
        console.log(`Score: ${result.score}/${result.totalMarks} (${result.percentage}%)`);

        this.result = result;
        this.percentage = result.percentage; // Use the calculated percentage from backend

        // Add to taken exams immediately
        this.takenExamIds.push(this.selectedExam!._id);

        // Add to myResults array
        this.myResults.push(result);

        // Update UI state
        this.categorizeExams();
        this.updateStats();

        // Clear exam state
        this.selectedExam = null;
        this.questions = [];
        this.answers = {};
        this.loadingExam = false;

        // Show success message with score details
        this.snackBar.open(`Exam submitted successfully! 🎉 Score: ${result.score}/${result.totalMarks} (${result.percentage}%)`, 'Close', {
          duration: 5000,
          panelClass: ['snackbar-success']
        });

        // Reload results to ensure data consistency
        this.loadMyResults();
      },
      error: (error) => {
        console.error('Error submitting exam:', error);
        this.loadingExam = false;

        let errorMessage = 'Error submitting exam';
        if (error.error && error.error.msg) {
          errorMessage = error.error.msg;
        } else if (error.status === 401) {
          errorMessage = 'Authentication required. Please login again.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid exam data. Please try again.';
        }

        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['snackbar-warn']
        });
      }
    });
  }


  onBackFromResult(): void {
    this.result = null;
    this.percentage = null;
  }

  onCancelExam(): void {
    this.selectedExam = null;
    this.questions = [];
    this.answers = {};
  }

  // Enhanced functionality methods
  categorizeExams(): void {
    this.availableExams = this.exams.filter(exam => !this.takenExamIds.includes(exam._id));
    this.completedExams = this.exams.filter(exam => this.takenExamIds.includes(exam._id));
  }

  updateStats(): void {
    this.stats = {
      totalExams: this.exams.length,
      completedExams: this.myResults.length,
      averageScore: this.calculateAverageScore(),
      bestScore: this.calculateBestScore(),
      totalTimeSpent: this.calculateTotalTimeSpent(),
      completionRate: this.exams.length > 0 ? Math.round((this.myResults.length / this.exams.length) * 100) : 0
    };
  }

  calculateAverageScore(): number {
    if (this.myResults.length === 0) return 0;
    const validResults = this.myResults.filter(result => result.percentage !== undefined && !isNaN(result.percentage));
    if (validResults.length === 0) return 0;
    const totalPercentage = validResults.reduce((sum, result) => sum + (result.percentage || 0), 0);
    return Math.round((totalPercentage / validResults.length) * 100) / 100;
  }

  calculateBestScore(): number {
    if (this.myResults.length === 0) return 0;
    const validResults = this.myResults.filter(result => result.percentage !== undefined && !isNaN(result.percentage));
    if (validResults.length === 0) return 0;
    return Math.max(...validResults.map(result => result.percentage || 0));
  }

  calculateTotalTimeSpent(): number {
    // Calculate based on exam durations - in real app, track actual time spent
    return this.myResults.reduce((total, result) => {
      const examId = typeof result.examId === 'string' ? result.examId : result.examId._id;
      const exam = this.exams.find(e => e._id === examId);
      return total + (exam ? exam.duration : 0);
    }, 0);
  }

  // Navigation methods
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getSelectedTabIndex(): number {
    switch (this.activeTab) {
      case 'dashboard': return 0;
      case 'exams': return 1;
      case 'results': return 2;
      case 'profile': return 3;
      default: return 0;
    }
  }

  onTabChange(event: any): void {
    const tabs = ['dashboard', 'exams', 'results', 'profile'];
    this.setActiveTab(tabs[event.index]);
  }

  // Search functionality
  onSearchChange(): void {
    if (!this.searchTerm.trim()) {
      this.filteredExams = this.exams;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredExams = this.exams.filter(exam =>
      exam.title.toLowerCase().includes(searchLower) ||
      exam.description.toLowerCase().includes(searchLower)
    );
  }

  // Utility methods

  getExamStatusIcon(exam: Exam): string {
    if (this.takenExamIds.includes(exam._id)) {
      return 'check_circle';
    }
    return 'play_circle_outline';
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  }

  getGradeFromScore(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  // Notification methods
  markNotificationAsRead(notificationId: number): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  clearAllNotifications(): void {
    this.notifications = [];
  }

  getUnreadNotificationCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // User management
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.snackBar.open('Logged out successfully', 'Close', {
      duration: 2000,
      panelClass: ['snackbar-success']
    });
  }

  // Helper methods
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  }

  getResultForExam(examId: string): Result | null {
    return this.myResults.find(result => {
      if (typeof result.examId === 'string') {
        return result.examId === examId;
      } else {
        return result.examId._id === examId;
      }
    }) || null;
  }
}
