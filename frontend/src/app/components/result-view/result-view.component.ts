import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Result } from '../../models/result.model';

@Component({
  selector: 'app-result-view',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './result-view.component.html',
  styleUrl: './result-view.component.css'
})
export class ResultViewComponent {
  @Input() result: Result | null = null;
  @Input() percentage: number | null = null;
  @Output() back = new EventEmitter<void>();

  onBack() {
    this.back.emit();
  }
}
