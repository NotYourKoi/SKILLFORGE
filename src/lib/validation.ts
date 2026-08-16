import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers and underscores"),
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Enter your username or email"),
  password: z.string().min(1, "Enter your password"),
});

export const addGoalSchema = z.object({
  courseId: z.string().min(1, "Choose a course"),
  note: z
    .string()
    .max(80, "Goal label must be at most 80 characters")
    .optional()
    .default(""),
});

export const goalTextSchema = z.object({
  goalId: z.string().min(1, "Goal is required"),
  text: z
    .string()
    .min(1, "Goal label cannot be empty")
    .max(80, "Goal label must be at most 80 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
