
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testPassword = 'testpassword123';
  let testUser: any;

  beforeEach(async () => {
    // Create a test user with hashed password
    const hashedPassword = await Bun.password.hash(testPassword);
    const result = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: hashedPassword,
        role: 'student',
        total_points: 0
      })
      .returning()
      .execute();

    testUser = result[0];
  });

  it('should return user when credentials are valid', async () => {
    const input: LoginInput = {
      email: 'test@example.com',
      password: testPassword
    };

    const result = await loginUser(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testUser.id);
    expect(result!.username).toEqual('testuser');
    expect(result!.email).toEqual('test@example.com');
    expect(result!.role).toEqual('student');
    expect(result!.total_points).toEqual(0);
    expect(result!.password_hash).toEqual(testUser.password_hash);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when email does not exist', async () => {
    const input: LoginInput = {
      email: 'nonexistent@example.com',
      password: testPassword
    };

    const result = await loginUser(input);

    expect(result).toBeNull();
  });

  it('should return null when password is incorrect', async () => {
    const input: LoginInput = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    const result = await loginUser(input);

    expect(result).toBeNull();
  });

  it('should return null when password is empty', async () => {
    const input: LoginInput = {
      email: 'test@example.com',
      password: ''
    };

    const result = await loginUser(input);

    expect(result).toBeNull();
  });

  it('should handle case-sensitive email matching', async () => {
    const input: LoginInput = {
      email: 'TEST@EXAMPLE.COM', // Different case
      password: testPassword
    };

    const result = await loginUser(input);

    expect(result).toBeNull(); // Should not match due to case sensitivity
  });

  it('should work with admin role user', async () => {
    // Create admin user
    const adminPassword = 'adminpass123';
    const hashedAdminPassword = await Bun.password.hash(adminPassword);
    const adminResult = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: hashedAdminPassword,
        role: 'admin',
        total_points: 500
      })
      .returning()
      .execute();

    const input: LoginInput = {
      email: 'admin@example.com',
      password: adminPassword
    };

    const result = await loginUser(input);

    expect(result).not.toBeNull();
    expect(result!.role).toEqual('admin');
    expect(result!.username).toEqual('admin');
    expect(result!.total_points).toEqual(500);
  });
});
