import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ExamService } from '../../services/exam.service';
import { Exam } from '../../models/exam.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-exam-manage',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatIconModule, FormsModule,MatProgressSpinnerModule],
  templateUrl: './exam-manage.component.html',
  styleUrl: './exam-manage.component.css'
})
export class ExamManageComponent implements OnInit {
  exams: Exam[] = [];
  newExam: Partial<Exam> = { title: '', description: '', duration: 60 };
  editingExam: Exam | null = null;
  loading = false;

  constructor(private examService: ExamService) {}

  ngOnInit() {
    this.loadExams();
  }

  loadExams() {
    this.loading = true;
    this.examService.getExams().subscribe({
      next: (data) => { this.exams = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  createExam() {
    if (!this.newExam.title || !this.newExam.description || !this.newExam.duration) return;
    this.examService.createExam({
      title: this.newExam.title!,
      description: this.newExam.description!,
      duration: this.newExam.duration!
    }).subscribe(() => {
      this.loadExams();
      this.newExam = { title: '', description: '', duration: 60 };
    });
  }

  startEdit(exam: Exam) {
    this.editingExam = { ...exam };
  }

  updateExam() {
    if (!this.editingExam) return;
    this.examService.updateExam(this.editingExam._id, this.editingExam).subscribe(() => {
      this.loadExams();
      this.editingExam = null;
    });
  }

  deleteExam(id: string) {
    this.examService.deleteExam(id).subscribe(() => this.loadExams());
  }

  cancelEdit() {
    this.editingExam = null;
  }
}
