
import { db } from '../db';
import { coursesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteCourse(courseId: number): Promise<boolean> {
  try {
    // Delete the course (cascade will handle related data)
    const result = await db.delete(coursesTable)
      .where(eq(coursesTable.id, courseId))
      .returning()
      .execute();

    // Return true if a course was deleted, false if not found
    return result.length > 0;
  } catch (error) {
    console.error('Course deletion failed:', error);
    throw error;
  }
}
