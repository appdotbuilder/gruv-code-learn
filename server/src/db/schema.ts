
import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['student', 'admin']);
export const difficultyEnum = pgEnum('difficulty', ['beginner', 'intermediate', 'advanced']);
export const progressStatusEnum = pgEnum('progress_status', ['started', 'completed']);
export const submissionStatusEnum = pgEnum('submission_status', ['pending', 'passed', 'failed']);
export const badgeRequirementEnum = pgEnum('badge_requirement_type', ['points', 'courses_completed', 'exercises_completed']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('student'),
  total_points: integer('total_points').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Courses table
export const coursesTable = pgTable('courses', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  language: text('language').notNull(),
  difficulty: difficultyEnum('difficulty').notNull(),
  created_by: integer('created_by').notNull().references(() => usersTable.id),
  is_published: boolean('is_published').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Lessons table
export const lessonsTable = pgTable('lessons', {
  id: serial('id').primaryKey(),
  course_id: integer('course_id').notNull().references(() => coursesTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  order_index: integer('order_index').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Exercises table
export const exercisesTable = pgTable('exercises', {
  id: serial('id').primaryKey(),
  lesson_id: integer('lesson_id').notNull().references(() => lessonsTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  starter_code: text('starter_code').notNull(),
  solution_code: text('solution_code').notNull(),
  test_cases: text('test_cases').notNull(), // JSON string
  points_reward: integer('points_reward').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Quizzes table
export const quizzesTable = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  lesson_id: integer('lesson_id').notNull().references(() => lessonsTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  points_reward: integer('points_reward').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Quiz questions table
export const quizQuestionsTable = pgTable('quiz_questions', {
  id: serial('id').primaryKey(),
  quiz_id: integer('quiz_id').notNull().references(() => quizzesTable.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  options: text('options').notNull(), // JSON string
  correct_answer: text('correct_answer').notNull(),
  explanation: text('explanation'),
  order_index: integer('order_index').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// User progress table
export const userProgressTable = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  course_id: integer('course_id').notNull().references(() => coursesTable.id, { onDelete: 'cascade' }),
  lesson_id: integer('lesson_id').references(() => lessonsTable.id, { onDelete: 'cascade' }),
  exercise_id: integer('exercise_id').references(() => exercisesTable.id, { onDelete: 'cascade' }),
  quiz_id: integer('quiz_id').references(() => quizzesTable.id, { onDelete: 'cascade' }),
  status: progressStatusEnum('status').notNull(),
  points_earned: integer('points_earned').notNull().default(0),
  completed_at: timestamp('completed_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Badges table
export const badgesTable = pgTable('badges', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  requirement_type: badgeRequirementEnum('requirement_type').notNull(),
  requirement_value: integer('requirement_value').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// User badges table
export const userBadgesTable = pgTable('user_badges', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  badge_id: integer('badge_id').notNull().references(() => badgesTable.id, { onDelete: 'cascade' }),
  earned_at: timestamp('earned_at').defaultNow().notNull(),
});

// Code submissions table
export const codeSubmissionsTable = pgTable('code_submissions', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  exercise_id: integer('exercise_id').notNull().references(() => exercisesTable.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  status: submissionStatusEnum('status').notNull().default('pending'),
  test_results: text('test_results'), // JSON string
  submitted_at: timestamp('submitted_at').defaultNow().notNull(),
});

// Quiz attempts table
export const quizAttemptsTable = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  quiz_id: integer('quiz_id').notNull().references(() => quizzesTable.id, { onDelete: 'cascade' }),
  answers: text('answers').notNull(), // JSON string
  score: integer('score').notNull(),
  total_questions: integer('total_questions').notNull(),
  completed_at: timestamp('completed_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  courses: many(coursesTable),
  progress: many(userProgressTable),
  badges: many(userBadgesTable),
  submissions: many(codeSubmissionsTable),
  quizAttempts: many(quizAttemptsTable),
}));

export const coursesRelations = relations(coursesTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [coursesTable.created_by],
    references: [usersTable.id],
  }),
  lessons: many(lessonsTable),
  progress: many(userProgressTable),
}));

export const lessonsRelations = relations(lessonsTable, ({ one, many }) => ({
  course: one(coursesTable, {
    fields: [lessonsTable.course_id],
    references: [coursesTable.id],
  }),
  exercises: many(exercisesTable),
  quizzes: many(quizzesTable),
  progress: many(userProgressTable),
}));

export const exercisesRelations = relations(exercisesTable, ({ one, many }) => ({
  lesson: one(lessonsTable, {
    fields: [exercisesTable.lesson_id],
    references: [lessonsTable.id],
  }),
  submissions: many(codeSubmissionsTable),
  progress: many(userProgressTable),
}));

export const quizzesRelations = relations(quizzesTable, ({ one, many }) => ({
  lesson: one(lessonsTable, {
    fields: [quizzesTable.lesson_id],
    references: [lessonsTable.id],
  }),
  questions: many(quizQuestionsTable),
  attempts: many(quizAttemptsTable),
  progress: many(userProgressTable),
}));

export const quizQuestionsRelations = relations(quizQuestionsTable, ({ one }) => ({
  quiz: one(quizzesTable, {
    fields: [quizQuestionsTable.quiz_id],
    references: [quizzesTable.id],
  }),
}));

export const userProgressRelations = relations(userProgressTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userProgressTable.user_id],
    references: [usersTable.id],
  }),
  course: one(coursesTable, {
    fields: [userProgressTable.course_id],
    references: [coursesTable.id],
  }),
  lesson: one(lessonsTable, {
    fields: [userProgressTable.lesson_id],
    references: [lessonsTable.id],
  }),
  exercise: one(exercisesTable, {
    fields: [userProgressTable.exercise_id],
    references: [exercisesTable.id],
  }),
  quiz: one(quizzesTable, {
    fields: [userProgressTable.quiz_id],
    references: [quizzesTable.id],
  }),
}));

export const badgesRelations = relations(badgesTable, ({ many }) => ({
  userBadges: many(userBadgesTable),
}));

export const userBadgesRelations = relations(userBadgesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userBadgesTable.user_id],
    references: [usersTable.id],
  }),
  badge: one(badgesTable, {
    fields: [userBadgesTable.badge_id],
    references: [badgesTable.id],
  }),
}));

export const codeSubmissionsRelations = relations(codeSubmissionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [codeSubmissionsTable.user_id],
    references: [usersTable.id],
  }),
  exercise: one(exercisesTable, {
    fields: [codeSubmissionsTable.exercise_id],
    references: [exercisesTable.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttemptsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [quizAttemptsTable.user_id],
    references: [usersTable.id],
  }),
  quiz: one(quizzesTable, {
    fields: [quizAttemptsTable.quiz_id],
    references: [quizzesTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  courses: coursesTable,
  lessons: lessonsTable,
  exercises: exercisesTable,
  quizzes: quizzesTable,
  quizQuestions: quizQuestionsTable,
  userProgress: userProgressTable,
  badges: badgesTable,
  userBadges: userBadgesTable,
  codeSubmissions: codeSubmissionsTable,
  quizAttempts: quizAttemptsTable,
};
