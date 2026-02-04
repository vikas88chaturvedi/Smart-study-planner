export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED'
}

export enum TaskType {
  ASSIGNMENT = 'ASSIGNMENT',
  EXAM = 'EXAM',
  STUDY_SESSION = 'STUDY_SESSION',
  REVIEW = 'REVIEW'
}

export interface Task {
  id: string;
  title: string;
  subject: string;
  dueDate: string; // ISO Date string
  durationMinutes: number;
  status: TaskStatus;
  type: TaskType;
  priority: 'high' | 'medium' | 'low';
  isSpacedRepetition?: boolean;
}

export interface UserStats {
  streak: number;
  xp: number;
  totalFocusMinutes: number;
  level: number;
  badges: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: UserStats) => boolean;
}

export interface SubjectProgress {
  subject: string;
  totalTasks: number;
  completedTasks: number;
  color: string;
}

export const SUBJECT_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
];
