export interface EmailAnalysisResult {
  isTask: boolean;
  title: string | null;
  description: string | null;
  dueDate: string | null;
  assigneeEmail: string | null;
}
