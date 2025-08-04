
import { db } from '../db';
import { usersTable, userBadgesTable, userProgressTable, coursesTable } from '../db/schema';
import { eq, desc, count, sql } from 'drizzle-orm';

interface LeaderboardEntry {
  userId: number;
  username: string;
  totalPoints: number;
  badgeCount: number;
  coursesCompleted: number;
}

export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    // Get users with their badge counts and course completion counts
    const results = await db
      .select({
        userId: usersTable.id,
        username: usersTable.username,
        totalPoints: usersTable.total_points,
        badgeCount: sql<number>`COALESCE(${count(userBadgesTable.id)}, 0)`,
        coursesCompleted: sql<number>`COALESCE(COUNT(DISTINCT CASE WHEN ${userProgressTable.status} = 'completed' AND ${userProgressTable.lesson_id} IS NULL AND ${userProgressTable.exercise_id} IS NULL AND ${userProgressTable.quiz_id} IS NULL THEN ${userProgressTable.course_id} END), 0)`
      })
      .from(usersTable)
      .leftJoin(userBadgesTable, eq(usersTable.id, userBadgesTable.user_id))
      .leftJoin(userProgressTable, eq(usersTable.id, userProgressTable.user_id))
      .groupBy(usersTable.id, usersTable.username, usersTable.total_points)
      .orderBy(desc(usersTable.total_points))
      .limit(limit)
      .execute();

    return results.map(result => ({
      userId: result.userId,
      username: result.username,
      totalPoints: result.totalPoints,
      badgeCount: Number(result.badgeCount),
      coursesCompleted: Number(result.coursesCompleted)
    }));
  } catch (error) {
    console.error('Leaderboard fetch failed:', error);
    throw error;
  }
}
