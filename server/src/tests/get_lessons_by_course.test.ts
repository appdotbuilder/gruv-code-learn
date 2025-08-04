
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable } from '../db/schema';
import { getLessonsByCourse } from '../handlers/get_lessons_by_course';

describe('getLessonsByCourse', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return lessons ordered by order_index', async () => {
    // Create admin user
    const adminUser = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        role: 'admin'
      })
      .returning()
      .execute();

    // Create course
    const course = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: adminUser[0].id
      })
      .returning()
      .execute();

    // Create lessons with different order_index values
    await db.insert(lessonsTable)
      .values([
        {
          course_id: course[0].id,
          title: 'Lesson 3',
          content: 'Third lesson content',
          order_index: 2
        },
        {
          course_id: course[0].id,
          title: 'Lesson 1',
          content: 'First lesson content',
          order_index: 0
        },
        {
          course_id: course[0].id,
          title: 'Lesson 2',
          content: 'Second lesson content',
          order_index: 1
        }
      ])
      .execute();

    const result = await getLessonsByCourse(course[0].id);

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Lesson 1');
    expect(result[0].order_index).toEqual(0);
    expect(result[1].title).toEqual('Lesson 2');
    expect(result[1].order_index).toEqual(1);
    expect(result[2].title).toEqual('Lesson 3');
    expect(result[2].order_index).toEqual(2);
  });

  it('should return empty array for course with no lessons', async () => {
    // Create admin user
    const adminUser = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        role: 'admin'
      })
      .returning()
      .execute();

    // Create course without lessons
    const course = await db.insert(coursesTable)
      .values({
        title: 'Empty Course',
        description: 'A course with no lessons',
        language: 'Python',
        difficulty: 'intermediate',
        created_by: adminUser[0].id
      })
      .returning()
      .execute();

    const result = await getLessonsByCourse(course[0].id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent course', async () => {
    const result = await getLessonsByCourse(999);

    expect(result).toHaveLength(0);
  });

  it('should only return lessons for the specified course', async () => {
    // Create admin user
    const adminUser = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        role: 'admin'
      })
      .returning()
      .execute();

    // Create two courses
    const courses = await db.insert(coursesTable)
      .values([
        {
          title: 'Course 1',
          description: 'First course',
          language: 'JavaScript',
          difficulty: 'beginner',
          created_by: adminUser[0].id
        },
        {
          title: 'Course 2',
          description: 'Second course',
          language: 'Python',
          difficulty: 'intermediate',
          created_by: adminUser[0].id
        }
      ])
      .returning()
      .execute();

    // Create lessons for both courses
    await db.insert(lessonsTable)
      .values([
        {
          course_id: courses[0].id,
          title: 'Course 1 Lesson 1',
          content: 'Content for course 1',
          order_index: 0
        },
        {
          course_id: courses[0].id,
          title: 'Course 1 Lesson 2',
          content: 'More content for course 1',
          order_index: 1
        },
        {
          course_id: courses[1].id,
          title: 'Course 2 Lesson 1',
          content: 'Content for course 2',
          order_index: 0
        }
      ])
      .execute();

    const result = await getLessonsByCourse(courses[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Course 1 Lesson 1');
    expect(result[0].course_id).toEqual(courses[0].id);
    expect(result[1].title).toEqual('Course 1 Lesson 2');
    expect(result[1].course_id).toEqual(courses[0].id);
  });

  it('should return lessons with all required fields', async () => {
    // Create admin user
    const adminUser = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        role: 'admin'
      })
      .returning()
      .execute();

    // Create course
    const course = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: adminUser[0].id
      })
      .returning()
      .execute();

    // Create lesson
    await db.insert(lessonsTable)
      .values({
        course_id: course[0].id,
        title: 'Test Lesson',
        content: 'Test lesson content',
        order_index: 0
      })
      .execute();

    const result = await getLessonsByCourse(course[0].id);

    expect(result).toHaveLength(1);
    const lesson = result[0];
    
    expect(lesson.id).toBeDefined();
    expect(lesson.course_id).toEqual(course[0].id);
    expect(lesson.title).toEqual('Test Lesson');
    expect(lesson.content).toEqual('Test lesson content');
    expect(lesson.order_index).toEqual(0);
    expect(lesson.created_at).toBeInstanceOf(Date);
    expect(lesson.updated_at).toBeInstanceOf(Date);
  });
});
