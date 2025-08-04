
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  role: z.enum(['student', 'admin']),
  total_points: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Create user input schema
export const createUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['student', 'admin']).default('student')
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Login input schema
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Course schema
export const courseSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  language: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  created_by: z.number(),
  is_published: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Course = z.infer<typeof courseSchema>;

// Create course input schema
export const createCourseInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string(),
  language: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  is_published: z.boolean().default(false)
});

export type CreateCourseInput = z.infer<typeof createCourseInputSchema>;

// Update course input schema
export const updateCourseInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  language: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  is_published: z.boolean().optional()
});

export type UpdateCourseInput = z.infer<typeof updateCourseInputSchema>;

// Lesson schema
export const lessonSchema = z.object({
  id: z.number(),
  course_id: z.number(),
  title: z.string(),
  content: z.string(),
  order_index: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Lesson = z.infer<typeof lessonSchema>;

// Create lesson input schema
export const createLessonInputSchema = z.object({
  course_id: z.number(),
  title: z.string().min(1).max(200),
  content: z.string(),
  order_index: z.number().int().nonnegative()
});

export type CreateLessonInput = z.infer<typeof createLessonInputSchema>;

// Update lesson input schema
export const updateLessonInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  order_index: z.number().int().nonnegative().optional()
});

export type UpdateLessonInput = z.infer<typeof updateLessonInputSchema>;

// Exercise schema
export const exerciseSchema = z.object({
  id: z.number(),
  lesson_id: z.number(),
  title: z.string(),
  description: z.string(),
  starter_code: z.string(),
  solution_code: z.string(),
  test_cases: z.string(), // JSON string of test cases
  points_reward: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Exercise = z.infer<typeof exerciseSchema>;

// Create exercise input schema
export const createExerciseInputSchema = z.object({
  lesson_id: z.number(),
  title: z.string().min(1).max(200),
  description: z.string(),
  starter_code: z.string(),
  solution_code: z.string(),
  test_cases: z.string(),
  points_reward: z.number().int().positive()
});

export type CreateExerciseInput = z.infer<typeof createExerciseInputSchema>;

// Update exercise input schema
export const updateExerciseInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  starter_code: z.string().optional(),
  solution_code: z.string().optional(),
  test_cases: z.string().optional(),
  points_reward: z.number().int().positive().optional()
});

export type UpdateExerciseInput = z.infer<typeof updateExerciseInputSchema>;

// Quiz schema
export const quizSchema = z.object({
  id: z.number(),
  lesson_id: z.number(),
  title: z.string(),
  description: z.string(),
  points_reward: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Quiz = z.infer<typeof quizSchema>;

// Create quiz input schema
export const createQuizInputSchema = z.object({
  lesson_id: z.number(),
  title: z.string().min(1).max(200),
  description: z.string(),
  points_reward: z.number().int().positive()
});

export type CreateQuizInput = z.infer<typeof createQuizInputSchema>;

// Quiz question schema
export const quizQuestionSchema = z.object({
  id: z.number(),
  quiz_id: z.number(),
  question: z.string(),
  options: z.string(), // JSON string of options array
  correct_answer: z.string(),
  explanation: z.string().nullable(),
  order_index: z.number().int(),
  created_at: z.coerce.date()
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

// Create quiz question input schema
export const createQuizQuestionInputSchema = z.object({
  quiz_id: z.number(),
  question: z.string().min(1),
  options: z.string(),
  correct_answer: z.string(),
  explanation: z.string().nullable(),
  order_index: z.number().int().nonnegative()
});

export type CreateQuizQuestionInput = z.infer<typeof createQuizQuestionInputSchema>;

// User progress schema
export const userProgressSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  course_id: z.number(),
  lesson_id: z.number().nullable(),
  exercise_id: z.number().nullable(),
  quiz_id: z.number().nullable(),
  status: z.enum(['started', 'completed']),
  points_earned: z.number().int(),
  completed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type UserProgress = z.infer<typeof userProgressSchema>;

// Create user progress input schema
export const createUserProgressInputSchema = z.object({
  user_id: z.number(),
  course_id: z.number(),
  lesson_id: z.number().nullable(),
  exercise_id: z.number().nullable(),
  quiz_id: z.number().nullable(),
  status: z.enum(['started', 'completed']),
  points_earned: z.number().int().nonnegative()
});

export type CreateUserProgressInput = z.infer<typeof createUserProgressInputSchema>;

// Badge schema
export const badgeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  requirement_type: z.enum(['points', 'courses_completed', 'exercises_completed']),
  requirement_value: z.number().int(),
  created_at: z.coerce.date()
});

export type Badge = z.infer<typeof badgeSchema>;

// Create badge input schema
export const createBadgeInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string(),
  icon: z.string(),
  requirement_type: z.enum(['points', 'courses_completed', 'exercises_completed']),
  requirement_value: z.number().int().positive()
});

export type CreateBadgeInput = z.infer<typeof createBadgeInputSchema>;

// User badge schema
export const userBadgeSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  badge_id: z.number(),
  earned_at: z.coerce.date()
});

export type UserBadge = z.infer<typeof userBadgeSchema>;

// Code submission schema
export const codeSubmissionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  exercise_id: z.number(),
  code: z.string(),
  status: z.enum(['pending', 'passed', 'failed']),
  test_results: z.string().nullable(), // JSON string of test results
  submitted_at: z.coerce.date()
});

export type CodeSubmission = z.infer<typeof codeSubmissionSchema>;

// Submit code input schema
export const submitCodeInputSchema = z.object({
  user_id: z.number(),
  exercise_id: z.number(),
  code: z.string()
});

export type SubmitCodeInput = z.infer<typeof submitCodeInputSchema>;

// Quiz attempt schema
export const quizAttemptSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  quiz_id: z.number(),
  answers: z.string(), // JSON string of user answers
  score: z.number().int(),
  total_questions: z.number().int(),
  completed_at: z.coerce.date()
});

export type QuizAttempt = z.infer<typeof quizAttemptSchema>;

// Submit quiz input schema
export const submitQuizInputSchema = z.object({
  user_id: z.number(),
  quiz_id: z.number(),
  answers: z.string()
});

export type SubmitQuizInput = z.infer<typeof submitQuizInputSchema>;
