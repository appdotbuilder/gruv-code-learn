
import { db } from '../db';
import { coursesTable } from '../db/schema';
import { type UpdateCourseInput, type Course } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCourse = async (input: UpdateCourseInput): Promise<Course | null> => {
  try {
    // Check if course exists
    const existingCourse = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, input.id))
      .execute();

    if (existingCourse.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof coursesTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.language !== undefined) {
      updateData.language = input.language;
    }
    if (input.difficulty !== undefined) {
      updateData.difficulty = input.difficulty;
    }
    if (input.is_published !== undefined) {
      updateData.is_published = input.is_published;
    }

    // Update the course
    const result = await db.update(coursesTable)
      .set(updateData)
      .where(eq(coursesTable.id, input.id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Course update failed:', error);
    throw error;
  }
};
