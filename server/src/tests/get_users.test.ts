
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

const testUser1: CreateUserInput = {
  username: 'testuser1',
  email: 'test1@example.com',
  password: 'password123',
  role: 'student'
};

const testUser2: CreateUserInput = {
  username: 'testuser2',
  email: 'test2@example.com',
  password: 'password456',
  role: 'admin'
};

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users from database', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([
        {
          username: testUser1.username,
          email: testUser1.email,
          password_hash: testUser1.password, // In real app this would be hashed
          role: testUser1.role,
          total_points: 0
        },
        {
          username: testUser2.username,
          email: testUser2.email,
          password_hash: testUser2.password, // In real app this would be hashed
          role: testUser2.role,
          total_points: 0
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Check first user
    expect(result[0].username).toEqual('testuser1');
    expect(result[0].email).toEqual('test1@example.com');
    expect(result[0].role).toEqual('student');
    expect(result[0].total_points).toEqual(0);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Check second user
    expect(result[1].username).toEqual('testuser2');
    expect(result[1].email).toEqual('test2@example.com');
    expect(result[1].role).toEqual('admin');
    expect(result[1].total_points).toEqual(0);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should return users with different roles and points', async () => {
    // Create users with different total_points
    await db.insert(usersTable)
      .values([
        {
          username: 'student_user',
          email: 'student@example.com',
          password_hash: 'hash123',
          role: 'student',
          total_points: 150
        },
        {
          username: 'admin_user',
          email: 'admin@example.com',
          password_hash: 'hash456',
          role: 'admin',
          total_points: 0
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Find users by username for consistent testing
    const studentUser = result.find(user => user.username === 'student_user');
    const adminUser = result.find(user => user.username === 'admin_user');

    expect(studentUser).toBeDefined();
    expect(studentUser!.role).toEqual('student');
    expect(studentUser!.total_points).toEqual(150);

    expect(adminUser).toBeDefined();
    expect(adminUser!.role).toEqual('admin');
    expect(adminUser!.total_points).toEqual(0);
  });
});
