import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ResultService } from '../../services/result.service';
import { Result } from '../../models/result.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-result-manage',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatInputModule, MatIconModule, FormsModule,MatProgressSpinnerModule,MatFormFieldModule],
  templateUrl: './result-manage.component.html',
  styleUrl: './result-manage.component.css'
})
export class ResultManageComponent implements OnInit {
  results: Result[] = [];
  filteredResults: Result[] = [];
  searchTerm = '';
  loading = false;

  constructor(private resultService: ResultService) {}

  ngOnInit() {
    this.loadResults();
  }

  loadResults() {
    this.loading = true;
    this.resultService.getAllResults().subscribe({
      next: (data) => {
        this.results = data;
        this.filterResults();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  filterResults() {
    const term = this.searchTerm.toLowerCase();
    this.filteredResults = this.results.filter(r =>
      r.studentId.username.toLowerCase().includes(term) ||
      r.examId.title.toLowerCase().includes(term)
    );
  }

  exportCSV() {
    const header = 'Student,Exam,Score,Submitted At\n';
    const rows = this.filteredResults.map(r =>
      `${r.studentId.username},${r.examId.title},${r.score},${new Date(r.submittedAt).toLocaleString()}`
    ).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'results.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
