
import { db } from '../db';
import { lessonsTable } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { type Lesson } from '../schema';

export async function getLessonsByCourse(courseId: number): Promise<Lesson[]> {
  try {
    const lessons = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.course_id, courseId))
      .orderBy(asc(lessonsTable.order_index))
      .execute();

    return lessons;
  } catch (error) {
    console.error('Failed to fetch lessons by course:', error);
    throw error;
  }
}
