import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { QuestionService } from '../../services/question.service';
import { Question } from '../../models/question.model';

@Component({
  selector: 'app-question-manage',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatIconModule, MatProgressSpinnerModule, FormsModule],
  templateUrl: './question-manage.component.html',
  styleUrl: './question-manage.component.css'
})
export class QuestionManageComponent implements OnInit {
  questions: Question[] = [];
  newQuestion: Partial<Question> = { text: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1, examId: '' };
  editingQuestion: Question | null = null;
  loading = false;

  constructor(
    private questionService: QuestionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Optionally, load questions for a default exam or expose a method to set examId
  }

  loadQuestions(examId: string) {
    if (!examId) return;

    this.loading = true;
    this.questionService.getQuestionsByExam(examId).subscribe({
      next: (data) => {
        this.questions = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Error loading questions', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-warn']
        });
      }
    });
  }

  createQuestion() {
    if (!this.newQuestion.text || !this.newQuestion.options?.every(opt => opt) || this.newQuestion.marks! <= 0 || !this.newQuestion.examId) {
      this.snackBar.open('Please fill all required fields', 'Close', {
        duration: 3000,
        panelClass: ['snackbar-warn']
      });
      return;
    }

    this.questionService.createQuestion({
      examId: this.newQuestion.examId!,
      text: this.newQuestion.text!,
      options: this.newQuestion.options!,
      correctAnswer: this.newQuestion.correctAnswer!,
      marks: this.newQuestion.marks!
    }).subscribe({
      next: () => {
        this.loadQuestions(this.newQuestion.examId!);
        this.newQuestion = { text: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1, examId: this.newQuestion.examId };
        this.snackBar.open('Question created successfully', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      },
      error: () => {
        this.snackBar.open('Error creating question', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-warn']
        });
      }
    });
  }

  startEdit(question: Question) {
    this.editingQuestion = { ...question };
  }

  updateQuestion() {
    if (!this.editingQuestion) return;

    this.questionService.updateQuestion(this.editingQuestion._id, this.editingQuestion).subscribe({
      next: () => {
        this.loadQuestions(this.editingQuestion!.examId);
        this.editingQuestion = null;
        this.snackBar.open('Question updated successfully', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      },
      error: () => {
        this.snackBar.open('Error updating question', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-warn']
        });
      }
    });
  }

  deleteQuestion(id: string) {
    if (!this.newQuestion.examId) return;

    if (confirm('Are you sure you want to delete this question?')) {
      this.questionService.deleteQuestion(id).subscribe({
        next: () => {
          this.loadQuestions(this.newQuestion.examId!);
          this.snackBar.open('Question deleted successfully', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
        },
        error: () => {
          this.snackBar.open('Error deleting question', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-warn']
          });
        }
      });
    }
  }

  cancelEdit() {
    this.editingQuestion = null;
  }
}
