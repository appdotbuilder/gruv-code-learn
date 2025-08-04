
import { db } from '../db';
import { usersTable, badgesTable, userBadgesTable, userProgressTable, codeSubmissionsTable } from '../db/schema';
import { type UserBadge } from '../schema';
import { eq, count, and, sql } from 'drizzle-orm';

export async function checkAndAwardBadges(userId: number): Promise<UserBadge[]> {
  try {
    // Get user's current total points
    const userResult = await db.select({ total_points: usersTable.total_points })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (userResult.length === 0) {
      throw new Error(`User with id ${userId} not found`);
    }

    const userTotalPoints = userResult[0].total_points;

    // Get completed courses count
    const completedCoursesResult = await db.select({ count: count() })
      .from(userProgressTable)
      .where(
        and(
          eq(userProgressTable.user_id, userId),
          eq(userProgressTable.status, 'completed'),
          sql`${userProgressTable.lesson_id} IS NULL AND ${userProgressTable.exercise_id} IS NULL AND ${userProgressTable.quiz_id} IS NULL`
        )
      )
      .execute();

    const completedCourses = completedCoursesResult[0].count;

    // Get completed exercises count
    const completedExercisesResult = await db.select({ count: count() })
      .from(codeSubmissionsTable)
      .where(
        and(
          eq(codeSubmissionsTable.user_id, userId),
          eq(codeSubmissionsTable.status, 'passed')
        )
      )
      .execute();

    const completedExercises = completedExercisesResult[0].count;

    // Get all badges the user hasn't earned yet
    const existingBadgeIds = await db.select({ badge_id: userBadgesTable.badge_id })
      .from(userBadgesTable)
      .where(eq(userBadgesTable.user_id, userId))
      .execute();

    const existingBadgeIdSet = new Set(existingBadgeIds.map(b => b.badge_id));

    const availableBadges = await db.select()
      .from(badgesTable)
      .execute();

    // Check which badges the user qualifies for
    const newBadges: UserBadge[] = [];
    
    for (const badge of availableBadges) {
      // Skip if user already has this badge
      if (existingBadgeIdSet.has(badge.id)) {
        continue;
      }

      let qualifies = false;

      switch (badge.requirement_type) {
        case 'points':
          qualifies = userTotalPoints >= badge.requirement_value;
          break;
        case 'courses_completed':
          qualifies = completedCourses >= badge.requirement_value;
          break;
        case 'exercises_completed':
          qualifies = completedExercises >= badge.requirement_value;
          break;
      }

      if (qualifies) {
        // Award the badge
        const result = await db.insert(userBadgesTable)
          .values({
            user_id: userId,
            badge_id: badge.id
          })
          .returning()
          .execute();

        newBadges.push(result[0]);
      }
    }

    return newBadges;
  } catch (error) {
    console.error('Badge checking and awarding failed:', error);
    throw error;
  }
}
