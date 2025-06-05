import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultManageComponent } from './result-manage.component';

describe('ResultManageComponent', () => {
  let component: ResultManageComponent;
  let fixture: ComponentFixture<ResultManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultManageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
