
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable } from '../db/schema';
import { type CreateUserInput, type CreateCourseInput, type CreateLessonInput, type UpdateLessonInput } from '../schema';
import { updateLesson } from '../handlers/update_lesson';
import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: 'admin'
};

const testCourse: CreateCourseInput = {
  title: 'Test Course',
  description: 'A course for testing',
  language: 'JavaScript',
  difficulty: 'beginner',
  is_published: true
};

const testLesson: CreateLessonInput = {
  course_id: 1, // Will be set after course creation
  title: 'Test Lesson',
  content: 'This is test lesson content',
  order_index: 1
};

describe('updateLesson', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a lesson with all fields', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        role: testUser.role
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        ...testCourse,
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const lessonResult = await db.insert(lessonsTable)
      .values({
        ...testLesson,
        course_id: courseResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateLessonInput = {
      id: lessonResult[0].id,
      title: 'Updated Lesson Title',
      content: 'Updated lesson content',
      order_index: 2
    };

    const result = await updateLesson(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(lessonResult[0].id);
    expect(result!.title).toEqual('Updated Lesson Title');
    expect(result!.content).toEqual('Updated lesson content');
    expect(result!.order_index).toEqual(2);
    expect(result!.course_id).toEqual(courseResult[0].id);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > lessonResult[0].updated_at).toBe(true);
  });

  it('should update a lesson with partial fields', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        role: testUser.role
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        ...testCourse,
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const lessonResult = await db.insert(lessonsTable)
      .values({
        ...testLesson,
        course_id: courseResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateLessonInput = {
      id: lessonResult[0].id,
      title: 'Only Title Updated'
    };

    const result = await updateLesson(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(lessonResult[0].id);
    expect(result!.title).toEqual('Only Title Updated');
    expect(result!.content).toEqual(testLesson.content); // Should remain unchanged
    expect(result!.order_index).toEqual(testLesson.order_index); // Should remain unchanged
    expect(result!.course_id).toEqual(courseResult[0].id);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated lesson to database', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        role: testUser.role
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        ...testCourse,
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const lessonResult = await db.insert(lessonsTable)
      .values({
        ...testLesson,
        course_id: courseResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateLessonInput = {
      id: lessonResult[0].id,
      title: 'Database Update Test',
      content: 'Updated content for database verification'
    };

    await updateLesson(updateInput);

    // Verify the update persisted in database
    const lessons = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, lessonResult[0].id))
      .execute();

    expect(lessons).toHaveLength(1);
    expect(lessons[0].title).toEqual('Database Update Test');
    expect(lessons[0].content).toEqual('Updated content for database verification');
    expect(lessons[0].order_index).toEqual(testLesson.order_index); // Should remain unchanged
    expect(lessons[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent lesson', async () => {
    const updateInput: UpdateLessonInput = {
      id: 999,
      title: 'Non-existent Lesson'
    };

    const result = await updateLesson(updateInput);

    expect(result).toBeNull();
  });

  it('should update order_index independently', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        role: testUser.role
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        ...testCourse,
        created_by: userResult[0].id
      })
      .returning()
      .execute();

    const lessonResult = await db.insert(lessonsTable)
      .values({
        ...testLesson,
        course_id: courseResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateLessonInput = {
      id: lessonResult[0].id,
      order_index: 5
    };

    const result = await updateLesson(updateInput);

    expect(result).not.toBeNull();
    expect(result!.order_index).toEqual(5);
    expect(result!.title).toEqual(testLesson.title); // Should remain unchanged
    expect(result!.content).toEqual(testLesson.content); // Should remain unchanged
  });
});
