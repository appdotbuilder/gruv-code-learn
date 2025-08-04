
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { badgesTable } from '../db/schema';
import { type CreateBadgeInput } from '../schema';
import { getBadges } from '../handlers/get_badges';

describe('getBadges', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no badges exist', async () => {
    const result = await getBadges();

    expect(result).toEqual([]);
  });

  it('should return all badges', async () => {
    // Create test badges
    const testBadges: CreateBadgeInput[] = [
      {
        name: 'First Steps',
        description: 'Complete your first exercise',
        icon: 'trophy',
        requirement_type: 'exercises_completed',
        requirement_value: 1
      },
      {
        name: 'Point Master',
        description: 'Earn 100 points',
        icon: 'star',
        requirement_type: 'points',
        requirement_value: 100
      },
      {
        name: 'Course Completionist',
        description: 'Complete 5 courses',
        icon: 'graduation-cap',
        requirement_type: 'courses_completed',
        requirement_value: 5
      }
    ];

    await db.insert(badgesTable)
      .values(testBadges)
      .execute();

    const result = await getBadges();

    expect(result).toHaveLength(3);
    
    // Check first badge
    const firstBadge = result.find(badge => badge.name === 'First Steps');
    expect(firstBadge).toBeDefined();
    expect(firstBadge!.description).toEqual('Complete your first exercise');
    expect(firstBadge!.icon).toEqual('trophy');
    expect(firstBadge!.requirement_type).toEqual('exercises_completed');
    expect(firstBadge!.requirement_value).toEqual(1);
    expect(firstBadge!.id).toBeDefined();
    expect(firstBadge!.created_at).toBeInstanceOf(Date);

    // Check second badge
    const secondBadge = result.find(badge => badge.name === 'Point Master');
    expect(secondBadge).toBeDefined();
    expect(secondBadge!.requirement_type).toEqual('points');
    expect(secondBadge!.requirement_value).toEqual(100);

    // Check third badge
    const thirdBadge = result.find(badge => badge.name === 'Course Completionist');
    expect(thirdBadge).toBeDefined();
    expect(thirdBadge!.requirement_type).toEqual('courses_completed');
    expect(thirdBadge!.requirement_value).toEqual(5);
  });

  it('should return badges with all required fields', async () => {
    const testBadge: CreateBadgeInput = {
      name: 'Test Badge',
      description: 'A badge for testing',
      icon: 'medal',
      requirement_type: 'points',
      requirement_value: 50
    };

    await db.insert(badgesTable)
      .values(testBadge)
      .execute();

    const result = await getBadges();

    expect(result).toHaveLength(1);
    const badge = result[0];
    expect(badge.id).toBeDefined();
    expect(badge.name).toEqual('Test Badge');
    expect(badge.description).toEqual('A badge for testing');
    expect(badge.icon).toEqual('medal');
    expect(badge.requirement_type).toEqual('points');
    expect(badge.requirement_value).toEqual(50);
    expect(badge.created_at).toBeInstanceOf(Date);
  });
});
