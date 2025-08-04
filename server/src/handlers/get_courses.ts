
import { db } from '../db';
import { coursesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Course } from '../schema';

export const getCourses = async (): Promise<Course[]> => {
  try {
    const results = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.is_published, true))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    throw error;
  }
};
