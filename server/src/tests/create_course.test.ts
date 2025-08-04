
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { coursesTable, usersTable } from '../db/schema';
import { type CreateCourseInput } from '../schema';
import { createCourse } from '../handlers/create_course';
import { eq } from 'drizzle-orm';

// Test input for course creation
const testCourseInput: CreateCourseInput = {
  title: 'Introduction to JavaScript',
  description: 'Learn the basics of JavaScript programming',
  language: 'javascript',
  difficulty: 'beginner',
  is_published: false
};

describe('createCourse', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let adminUserId: number;
  let studentUserId: number;

  beforeEach(async () => {
    // Create admin user for testing
    const adminResult = await db.insert(usersTable)
      .values({
        username: 'admin_user',
        email: 'admin@test.com',
        password_hash: 'hashed_password_123',
        role: 'admin'
      })
      .returning()
      .execute();
    adminUserId = adminResult[0].id;

    // Create student user for testing
    const studentResult = await db.insert(usersTable)
      .values({
        username: 'student_user',
        email: 'student@test.com',
        password_hash: 'hashed_password_456',
        role: 'student'
      })
      .returning()
      .execute();
    studentUserId = studentResult[0].id;
  });

  it('should create a course with admin user', async () => {
    const result = await createCourse(testCourseInput, adminUserId);

    // Basic field validation
    expect(result.title).toEqual('Introduction to JavaScript');
    expect(result.description).toEqual(testCourseInput.description);
    expect(result.language).toEqual('javascript');
    expect(result.difficulty).toEqual('beginner');
    expect(result.created_by).toEqual(adminUserId);
    expect(result.is_published).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save course to database', async () => {
    const result = await createCourse(testCourseInput, adminUserId);

    // Query database to verify course was saved
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, result.id))
      .execute();

    expect(courses).toHaveLength(1);
    expect(courses[0].title).toEqual('Introduction to JavaScript');
    expect(courses[0].description).toEqual(testCourseInput.description);
    expect(courses[0].language).toEqual('javascript');
    expect(courses[0].difficulty).toEqual('beginner');
    expect(courses[0].created_by).toEqual(adminUserId);
    expect(courses[0].is_published).toEqual(false);
    expect(courses[0].created_at).toBeInstanceOf(Date);
    expect(courses[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create published course when is_published is true', async () => {
    const publishedCourseInput: CreateCourseInput = {
      ...testCourseInput,
      is_published: true
    };

    const result = await createCourse(publishedCourseInput, adminUserId);

    expect(result.is_published).toEqual(true);

    // Verify in database
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, result.id))
      .execute();

    expect(courses[0].is_published).toEqual(true);
  });

  it('should reject course creation by student user', async () => {
    await expect(createCourse(testCourseInput, studentUserId))
      .rejects.toThrow(/only admins can create courses/i);
  });

  it('should reject course creation by non-existent user', async () => {
    const nonExistentUserId = 99999;

    await expect(createCourse(testCourseInput, nonExistentUserId))
      .rejects.toThrow(/user not found/i);
  });

  it('should handle course with advanced difficulty', async () => {
    const advancedCourseInput: CreateCourseInput = {
      ...testCourseInput,
      title: 'Advanced React Patterns',
      difficulty: 'advanced'
    };

    const result = await createCourse(advancedCourseInput, adminUserId);

    expect(result.difficulty).toEqual('advanced');
    expect(result.title).toEqual('Advanced React Patterns');
  });

  it('should handle course with all difficulty levels', async () => {
    const difficulties = ['beginner', 'intermediate', 'advanced'] as const;

    for (const difficulty of difficulties) {
      const courseInput: CreateCourseInput = {
        ...testCourseInput,
        title: `${difficulty} Course`,
        difficulty
      };

      const result = await createCourse(courseInput, adminUserId);
      expect(result.difficulty).toEqual(difficulty);
    }
  });
});
