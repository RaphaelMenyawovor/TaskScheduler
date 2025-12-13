import { z } from 'zod';

const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const createTaskSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  message: z.string().min(1, { message: 'Message is required' }),
  completed: z.boolean().optional(),
  priority: priorityEnum.default('MEDIUM'),
  dueDate: z.date().optional(),
  frequency: z.string().optional(),
  cronExpression: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
