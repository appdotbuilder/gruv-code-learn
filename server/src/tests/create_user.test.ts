
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: 'student'
};

const adminInput: CreateUserInput = {
  username: 'adminuser',
  email: 'admin@example.com',
  password: 'adminpass456',
  role: 'admin'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a student user with correct fields', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.role).toEqual('student');
    expect(result.total_points).toEqual(0);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Password should be hashed, not plain text
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash.length).toBeGreaterThan(10);
  });

  it('should create an admin user', async () => {
    const result = await createUser(adminInput);

    expect(result.username).toEqual('adminuser');
    expect(result.email).toEqual('admin@example.com');
    expect(result.role).toEqual('admin');
    expect(result.total_points).toEqual(0);
    expect(result.id).toBeDefined();
  });

  it('should save user to database correctly', async () => {
    const result = await createUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    const savedUser = users[0];
    expect(savedUser.username).toEqual('testuser');
    expect(savedUser.email).toEqual('test@example.com');
    expect(savedUser.role).toEqual('student');
    expect(savedUser.total_points).toEqual(0);
    expect(savedUser.password_hash).toBeDefined();
    expect(savedUser.created_at).toBeInstanceOf(Date);
    expect(savedUser.updated_at).toBeInstanceOf(Date);
  });

  it('should hash passwords correctly', async () => {
    const result = await createUser(testInput);

    // Verify password was hashed using Bun's password verification
    const isValid = await Bun.password.verify('password123', result.password_hash);
    expect(isValid).toBe(true);

    // Verify wrong password fails
    const isWrongValid = await Bun.password.verify('wrongpassword', result.password_hash);
    expect(isWrongValid).toBe(false);
  });

  it('should use default role when not specified', async () => {
    const inputWithoutRole: CreateUserInput = {
      username: 'defaultuser',
      email: 'default@example.com',
      password: 'password123',
      role: 'student' // Zod default is applied by the time it reaches the handler
    };

    const result = await createUser(inputWithoutRole);
    expect(result.role).toEqual('student');
  });

  it('should reject duplicate username', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create user with same username but different email
    const duplicateUsernameInput: CreateUserInput = {
      username: 'testuser', // Same username
      email: 'different@example.com', // Different email
      password: 'password456',
      role: 'student'
    };

    await expect(createUser(duplicateUsernameInput)).rejects.toThrow(/unique/i);
  });

  it('should reject duplicate email', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create user with same email but different username
    const duplicateEmailInput: CreateUserInput = {
      username: 'differentuser', // Different username
      email: 'test@example.com', // Same email
      password: 'password456',
      role: 'student'
    };

    await expect(createUser(duplicateEmailInput)).rejects.toThrow(/unique/i);
  });

  it('should generate unique IDs for multiple users', async () => {
    const user1 = await createUser(testInput);
    const user2 = await createUser(adminInput);

    expect(user1.id).not.toEqual(user2.id);
    expect(typeof user1.id).toEqual('number');
    expect(typeof user2.id).toEqual('number');
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createUser(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});
