import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamTakingComponent } from './exam-taking.component';

describe('ExamTakingComponent', () => {
  let component: ExamTakingComponent;
  let fixture: ComponentFixture<ExamTakingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamTakingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamTakingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
