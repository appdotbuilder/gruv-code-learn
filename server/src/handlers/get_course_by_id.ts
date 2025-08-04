
import { db } from '../db';
import { coursesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Course } from '../schema';

export const getCourseById = async (courseId: number): Promise<Course | null> => {
  try {
    const results = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, courseId))
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Failed to get course by ID:', error);
    throw error;
  }
};
