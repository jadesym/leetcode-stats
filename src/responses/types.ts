export type Submission = {
  id: number;
  language: string;
  timestamp: number;
  status: string;
  questionId: string;
}

export type SubmissionArray = Array<Submission>;
