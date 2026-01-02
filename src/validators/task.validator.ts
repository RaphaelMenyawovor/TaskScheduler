import { z } from 'zod';

const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const statusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);

const frequencySchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((val) => val === 'hourly' || val === 'daily' || val === 'weekly' || val === 'monthly', {
    message: 'Invalid frequency. Use hourly, daily, weekly, or monthly.',
  });

export const createTaskSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  message: z.string().min(1, { message: 'Message is required' }),
  completed: z.boolean().optional(),
  priority: priorityEnum.default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  frequency: frequencySchema.optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const listTasksSchema = z.object({
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  completed: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
});

export type ListTasksQuery = z.infer<typeof listTasksSchema>;

export const taskIdParamSchema = z.object({
  id: z
    .string()
    .transform((val) => Number.parseInt(val, 10))
    .refine((val) => Number.isInteger(val) && val > 0, { message: 'Invalid task id' }),
});

export type TaskIdParam = z.infer<typeof taskIdParamSchema>;

export const updateTaskSchema = z
  .object({
    title: z.string().min(1, { message: 'Title cannot be empty' }).optional(),
    message: z.string().min(1, { message: 'Message cannot be empty' }).optional(),
    priority: priorityEnum.optional(),
    status: statusEnum.optional(),
    completed: z.boolean().optional(),
    dueDate: z.string().datetime().nullable().optional(),
    frequency: frequencySchema.nullable().optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.message !== undefined ||
      data.priority !== undefined ||
      data.status !== undefined ||
      data.completed !== undefined ||
      data.dueDate !== undefined ||
      data.frequency !== undefined,
    { message: 'At least one field must be provided' }
  );

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
