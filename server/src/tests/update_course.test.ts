
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable } from '../db/schema';
import { type UpdateCourseInput } from '../schema';
import { updateCourse } from '../handlers/update_course';
import { eq } from 'drizzle-orm';

describe('updateCourse', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testCourseId: number;

  beforeEach(async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    testUserId = user[0].id;

    // Create test course
    const course = await db.insert(coursesTable)
      .values({
        title: 'Original Course',
        description: 'Original description',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: testUserId,
        is_published: false
      })
      .returning()
      .execute();

    testCourseId = course[0].id;
  });

  it('should update course with all fields', async () => {
    const updateInput: UpdateCourseInput = {
      id: testCourseId,
      title: 'Updated Course Title',
      description: 'Updated description',
      language: 'Python',
      difficulty: 'advanced',
      is_published: true
    };

    const result = await updateCourse(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testCourseId);
    expect(result!.title).toEqual('Updated Course Title');
    expect(result!.description).toEqual('Updated description');
    expect(result!.language).toEqual('Python');
    expect(result!.difficulty).toEqual('advanced');
    expect(result!.is_published).toEqual(true);
    expect(result!.created_by).toEqual(testUserId);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update course with partial fields', async () => {
    const updateInput: UpdateCourseInput = {
      id: testCourseId,
      title: 'Partially Updated Title',
      is_published: true
    };

    const result = await updateCourse(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testCourseId);
    expect(result!.title).toEqual('Partially Updated Title');
    expect(result!.description).toEqual('Original description'); // Unchanged
    expect(result!.language).toEqual('JavaScript'); // Unchanged  
    expect(result!.difficulty).toEqual('beginner'); // Unchanged
    expect(result!.is_published).toEqual(true); // Updated
    expect(result!.created_by).toEqual(testUserId);
  });

  it('should persist changes to database', async () => {
    const updateInput: UpdateCourseInput = {
      id: testCourseId,
      title: 'Database Test Title',
      difficulty: 'intermediate'
    };

    await updateCourse(updateInput);

    // Verify changes persisted in database
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, testCourseId))
      .execute();

    expect(courses).toHaveLength(1);
    expect(courses[0].title).toEqual('Database Test Title');
    expect(courses[0].difficulty).toEqual('intermediate');
    expect(courses[0].description).toEqual('Original description'); // Unchanged
  });

  it('should update updated_at timestamp', async () => {
    // Get original timestamp
    const originalCourse = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, testCourseId))
      .execute();

    const originalUpdatedAt = originalCourse[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateCourseInput = {
      id: testCourseId,
      title: 'Timestamp Test'
    };

    const result = await updateCourse(updateInput);

    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should return null for non-existent course', async () => {
    const updateInput: UpdateCourseInput = {
      id: 99999,
      title: 'Non-existent Course'
    };

    const result = await updateCourse(updateInput);

    expect(result).toBeNull();
  });

  it('should handle empty update gracefully', async () => {
    const updateInput: UpdateCourseInput = {
      id: testCourseId
    };

    const result = await updateCourse(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testCourseId);
    expect(result!.title).toEqual('Original Course'); // Unchanged
    expect(result!.description).toEqual('Original description'); // Unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});
