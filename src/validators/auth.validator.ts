import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  name: z.string().min(2, {message: "Name must be at least two characters"}).optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});