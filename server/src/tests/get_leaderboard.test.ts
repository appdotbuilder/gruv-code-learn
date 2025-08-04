
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, badgesTable, userBadgesTable, coursesTable, userProgressTable } from '../db/schema';
import { getLeaderboard } from '../handlers/get_leaderboard';

const createTestUser = async (username: string, totalPoints: number) => {
  const result = await db.insert(usersTable)
    .values({
      username,
      email: `${username}@example.com`,
      password_hash: 'hashed_password',
      role: 'student',
      total_points: totalPoints
    })
    .returning()
    .execute();
  return result[0];
};

const createTestBadge = async (name: string) => {
  const result = await db.insert(badgesTable)
    .values({
      name,
      description: 'Test badge',
      icon: 'icon.png',
      requirement_type: 'points',
      requirement_value: 100
    })
    .returning()
    .execute();
  return result[0];
};

const createTestCourse = async (createdBy: number) => {
  const result = await db.insert(coursesTable)
    .values({
      title: 'Test Course',
      description: 'A test course',
      language: 'JavaScript',
      difficulty: 'beginner',
      created_by: createdBy,
      is_published: true
    })
    .returning()
    .execute();
  return result[0];
};

describe('getLeaderboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty leaderboard when no users exist', async () => {
    const result = await getLeaderboard();

    expect(result).toEqual([]);
  });

  it('should return users ordered by total points descending', async () => {
    // Create users with different point totals
    await createTestUser('user1', 100);
    await createTestUser('user2', 300);
    await createTestUser('user3', 200);

    const result = await getLeaderboard();

    expect(result).toHaveLength(3);
    expect(result[0].totalPoints).toBe(300);
    expect(result[0].username).toBe('user2');
    expect(result[1].totalPoints).toBe(200);
    expect(result[1].username).toBe('user3');
    expect(result[2].totalPoints).toBe(100);
    expect(result[2].username).toBe('user1');
  });

  it('should respect the limit parameter', async () => {
    // Create 5 users
    await createTestUser('user1', 100);
    await createTestUser('user2', 200);
    await createTestUser('user3', 300);
    await createTestUser('user4', 400);
    await createTestUser('user5', 500);

    const result = await getLeaderboard(3);

    expect(result).toHaveLength(3);
    expect(result[0].totalPoints).toBe(500);
    expect(result[1].totalPoints).toBe(400);
    expect(result[2].totalPoints).toBe(300);
  });

  it('should include badge count for users', async () => {
    const user = await createTestUser('user1', 100);
    const badge1 = await createTestBadge('Badge 1');
    const badge2 = await createTestBadge('Badge 2');

    // Award badges to user
    await db.insert(userBadgesTable)
      .values([
        { user_id: user.id, badge_id: badge1.id },
        { user_id: user.id, badge_id: badge2.id }
      ])
      .execute();

    const result = await getLeaderboard();

    expect(result).toHaveLength(1);
    expect(result[0].badgeCount).toBe(2);
    expect(result[0].username).toBe('user1');
  });

  it('should include courses completed count', async () => {
    const user = await createTestUser('user1', 100);
    const course1 = await createTestCourse(user.id);
    const course2 = await createTestCourse(user.id);

    // Mark courses as completed (course-level progress with no specific lesson/exercise/quiz)
    await db.insert(userProgressTable)
      .values([
        {
          user_id: user.id,
          course_id: course1.id,
          lesson_id: null,
          exercise_id: null,
          quiz_id: null,
          status: 'completed',
          points_earned: 50
        },
        {
          user_id: user.id,
          course_id: course2.id,
          lesson_id: null,
          exercise_id: null,
          quiz_id: null,
          status: 'completed',
          points_earned: 50
        }
      ])
      .execute();

    const result = await getLeaderboard();

    expect(result).toHaveLength(1);
    expect(result[0].coursesCompleted).toBe(2);
    expect(result[0].username).toBe('user1');
  });

  it('should return complete leaderboard entry with all fields', async () => {
    const user = await createTestUser('testuser', 250);
    const badge = await createTestBadge('Test Badge');
    const course = await createTestCourse(user.id);

    // Award badge
    await db.insert(userBadgesTable)
      .values({ user_id: user.id, badge_id: badge.id })
      .execute();

    // Complete course
    await db.insert(userProgressTable)
      .values({
        user_id: user.id,
        course_id: course.id,
        lesson_id: null,
        exercise_id: null,
        quiz_id: null,
        status: 'completed',
        points_earned: 100
      })
      .execute();

    const result = await getLeaderboard();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      userId: user.id,
      username: 'testuser',
      totalPoints: 250,
      badgeCount: 1,
      coursesCompleted: 1
    });
  });
});
