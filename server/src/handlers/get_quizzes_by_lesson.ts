
import { db } from '../db';
import { quizzesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Quiz } from '../schema';

export const getQuizzesByLesson = async (lessonId: number): Promise<Quiz[]> => {
  try {
    const results = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.lesson_id, lessonId))
      .execute();

    return results;
  } catch (error) {
    console.error('Getting quizzes by lesson failed:', error);
    throw error;
  }
};
