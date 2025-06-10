export interface Exam {
  _id: string;
  title: string;
  description: string;
  duration: number;
  createdBy: string;
  questions: string[];
  createdAt: Date;
  isPublished?: boolean;
  __v: number;
}

export interface ExamCreateRequest {
  title: string;
  description: string;
  duration: number;
  isPublished?: boolean;
}

export interface ExamUpdateRequest extends ExamCreateRequest {
  _id: string;
}