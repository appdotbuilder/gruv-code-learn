
import { db } from '../db';
import { quizzesTable, lessonsTable } from '../db/schema';
import { type CreateQuizInput, type Quiz } from '../schema';
import { eq } from 'drizzle-orm';

export const createQuiz = async (input: CreateQuizInput): Promise<Quiz> => {
  try {
    // Verify lesson exists
    const lesson = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, input.lesson_id))
      .execute();

    if (lesson.length === 0) {
      throw new Error('Lesson not found');
    }

    // Insert quiz record
    const result = await db.insert(quizzesTable)
      .values({
        lesson_id: input.lesson_id,
        title: input.title,
        description: input.description,
        points_reward: input.points_reward
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Quiz creation failed:', error);
    throw error;
  }
};
