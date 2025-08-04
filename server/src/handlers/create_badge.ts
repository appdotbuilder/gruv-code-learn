
import { db } from '../db';
import { badgesTable } from '../db/schema';
import { type CreateBadgeInput, type Badge } from '../schema';

export const createBadge = async (input: CreateBadgeInput): Promise<Badge> => {
  try {
    // Insert badge record
    const result = await db.insert(badgesTable)
      .values({
        name: input.name,
        description: input.description,
        icon: input.icon,
        requirement_type: input.requirement_type,
        requirement_value: input.requirement_value
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Badge creation failed:', error);
    throw error;
  }
};
