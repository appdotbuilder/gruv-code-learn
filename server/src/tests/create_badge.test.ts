
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { badgesTable } from '../db/schema';
import { type CreateBadgeInput } from '../schema';
import { createBadge } from '../handlers/create_badge';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateBadgeInput = {
  name: 'Test Badge',
  description: 'A badge for testing purposes',
  icon: 'test-icon.png',
  requirement_type: 'points',
  requirement_value: 100
};

describe('createBadge', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a badge', async () => {
    const result = await createBadge(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Badge');
    expect(result.description).toEqual(testInput.description);
    expect(result.icon).toEqual('test-icon.png');
    expect(result.requirement_type).toEqual('points');
    expect(result.requirement_value).toEqual(100);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save badge to database', async () => {
    const result = await createBadge(testInput);

    // Query to verify badge was saved
    const badges = await db.select()
      .from(badgesTable)
      .where(eq(badgesTable.id, result.id))
      .execute();

    expect(badges).toHaveLength(1);
    expect(badges[0].name).toEqual('Test Badge');
    expect(badges[0].description).toEqual(testInput.description);
    expect(badges[0].icon).toEqual('test-icon.png');
    expect(badges[0].requirement_type).toEqual('points');
    expect(badges[0].requirement_value).toEqual(100);
    expect(badges[0].created_at).toBeInstanceOf(Date);
  });

  it('should create badges with different requirement types', async () => {
    // Test courses_completed requirement type
    const coursesInput: CreateBadgeInput = {
      name: 'Course Master',
      description: 'Complete multiple courses',
      icon: 'courses-icon.png',
      requirement_type: 'courses_completed',
      requirement_value: 5
    };

    const coursesResult = await createBadge(coursesInput);
    expect(coursesResult.requirement_type).toEqual('courses_completed');
    expect(coursesResult.requirement_value).toEqual(5);

    // Test exercises_completed requirement type
    const exercisesInput: CreateBadgeInput = {
      name: 'Exercise Champion',
      description: 'Complete many exercises',
      icon: 'exercises-icon.png',
      requirement_type: 'exercises_completed',
      requirement_value: 50
    };

    const exercisesResult = await createBadge(exercisesInput);
    expect(exercisesResult.requirement_type).toEqual('exercises_completed');
    expect(exercisesResult.requirement_value).toEqual(50);
  });

  it('should enforce unique badge names', async () => {
    // Create first badge
    await createBadge(testInput);

    // Try to create another badge with the same name
    expect(createBadge(testInput)).rejects.toThrow(/unique/i);
  });
});
