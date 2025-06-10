export interface Answer {
  questionId: string;
  selectedAnswer: number;
  isCorrect?: boolean;
  marksAwarded?: number;
  question?: {
    text: string;
    options: string[];
    correctAnswer: number;
    marks: number;
  };
}

export interface Result {
  _id: string;
  studentId: { _id: string; username: string; email: string };
  examId: { _id: string; title: string; duration: number };
  answers: Answer[];
  score: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  attemptNumber: number;
  submittedAt: Date;
  __v: number;
}

export interface ResultFilter {
  dateFrom?: Date;
  dateTo?: Date;
  examId?: string;
  studentRole?: string;
  status?: string;
}

export interface ResultAnalytics {
  averageScore: number;
  completionRate: number;
  totalSubmissions: number;
  topPerformers: Array<{
    studentName: string;
    score: number;
    percentage: number;
  }>;
}