/**
 * Queue Names
 */
export const QUEUE_NAMES = {
  NOTIFICATION: 'notification-queue',
  CLEANUP: 'cleanup-queue',
  EMAIL: 'email-queue',
} as const;

/**
 * Job Names
 */
export const JOB_NAMES = {
  SEND_TODO_REMINDER: 'send-todo-reminder',
  CLEANUP_COMPLETED_TODOS: 'cleanup-completed-todos',
  SEND_EMAIL: 'send-email',
} as const;

/**
 * Job Priorities
 */
export const JOB_PRIORITIES = {
  HIGH: 1,
  MEDIUM: 5,
  LOW: 10,
} as const;

/**
 * Job Data Interfaces
 */
export interface TodoReminderJobData {
  todoId: string;
  userId: string;
  title: string;
  dueDate: Date;
  userEmail: string;
  userName: string;
}

export interface CleanupJobData {
  olderThanDays: number;
}

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}
