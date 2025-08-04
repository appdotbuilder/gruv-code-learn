
import { db } from '../db';
import { exercisesTable } from '../db/schema';
import { type Exercise } from '../schema';
import { eq } from 'drizzle-orm';

export const getExercisesByLesson = async (lessonId: number): Promise<Exercise[]> => {
  try {
    const results = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.lesson_id, lessonId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch exercises by lesson:', error);
    throw error;
  }
};
