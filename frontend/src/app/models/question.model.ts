export interface Question {
  _id: string;
  examId: string;
  text: string;
  options: string[];
  correctAnswer: number;
  marks: number;
  order?: number;
  __v: number;
}

export interface QuestionCreateRequest {
  examId: string;
  text: string;
  options: string[];
  correctAnswer: number;
  marks: number;
  order?: number;
}

export interface QuestionUpdateRequest extends QuestionCreateRequest {
  _id: string;
}

export interface QuestionImport {
  text: string;
  options: string[];
  correctAnswer: number;
  marks: number;
}