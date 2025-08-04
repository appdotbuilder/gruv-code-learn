
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  loginInputSchema,
  createCourseInputSchema,
  updateCourseInputSchema,
  createLessonInputSchema,
  updateLessonInputSchema,
  createExerciseInputSchema,
  updateExerciseInputSchema,
  submitCodeInputSchema,
  createQuizInputSchema,
  createQuizQuestionInputSchema,
  submitQuizInputSchema,
  createUserProgressInputSchema,
  createBadgeInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { getUsers } from './handlers/get_users';
import { createCourse } from './handlers/create_course';
import { getCourses } from './handlers/get_courses';
import { getCourseById } from './handlers/get_course_by_id';
import { updateCourse } from './handlers/update_course';
import { deleteCourse } from './handlers/delete_course';
import { createLesson } from './handlers/create_lesson';
import { getLessonsByCourse } from './handlers/get_lessons_by_course';
import { updateLesson } from './handlers/update_lesson';
import { deleteLesson } from './handlers/delete_lesson';
import { createExercise } from './handlers/create_exercise';
import { getExercisesByLesson } from './handlers/get_exercises_by_lesson';
import { updateExercise } from './handlers/update_exercise';
import { deleteExercise } from './handlers/delete_exercise';
import { submitCode } from './handlers/submit_code';
import { getUserSubmissions } from './handlers/get_user_submissions';
import { createQuiz } from './handlers/create_quiz';
import { getQuizzesByLesson } from './handlers/get_quizzes_by_lesson';
import { createQuizQuestion } from './handlers/create_quiz_question';
import { getQuizQuestions } from './handlers/get_quiz_questions';
import { submitQuiz } from './handlers/submit_quiz';
import { getUserProgress } from './handlers/get_user_progress';
import { updateUserProgress } from './handlers/update_user_progress';
import { createBadge } from './handlers/create_badge';
import { getBadges } from './handlers/get_badges';
import { getUserBadges } from './handlers/get_user_badges';
import { checkAndAwardBadges } from './handlers/check_and_award_badges';
import { getLeaderboard } from './handlers/get_leaderboard';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),

  // Course management
  createCourse: publicProcedure
    .input(createCourseInputSchema.extend({ userId: z.number() }))
    .mutation(({ input }) => createCourse(input, input.userId)),
  
  getCourses: publicProcedure
    .query(() => getCourses()),
  
  getCourseById: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .query(({ input }) => getCourseById(input.courseId)),
  
  updateCourse: publicProcedure
    .input(updateCourseInputSchema)
    .mutation(({ input }) => updateCourse(input)),
  
  deleteCourse: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(({ input }) => deleteCourse(input.courseId)),

  // Lesson management
  createLesson: publicProcedure
    .input(createLessonInputSchema)
    .mutation(({ input }) => createLesson(input)),
  
  getLessonsByCourse: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .query(({ input }) => getLessonsByCourse(input.courseId)),
  
  updateLesson: publicProcedure
    .input(updateLessonInputSchema)
    .mutation(({ input }) => updateLesson(input)),
  
  deleteLesson: publicProcedure
    .input(z.object({ lessonId: z.number() }))
    .mutation(({ input }) => deleteLesson(input.lessonId)),

  // Exercise management
  createExercise: publicProcedure
    .input(createExerciseInputSchema)
    .mutation(({ input }) => createExercise(input)),
  
  getExercisesByLesson: publicProcedure
    .input(z.object({ lessonId: z.number() }))
    .query(({ input }) => getExercisesByLesson(input.lessonId)),
  
  updateExercise: publicProcedure
    .input(updateExerciseInputSchema)
    .mutation(({ input }) => updateExercise(input)),
  
  deleteExercise: publicProcedure
    .input(z.object({ exerciseId: z.number() }))
    .mutation(({ input }) => deleteExercise(input.exerciseId)),

  // Code submissions
  submitCode: publicProcedure
    .input(submitCodeInputSchema)
    .mutation(({ input }) => submitCode(input)),
  
  getUserSubmissions: publicProcedure
    .input(z.object({ userId: z.number(), exerciseId: z.number().optional() }))
    .query(({ input }) => getUserSubmissions(input.userId, input.exerciseId)),

  // Quiz management
  createQuiz: publicProcedure
    .input(createQuizInputSchema)
    .mutation(({ input }) => createQuiz(input)),
  
  getQuizzesByLesson: publicProcedure
    .input(z.object({ lessonId: z.number() }))
    .query(({ input }) => getQuizzesByLesson(input.lessonId)),
  
  createQuizQuestion: publicProcedure
    .input(createQuizQuestionInputSchema)
    .mutation(({ input }) => createQuizQuestion(input)),
  
  getQuizQuestions: publicProcedure
    .input(z.object({ quizId: z.number() }))
    .query(({ input }) => getQuizQuestions(input.quizId)),
  
  submitQuiz: publicProcedure
    .input(submitQuizInputSchema)
    .mutation(({ input }) => submitQuiz(input)),

  // Progress tracking
  getUserProgress: publicProcedure
    .input(z.object({ userId: z.number(), courseId: z.number().optional() }))
    .query(({ input }) => getUserProgress(input.userId, input.courseId)),
  
  updateUserProgress: publicProcedure
    .input(createUserProgressInputSchema)
    .mutation(({ input }) => updateUserProgress(input)),

  // Gamification - Badges
  createBadge: publicProcedure
    .input(createBadgeInputSchema)
    .mutation(({ input }) => createBadge(input)),
  
  getBadges: publicProcedure
    .query(() => getBadges()),
  
  getUserBadges: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserBadges(input.userId)),
  
  checkAndAwardBadges: publicProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(({ input }) => checkAndAwardBadges(input.userId)),

  // Leaderboard
  getLeaderboard: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(({ input }) => getLeaderboard(input.limit)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
