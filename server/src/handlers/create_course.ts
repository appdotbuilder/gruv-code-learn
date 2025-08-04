
import { db } from '../db';
import { coursesTable, usersTable } from '../db/schema';
import { type CreateCourseInput, type Course } from '../schema';
import { eq } from 'drizzle-orm';

export const createCourse = async (input: CreateCourseInput, userId: number): Promise<Course> => {
  try {
    // Verify user exists and has admin role
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];
    if (user.role !== 'admin') {
      throw new Error('Only admins can create courses');
    }

    // Insert course record
    const result = await db.insert(coursesTable)
      .values({
        title: input.title,
        description: input.description,
        language: input.language,
        difficulty: input.difficulty,
        created_by: userId,
        is_published: input.is_published
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Course creation failed:', error);
    throw error;
  }
};
