
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, badgesTable, userBadgesTable, userProgressTable, codeSubmissionsTable, coursesTable, lessonsTable, exercisesTable } from '../db/schema';
import { checkAndAwardBadges } from '../handlers/check_and_award_badges';
import { eq } from 'drizzle-orm';

describe('checkAndAwardBadges', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should award points-based badge when user has enough points', async () => {
    // Create user with sufficient points
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash',
        total_points: 500
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create points-based badge
    const badgeResult = await db.insert(badgesTable)
      .values({
        name: 'Points Master',
        description: 'Earn 400 points',
        icon: 'star',
        requirement_type: 'points',
        requirement_value: 400
      })
      .returning()
      .execute();

    const result = await checkAndAwardBadges(userId);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].badge_id).toEqual(badgeResult[0].id);
    expect(result[0].earned_at).toBeInstanceOf(Date);
  });

  it('should not award badge when user has insufficient points', async () => {
    // Create user with insufficient points
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash',
        total_points: 100
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create points-based badge with higher requirement
    await db.insert(badgesTable)
      .values({
        name: 'Points Master',
        description: 'Earn 400 points',
        icon: 'star',
        requirement_type: 'points',
        requirement_value: 400
      })
      .execute();

    const result = await checkAndAwardBadges(userId);

    expect(result).toHaveLength(0);
  });

  it('should award course completion badge', async () => {
    // Create user and admin
    const adminResult = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: 'hash',
        role: 'admin'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create courses
    const course1Result = await db.insert(coursesTable)
      .values({
        title: 'Course 1',
        description: 'Test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: adminResult[0].id
      })
      .returning()
      .execute();

    const course2Result = await db.insert(coursesTable)
      .values({
        title: 'Course 2',
        description: 'Test course',
        language: 'Python',
        difficulty: 'intermediate',
        created_by: adminResult[0].id
      })
      .returning()
      .execute();

    // Mark courses as completed (course-level progress without lesson/exercise/quiz)
    await db.insert(userProgressTable)
      .values({
        user_id: userId,
        course_id: course1Result[0].id,
        status: 'completed',
        points_earned: 100
      })
      .execute();

    await db.insert(userProgressTable)
      .values({
        user_id: userId,
        course_id: course2Result[0].id,
        status: 'completed',
        points_earned: 150
      })
      .execute();

    // Create course completion badge
    const badgeResult = await db.insert(badgesTable)
      .values({
        name: 'Course Completer',
        description: 'Complete 2 courses',
        icon: 'trophy',
        requirement_type: 'courses_completed',
        requirement_value: 2
      })
      .returning()
      .execute();

    const result = await checkAndAwardBadges(userId);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].badge_id).toEqual(badgeResult[0].id);
  });

  it('should award exercise completion badge', async () => {
    // Create user and admin
    const adminResult = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: 'hash',
        role: 'admin'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create course and lesson
    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'Test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: adminResult[0].id
      })
      .returning()
      .execute();

    const lessonResult = await db.insert(lessonsTable)
      .values({
        course_id: courseResult[0].id,
        title: 'Test Lesson',
        content: 'Test content',
        order_index: 1
      })
      .returning()
      .execute();

    // Create exercises
    const exercise1Result = await db.insert(exercisesTable)
      .values({
        lesson_id: lessonResult[0].id,
        title: 'Exercise 1',
        description: 'Test exercise',
        starter_code: 'console.log("start");',
        solution_code: 'console.log("solution");',
        test_cases: '[]',
        points_reward: 10
      })
      .returning()
      .execute();

    const exercise2Result = await db.insert(exercisesTable)
      .values({
        lesson_id: lessonResult[0].id,
        title: 'Exercise 2',
        description: 'Test exercise',
        starter_code: 'console.log("start");',
        solution_code: 'console.log("solution");',
        test_cases: '[]',
        points_reward: 15
      })
      .returning()
      .execute();

    const exercise3Result = await db.insert(exercisesTable)
      .values({
        lesson_id: lessonResult[0].id,
        title: 'Exercise 3',
        description: 'Test exercise',
        starter_code: 'console.log("start");',
        solution_code: 'console.log("solution");',
        test_cases: '[]',
        points_reward: 20
      })
      .returning()
      .execute();

    // Create passing submissions for 3 exercises
    await db.insert(codeSubmissionsTable)
      .values({
        user_id: userId,
        exercise_id: exercise1Result[0].id,
        code: 'console.log("solution");',
        status: 'passed'
      })
      .execute();

    await db.insert(codeSubmissionsTable)
      .values({
        user_id: userId,
        exercise_id: exercise2Result[0].id,
        code: 'console.log("solution");',
        status: 'passed'
      })
      .execute();

    await db.insert(codeSubmissionsTable)
      .values({
        user_id: userId,
        exercise_id: exercise3Result[0].id,
        code: 'console.log("solution");',
        status: 'passed'
      })
      .execute();

    // Create exercise completion badge
    const badgeResult = await db.insert(badgesTable)
      .values({
        name: 'Exercise Master',
        description: 'Complete 3 exercises',
        icon: 'code',
        requirement_type: 'exercises_completed',
        requirement_value: 3
      })
      .returning()
      .execute();

    const result = await checkAndAwardBadges(userId);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].badge_id).toEqual(badgeResult[0].id);
  });

  it('should not award badge user already has', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash',
        total_points: 500
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create badge
    const badgeResult = await db.insert(badgesTable)
      .values({
        name: 'Points Master',
        description: 'Earn 400 points',
        icon: 'star',
        requirement_type: 'points',
        requirement_value: 400
      })
      .returning()
      .execute();

    // User already has this badge
    await db.insert(userBadgesTable)
      .values({
        user_id: userId,
        badge_id: badgeResult[0].id
      })
      .execute();

    const result = await checkAndAwardBadges(userId);

    expect(result).toHaveLength(0);
  });

  it('should award multiple badges at once', async () => {
    // Create user with sufficient points and completed courses
    const adminResult = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: 'hash',
        role: 'admin'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash',
        total_points: 1000
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create course and mark as completed
    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'Test course',
        language: 'JavaScript',
        difficulty: 'beginner',
        created_by: adminResult[0].id
      })
      .returning()
      .execute();

    await db.insert(userProgressTable)
      .values({
        user_id: userId,
        course_id: courseResult[0].id,
        status: 'completed',
        points_earned: 200
      })
      .execute();

    // Create multiple badges
    const pointsBadge = await db.insert(badgesTable)
      .values({
        name: 'Points Master',
        description: 'Earn 500 points',
        icon: 'star',
        requirement_type: 'points',
        requirement_value: 500
      })
      .returning()
      .execute();

    const courseBadge = await db.insert(badgesTable)
      .values({
        name: 'Course Starter',
        description: 'Complete 1 course',
        icon: 'book',
        requirement_type: 'courses_completed',
        requirement_value: 1
      })
      .returning()
      .execute();

    const result = await checkAndAwardBadges(userId);

    expect(result).toHaveLength(2);
    
    const badgeIds = result.map(b => b.badge_id);
    expect(badgeIds).toContain(pointsBadge[0].id);
    expect(badgeIds).toContain(courseBadge[0].id);
    
    result.forEach(badge => {
      expect(badge.user_id).toEqual(userId);
      expect(badge.earned_at).toBeInstanceOf(Date);
    });
  });

  it('should throw error for non-existent user', async () => {
    expect(checkAndAwardBadges(999)).rejects.toThrow(/User with id 999 not found/);
  });

  it('should save awarded badges to database', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash',
        total_points: 600
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create badge
    const badgeResult = await db.insert(badgesTable)
      .values({
        name: 'Points Master',
        description: 'Earn 500 points',
        icon: 'star',
        requirement_type: 'points',
        requirement_value: 500
      })
      .returning()
      .execute();

    await checkAndAwardBadges(userId);

    // Verify badge was saved to database
    const userBadges = await db.select()
      .from(userBadgesTable)
      .where(eq(userBadgesTable.user_id, userId))
      .execute();

    expect(userBadges).toHaveLength(1);
    expect(userBadges[0].user_id).toEqual(userId);
    expect(userBadges[0].badge_id).toEqual(badgeResult[0].id);
    expect(userBadges[0].earned_at).toBeInstanceOf(Date);
  });
});
