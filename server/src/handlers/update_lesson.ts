
import { db } from '../db';
import { lessonsTable } from '../db/schema';
import { type UpdateLessonInput, type Lesson } from '../schema';
import { eq } from 'drizzle-orm';

export const updateLesson = async (input: UpdateLessonInput): Promise<Lesson | null> => {
  try {
    // Check if lesson exists
    const existingLesson = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, input.id))
      .execute();

    if (existingLesson.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.content !== undefined) {
      updateData.content = input.content;
    }

    if (input.order_index !== undefined) {
      updateData.order_index = input.order_index;
    }

    // Update the lesson
    const result = await db.update(lessonsTable)
      .set(updateData)
      .where(eq(lessonsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Lesson update failed:', error);
    throw error;
  }
};
