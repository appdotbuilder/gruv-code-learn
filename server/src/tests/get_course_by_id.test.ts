
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable } from '../db/schema';
import { getCourseById } from '../handlers/get_course_by_id';

describe('getCourseById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return course when found', async () => {
    // Create a user first (required for course creation)
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a course
    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A course for testing',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: userId,
        is_published: true
      })
      .returning()
      .execute();

    const courseId = courseResult[0].id;

    // Test the handler
    const result = await getCourseById(courseId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(courseId);
    expect(result!.title).toEqual('Test Course');
    expect(result!.description).toEqual('A course for testing');
    expect(result!.language).toEqual('JavaScript');
    expect(result!.difficulty).toEqual('beginner');
    expect(result!.created_by).toEqual(userId);
    expect(result!.is_published).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when course not found', async () => {
    const result = await getCourseById(999);
    expect(result).toBeNull();
  });

  it('should return correct course when multiple courses exist', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create multiple courses
    const courseResults = await db.insert(coursesTable)
      .values([
        {
          title: 'Course 1',
          description: 'First course',
          language: 'JavaScript',
          difficulty: 'beginner',
          created_by: userId,
          is_published: false
        },
        {
          title: 'Course 2',
          description: 'Second course',
          language: 'Python',
          difficulty: 'intermediate',
          created_by: userId,
          is_published: true
        }
      ])
      .returning()
      .execute();

    const course2Id = courseResults[1].id;

    // Test getting the second course specifically
    const result = await getCourseById(course2Id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(course2Id);
    expect(result!.title).toEqual('Course 2');
    expect(result!.description).toEqual('Second course');
    expect(result!.language).toEqual('Python');
    expect(result!.difficulty).toEqual('intermediate');
    expect(result!.is_published).toEqual(true);
  });
});
