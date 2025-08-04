
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, quizzesTable } from '../db/schema';
import { type CreateQuizInput } from '../schema';
import { createQuiz } from '../handlers/create_quiz';
import { eq } from 'drizzle-orm';

const testInput: CreateQuizInput = {
  lesson_id: 1,
  title: 'JavaScript Basics Quiz',
  description: 'Test your understanding of JavaScript fundamentals',
  points_reward: 50
};

describe('createQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a quiz', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@test.com',
        password_hash: 'hash123',
        role: 'admin'
      })
      .returning()
      .execute();

    const course = await db.insert(coursesTable)
      .values({
        title: 'JavaScript Course',
        description: 'Learn JavaScript',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: user[0].id
      })
      .returning()
      .execute();

    const lesson = await db.insert(lessonsTable)
      .values({
        course_id: course[0].id,
        title: 'Lesson 1',
        content: 'Basic concepts',
        order_index: 1
      })
      .returning()
      .execute();

    const inputWithValidLessonId = {
      ...testInput,
      lesson_id: lesson[0].id
    };

    const result = await createQuiz(inputWithValidLessonId);

    // Basic field validation
    expect(result.lesson_id).toEqual(lesson[0].id);
    expect(result.title).toEqual('JavaScript Basics Quiz');
    expect(result.description).toEqual(testInput.description);
    expect(result.points_reward).toEqual(50);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save quiz to database', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@test.com',
        password_hash: 'hash123',
        role: 'admin'
      })
      .returning()
      .execute();

    const course = await db.insert(coursesTable)
      .values({
        title: 'JavaScript Course',
        description: 'Learn JavaScript',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: user[0].id
      })
      .returning()
      .execute();

    const lesson = await db.insert(lessonsTable)
      .values({
        course_id: course[0].id,
        title: 'Lesson 1',
        content: 'Basic concepts',
        order_index: 1
      })
      .returning()
      .execute();

    const inputWithValidLessonId = {
      ...testInput,
      lesson_id: lesson[0].id
    };

    const result = await createQuiz(inputWithValidLessonId);

    // Query database to verify quiz was saved
    const quizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, result.id))
      .execute();

    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].lesson_id).toEqual(lesson[0].id);
    expect(quizzes[0].title).toEqual('JavaScript Basics Quiz');
    expect(quizzes[0].description).toEqual(testInput.description);
    expect(quizzes[0].points_reward).toEqual(50);
    expect(quizzes[0].created_at).toBeInstanceOf(Date);
    expect(quizzes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent lesson', async () => {
    const inputWithInvalidLessonId = {
      ...testInput,
      lesson_id: 999
    };

    await expect(createQuiz(inputWithInvalidLessonId))
      .rejects.toThrow(/lesson not found/i);
  });
});
