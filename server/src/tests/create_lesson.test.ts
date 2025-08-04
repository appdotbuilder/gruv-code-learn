
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { lessonsTable, coursesTable, usersTable } from '../db/schema';
import { type CreateLessonInput } from '../schema';
import { createLesson } from '../handlers/create_lesson';
import { eq } from 'drizzle-orm';

describe('createLesson', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a lesson', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    // Create prerequisite course
    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A course for testing',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: userResult[0].id,
        is_published: true
      })
      .returning()
      .execute();

    const testInput: CreateLessonInput = {
      course_id: courseResult[0].id,
      title: 'Introduction to Variables',
      content: 'This lesson covers the basics of variables in programming.',
      order_index: 1
    };

    const result = await createLesson(testInput);

    // Basic field validation
    expect(result.course_id).toEqual(courseResult[0].id);
    expect(result.title).toEqual('Introduction to Variables');
    expect(result.content).toEqual(testInput.content);
    expect(result.order_index).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save lesson to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    // Create prerequisite course
    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A course for testing',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: userResult[0].id,
        is_published: true
      })
      .returning()
      .execute();

    const testInput: CreateLessonInput = {
      course_id: courseResult[0].id,
      title: 'Introduction to Variables',
      content: 'This lesson covers the basics of variables in programming.',
      order_index: 1
    };

    const result = await createLesson(testInput);

    // Query using proper drizzle syntax
    const lessons = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, result.id))
      .execute();

    expect(lessons).toHaveLength(1);
    expect(lessons[0].course_id).toEqual(courseResult[0].id);
    expect(lessons[0].title).toEqual('Introduction to Variables');
    expect(lessons[0].content).toEqual(testInput.content);
    expect(lessons[0].order_index).toEqual(1);
    expect(lessons[0].created_at).toBeInstanceOf(Date);
    expect(lessons[0].updated_at).toBeInstanceOf(Date);
  });

  it('should reject lesson creation for non-existent course', async () => {
    const testInput: CreateLessonInput = {
      course_id: 999, // Non-existent course
      title: 'Introduction to Variables',
      content: 'This lesson covers the basics of variables in programming.',
      order_index: 1
    };

    expect(createLesson(testInput)).rejects.toThrow(/course with id 999 does not exist/i);
  });

  it('should handle multiple lessons with different order indices', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    // Create prerequisite course
    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A course for testing',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: userResult[0].id,
        is_published: true
      })
      .returning()
      .execute();

    const lesson1Input: CreateLessonInput = {
      course_id: courseResult[0].id,
      title: 'Lesson 1',
      content: 'First lesson content',
      order_index: 1
    };

    const lesson2Input: CreateLessonInput = {
      course_id: courseResult[0].id,
      title: 'Lesson 2',
      content: 'Second lesson content',
      order_index: 2
    };

    const result1 = await createLesson(lesson1Input);
    const result2 = await createLesson(lesson2Input);

    expect(result1.order_index).toEqual(1);
    expect(result2.order_index).toEqual(2);
    expect(result1.course_id).toEqual(result2.course_id);

    // Verify both lessons exist in database
    const lessons = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.course_id, courseResult[0].id))
      .execute();

    expect(lessons).toHaveLength(2);
  });
});
