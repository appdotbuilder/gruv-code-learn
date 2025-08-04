
import { db } from '../db';
import { lessonsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteLesson(lessonId: number): Promise<boolean> {
  try {
    // Delete the lesson - cascading deletes will handle related content
    const result = await db.delete(lessonsTable)
      .where(eq(lessonsTable.id, lessonId))
      .returning()
      .execute();

    // Return true if a lesson was deleted, false if not found
    return result.length > 0;
  } catch (error) {
    console.error('Lesson deletion failed:', error);
    throw error;
  }
}
