
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable } from '../db/schema';
import { getCourses } from '../handlers/get_courses';

describe('getCourses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no published courses exist', async () => {
    const result = await getCourses();
    expect(result).toEqual([]);
  });

  it('should return only published courses', async () => {
    // Create a test user first
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        role: 'admin'
      })
      .returning()
      .execute();

    // Create published and unpublished courses
    await db.insert(coursesTable)
      .values([
        {
          title: 'Published Course',
          description: 'This course is published',
          language: 'JavaScript',
          difficulty: 'beginner',
          created_by: user[0].id,
          is_published: true
        },
        {
          title: 'Unpublished Course',
          description: 'This course is not published',
          language: 'Python',
          difficulty: 'intermediate',
          created_by: user[0].id,
          is_published: false
        }
      ])
      .execute();

    const result = await getCourses();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Published Course');
    expect(result[0].is_published).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple published courses', async () => {
    // Create a test user first
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        role: 'admin'
      })
      .returning()
      .execute();

    // Create multiple published courses
    await db.insert(coursesTable)
      .values([
        {
          title: 'JavaScript Basics',
          description: 'Learn JavaScript fundamentals',
          language: 'JavaScript',
          difficulty: 'beginner',
          created_by: user[0].id,
          is_published: true
        },
        {
          title: 'Advanced Python',
          description: 'Advanced Python concepts',
          language: 'Python',
          difficulty: 'advanced',
          created_by: user[0].id,
          is_published: true
        }
      ])
      .execute();

    const result = await getCourses();

    expect(result).toHaveLength(2);
    result.forEach(course => {
      expect(course.is_published).toBe(true);
      expect(course.title).toBeDefined();
      expect(course.description).toBeDefined();
      expect(course.language).toBeDefined();
      expect(['beginner', 'intermediate', 'advanced']).toContain(course.difficulty);
      expect(course.created_by).toEqual(user[0].id);
    });
  });

  it('should return courses with all required fields', async () => {
    // Create a test user first
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        role: 'admin'
      })
      .returning()
      .execute();

    await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'Test description',
        language: 'TypeScript',
        difficulty: 'intermediate',
        created_by: user[0].id,
        is_published: true
      })
      .execute();

    const result = await getCourses();

    expect(result).toHaveLength(1);
    const course = result[0];
    
    expect(typeof course.id).toBe('number');
    expect(typeof course.title).toBe('string');
    expect(typeof course.description).toBe('string');
    expect(typeof course.language).toBe('string');
    expect(['beginner', 'intermediate', 'advanced']).toContain(course.difficulty);
    expect(typeof course.created_by).toBe('number');
    expect(typeof course.is_published).toBe('boolean');
    expect(course.created_at).toBeInstanceOf(Date);
    expect(course.updated_at).toBeInstanceOf(Date);
  });
});
