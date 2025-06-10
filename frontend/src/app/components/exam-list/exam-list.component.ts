import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Exam } from '../../models/exam.model';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './exam-list.component.html',
  styleUrl: './exam-list.component.css'
})
export class ExamListComponent {
  @Input() exams: Exam[] = [];
  @Input() takenExamIds: string[] = [];
  @Input() loading: boolean = false;
  @Output() takeExam = new EventEmitter<Exam>();

  canTakeExam(exam: Exam): boolean {
    return !this.takenExamIds.includes(exam._id);
  }

  onTakeExam(exam: Exam) {
    this.takeExam.emit(exam);
  }
}
