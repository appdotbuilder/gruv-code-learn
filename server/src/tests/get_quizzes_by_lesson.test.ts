
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, quizzesTable } from '../db/schema';
import { getQuizzesByLesson } from '../handlers/get_quizzes_by_lesson';

describe('getQuizzesByLesson', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return quizzes for a specific lesson', async () => {
    // Create test user
    const userResult = await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashed_password',
      role: 'admin'
    }).returning().execute();

    // Create test course
    const courseResult = await db.insert(coursesTable).values({
      title: 'Test Course',
      description: 'A test course',
      language: 'JavaScript',
      difficulty: 'beginner',
      created_by: userResult[0].id,
      is_published: true
    }).returning().execute();

    // Create test lesson
    const lessonResult = await db.insert(lessonsTable).values({
      course_id: courseResult[0].id,
      title: 'Test Lesson',
      content: 'Test lesson content',
      order_index: 1
    }).returning().execute();

    // Create test quizzes
    const quiz1Result = await db.insert(quizzesTable).values({
      lesson_id: lessonResult[0].id,
      title: 'Quiz 1',
      description: 'First quiz',
      points_reward: 10
    }).returning().execute();

    const quiz2Result = await db.insert(quizzesTable).values({
      lesson_id: lessonResult[0].id,
      title: 'Quiz 2',
      description: 'Second quiz',
      points_reward: 15
    }).returning().execute();

    // Create quiz for different lesson to ensure filtering works
    const otherLessonResult = await db.insert(lessonsTable).values({
      course_id: courseResult[0].id,
      title: 'Other Lesson',
      content: 'Other lesson content',
      order_index: 2
    }).returning().execute();

    await db.insert(quizzesTable).values({
      lesson_id: otherLessonResult[0].id,
      title: 'Other Quiz',
      description: 'Quiz for other lesson',
      points_reward: 5
    }).execute();

    const result = await getQuizzesByLesson(lessonResult[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Quiz 1');
    expect(result[0].description).toEqual('First quiz');
    expect(result[0].points_reward).toEqual(10);
    expect(result[0].lesson_id).toEqual(lessonResult[0].id);
    expect(result[0].id).toEqual(quiz1Result[0].id);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].title).toEqual('Quiz 2');
    expect(result[1].description).toEqual('Second quiz');
    expect(result[1].points_reward).toEqual(15);
    expect(result[1].lesson_id).toEqual(lessonResult[0].id);
    expect(result[1].id).toEqual(quiz2Result[0].id);
  });

  it('should return empty array when lesson has no quizzes', async () => {
    // Create test user
    const userResult = await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashed_password',
      role: 'admin'
    }).returning().execute();

    // Create test course
    const courseResult = await db.insert(coursesTable).values({
      title: 'Test Course',
      description: 'A test course',
      language: 'JavaScript',
      difficulty: 'beginner',
      created_by: userResult[0].id,
      is_published: true
    }).returning().execute();

    // Create test lesson without any quizzes
    const lessonResult = await db.insert(lessonsTable).values({
      course_id: courseResult[0].id,
      title: 'Test Lesson',
      content: 'Test lesson content',
      order_index: 1
    }).returning().execute();

    const result = await getQuizzesByLesson(lessonResult[0].id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent lesson', async () => {
    const result = await getQuizzesByLesson(999);

    expect(result).toHaveLength(0);
  });
});
