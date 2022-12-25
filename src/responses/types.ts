export const GET_SUBMISSIONS_RESPONSE_TYPE = "getSubmissionsResponse";

export type Submission = {
  id: number;
  language: string;
  timestampInSeconds: number;
  status: string;
  questionId: string;
}

export type SubmissionArray = Array<Submission>;
