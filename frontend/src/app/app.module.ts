import { NgModule } from '@angular/core';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ExamListComponent } from './components/exam-list/exam-list.component';
import { ExamTakingComponent } from './components/exam-taking/exam-taking.component';
import { ResultViewComponent } from './components/result-view/result-view.component';
import { ExamManageComponent } from './components/exam-manage/exam-manage.component';
import { QuestionManageComponent } from './components/question-manage/question-manage.component';
import { ResultManageComponent } from './components/result-manage/result-manage.component';
import { StudentDashboardComponent } from './pages/student-dashboard/student-dashboard.component';
import { routes } from './app-routing.module';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatListModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    FlexLayoutModule,
    FormsModule
  ],
  providers: [
    provideRouter(routes)
  ],
  // Remove bootstrap for standalone AppComponent
})
export class AppModule { }

// For standalone bootstrap (optional, if you prefer standalone app)
export function bootstrap() {
  return bootstrapApplication(AppComponent, {
    providers: [
      provideRouter(routes),
      { provide: HttpClientModule, useValue: HttpClientModule },
      { provide: BrowserAnimationsModule, useValue: BrowserAnimationsModule },
      { provide: MatToolbarModule, useValue: MatToolbarModule },
      { provide: MatCardModule, useValue: MatCardModule },
      { provide: MatFormFieldModule, useValue: MatFormFieldModule },
      { provide: MatInputModule, useValue: MatInputModule },
      { provide: MatButtonModule, useValue: MatButtonModule },
      { provide: MatListModule, useValue: MatListModule },
      { provide: MatSelectModule, useValue: MatSelectModule },
      { provide: MatTableModule, useValue: MatTableModule },
      { provide: MatIconModule, useValue: MatIconModule },
      { provide: FlexLayoutModule, useValue: FlexLayoutModule },
      { provide: FormsModule, useValue: FormsModule }
    ]
  });
}