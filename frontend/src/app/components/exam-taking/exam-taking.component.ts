import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Question } from '../../models/question.model';
import { Exam } from '../../models/exam.model';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-exam-taking',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatRadioModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule,
    FormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './exam-taking.component.html',
  styleUrl: './exam-taking.component.css'
})
export class ExamTakingComponent implements OnInit, OnDestroy {
  @Input() exam: Exam | null = null;
  @Input() questions: Question[] = [];
  @Input() answers: { [questionId: string]: number } = {};
  @Input() loading: boolean = false;
  @Output() submitExam = new EventEmitter<{ [questionId: string]: number }>();
  @Output() cancelExam = new EventEmitter<void>();

  // Timer properties
  timeRemaining: number = 0; // in seconds
  timeRemainingFormatted: string = '';
  timerSubscription?: Subscription;
  showWarning: boolean = false;

  // Navigation properties
  currentQuestionIndex: number = 0;
  totalQuestions: number = 0;
  progressPercentage: number = 0;

  // Auto-save properties
  autoSaveSubscription?: Subscription;
  lastSaved: Date = new Date();

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.exam && this.questions.length > 0) {
      this.initializeExam();
      this.startTimer();
      this.startAutoSave();
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.stopAutoSave();
  }

  private initializeExam(): void {
    this.totalQuestions = this.questions.length;
    this.timeRemaining = (this.exam?.duration || 60) * 60; // Convert minutes to seconds
    this.updateProgress();
    this.loadSavedAnswers();
  }

  private startTimer(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      this.timeRemaining--;
      this.updateTimeDisplay();

      // Show warning at 5 minutes (300 seconds)
      if (this.timeRemaining === 300 && !this.showWarning) {
        this.showWarning = true;
        this.showTimeWarning();
      }

      // Auto-submit when time expires
      if (this.timeRemaining <= 0) {
        this.autoSubmitExam();
      }
    });
  }

  private stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  private startAutoSave(): void {
    // Auto-save every 30 seconds
    this.autoSaveSubscription = interval(30000).subscribe(() => {
      this.saveAnswersToStorage();
    });
  }

  private stopAutoSave(): void {
    if (this.autoSaveSubscription) {
      this.autoSaveSubscription.unsubscribe();
    }
  }

  private updateTimeDisplay(): void {
    const hours = Math.floor(this.timeRemaining / 3600);
    const minutes = Math.floor((this.timeRemaining % 3600) / 60);
    const seconds = this.timeRemaining % 60;

    if (hours > 0) {
      this.timeRemainingFormatted = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      this.timeRemainingFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  private updateProgress(): void {
    const answeredQuestions = Object.keys(this.answers).length;
    this.progressPercentage = (answeredQuestions / this.totalQuestions) * 100;
  }

  private showTimeWarning(): void {
    this.snackBar.open('⚠️ Only 5 minutes remaining!', 'OK', {
      duration: 5000,
      panelClass: ['snackbar-warn']
    });
  }

  private autoSubmitExam(): void {
    this.snackBar.open('⏰ Time expired! Exam submitted automatically.', 'OK', {
      duration: 3000,
      panelClass: ['snackbar-warn']
    });
    this.onSubmit();
  }

  private saveAnswersToStorage(): void {
    if (this.exam) {
      const examData = {
        examId: this.exam._id,
        answers: this.answers,
        timeRemaining: this.timeRemaining,
        currentQuestion: this.currentQuestionIndex,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(`exam_${this.exam._id}`, JSON.stringify(examData));
      this.lastSaved = new Date();
    }
  }

  private loadSavedAnswers(): void {
    if (this.exam) {
      const savedData = localStorage.getItem(`exam_${this.exam._id}`);
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          this.answers = data.answers || {};
          this.currentQuestionIndex = data.currentQuestion || 0;
          // Don't restore time to prevent cheating
          this.updateProgress();
        } catch (error) {
          console.error('Error loading saved answers:', error);
        }
      }
    }
  }

  // Navigation methods
  goToQuestion(index: number): void {
    if (index >= 0 && index < this.totalQuestions) {
      this.currentQuestionIndex = index;
      this.saveAnswersToStorage();
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.saveAnswersToStorage();
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.totalQuestions - 1) {
      this.currentQuestionIndex++;
      this.saveAnswersToStorage();
    }
  }

  // Answer handling
  selectAnswer(questionId: string, answerIndex: number): void {
    this.answers[questionId] = answerIndex;
    this.updateProgress();
    this.saveAnswersToStorage();
  }

  isQuestionAnswered(questionId: string): boolean {
    return this.answers[questionId] !== undefined;
  }

  getCurrentQuestion(): Question | null {
    return this.questions[this.currentQuestionIndex] || null;
  }

  // Submission methods
  onSubmit(): void {
    this.stopTimer();
    this.stopAutoSave();

    // Clear saved data
    if (this.exam) {
      localStorage.removeItem(`exam_${this.exam._id}`);
    }

    this.submitExam.emit(this.answers);
  }

  onCancel(): void {
    this.stopTimer();
    this.stopAutoSave();
    this.cancelExam.emit();
  }

  // Utility methods
  getTimeRemainingClass(): string {
    if (this.timeRemaining <= 300) { // 5 minutes
      return 'time-critical';
    } else if (this.timeRemaining <= 600) { // 10 minutes
      return 'time-warning';
    }
    return 'time-normal';
  }

  getQuestionStatusClass(questionId: string): string {
    if (this.isQuestionAnswered(questionId)) {
      return 'question-answered';
    }
    return 'question-unanswered';
  }

  getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
