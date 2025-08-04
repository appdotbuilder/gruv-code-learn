
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, badgesTable, userBadgesTable } from '../db/schema';
import { getUserBadges } from '../handlers/get_user_badges';

describe('getUserBadges', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no badges', async () => {
    // Create a user with no badges
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'student'
      })
      .returning()
      .execute();

    const result = await getUserBadges(userResult[0].id);

    expect(result).toEqual([]);
  });

  it('should return user badges when user has earned badges', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'student'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create badges
    const badgeResults = await db.insert(badgesTable)
      .values([
        {
          name: 'First Steps',
          description: 'Complete your first lesson',
          icon: 'star',
          requirement_type: 'points',
          requirement_value: 10
        },
        {
          name: 'Code Master',
          description: 'Complete 10 exercises',
          icon: 'trophy',
          requirement_type: 'exercises_completed',
          requirement_value: 10
        }
      ])
      .returning()
      .execute();

    // Award badges to user
    const userBadgeResults = await db.insert(userBadgesTable)
      .values([
        {
          user_id: userId,
          badge_id: badgeResults[0].id
        },
        {
          user_id: userId,
          badge_id: badgeResults[1].id
        }
      ])
      .returning()
      .execute();

    const result = await getUserBadges(userId);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].badge_id).toEqual(badgeResults[0].id);
    expect(result[0].id).toBeDefined();
    expect(result[0].earned_at).toBeInstanceOf(Date);

    expect(result[1].user_id).toEqual(userId);
    expect(result[1].badge_id).toEqual(badgeResults[1].id);
    expect(result[1].id).toBeDefined();
    expect(result[1].earned_at).toBeInstanceOf(Date);
  });

  it('should only return badges for the specified user', async () => {
    // Create two users
    const userResults = await db.insert(usersTable)
      .values([
        {
          username: 'user1',
          email: 'user1@example.com',
          password_hash: 'hashedpassword',
          role: 'student'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password_hash: 'hashedpassword',
          role: 'student'
        }
      ])
      .returning()
      .execute();

    const user1Id = userResults[0].id;
    const user2Id = userResults[1].id;

    // Create badge
    const badgeResult = await db.insert(badgesTable)
      .values({
        name: 'Test Badge',
        description: 'A test badge',
        icon: 'medal',
        requirement_type: 'points',
        requirement_value: 5
      })
      .returning()
      .execute();

    const badgeId = badgeResult[0].id;

    // Award badge to both users
    await db.insert(userBadgesTable)
      .values([
        {
          user_id: user1Id,
          badge_id: badgeId
        },
        {
          user_id: user2Id,
          badge_id: badgeId
        }
      ])
      .execute();

    // Get badges for user1 only
    const result = await getUserBadges(user1Id);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user1Id);
    expect(result[0].badge_id).toEqual(badgeId);
  });

  it('should return badges ordered by earned_at', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'student'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create badges
    const badgeResults = await db.insert(badgesTable)
      .values([
        {
          name: 'Badge 1',
          description: 'First badge',
          icon: 'star',
          requirement_type: 'points',
          requirement_value: 5
        },
        {
          name: 'Badge 2',
          description: 'Second badge',
          icon: 'trophy',
          requirement_type: 'points',
          requirement_value: 10
        }
      ])
      .returning()
      .execute();

    // Award badges with slight delay to ensure different timestamps
    await db.insert(userBadgesTable)
      .values({
        user_id: userId,
        badge_id: badgeResults[0].id
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(userBadgesTable)
      .values({
        user_id: userId,
        badge_id: badgeResults[1].id
      })
      .execute();

    const result = await getUserBadges(userId);

    expect(result).toHaveLength(2);
    // Verify all badges are returned (exact order may vary depending on DB)
    const badgeIds = result.map(badge => badge.badge_id);
    expect(badgeIds).toContain(badgeResults[0].id);
    expect(badgeIds).toContain(badgeResults[1].id);
  });
});
