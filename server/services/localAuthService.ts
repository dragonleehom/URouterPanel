import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDb } from '../db';
import { localUsers, sessions } from '../../drizzle/schema';
import { eq, and, gt, sql } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'urouteros-default-secret-change-in-production';
const JWT_EXPIRES_IN = '7d'; // JWT token有效期7天
const SESSION_TIMEOUT = 15 * 60 * 1000; // 会话超时15分钟(毫秒)
const MAX_FAILED_ATTEMPTS = 5; // 最大失败登录次数
const LOCK_DURATION = 30 * 60 * 1000; // 锁定时长30分钟(毫秒)

/**
 * 密码哈希
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 生成JWT token
 */
export function generateToken(userId: number, username: string, role: string): string {
  return jwt.sign(
    { userId, username, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * 验证JWT token
 */
export function verifyToken(token: string): { userId: number; username: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string; role: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * 用户登录
 */
export async function login(username: string, password: string, ipAddress?: string, userAgent?: string) {
  // 1. 查找用户
  const db = await getDb();
  if (!db) throw new Error('数据库连接失败');
  
  const [user] = await db
    .select()
    .from(localUsers)
    .where(eq(localUsers.username, username))
    .limit(1);

  if (!user) {
    throw new Error('用户名或密码错误');
  }

  // 2. 检查用户是否被禁用
  if (!user.enabled) {
    throw new Error('用户已被禁用');
  }

  // 3. 检查用户是否被锁定
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new Error(`账户已被锁定,请在${remainingMinutes}分钟后重试`);
  }

  // 4. 验证密码
  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  
  if (!isPasswordValid) {
    // 密码错误,增加失败次数
    const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
    const updates: any = {
      failedLoginAttempts: newFailedAttempts,
    };

    // 如果失败次数达到上限,锁定账户
    if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      updates.lockedUntil = new Date(Date.now() + LOCK_DURATION);
    }

    await db
      .update(localUsers)
      .set(updates)
      .where(eq(localUsers.id, user.id));

    if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      throw new Error(`密码错误次数过多,账户已被锁定${LOCK_DURATION / 60000}分钟`);
    }

    throw new Error('用户名或密码错误');
  }

  // 5. 密码正确,重置失败次数和锁定状态
  await db
    .update(localUsers)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    })
    .where(eq(localUsers.id, user.id));

  // 6. 生成JWT token
  const token = generateToken(user.id, user.username, user.role);

  // 7. 创建会话记录
  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT);
  await db.insert(sessions).values({
    userId: user.id,
    token,
    ipAddress,
    userAgent,
    lastActivityAt: new Date(),
    expiresAt,
  });

  // 8. 返回用户信息和token
  return {
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    token,
    expiresAt,
  };
}

/**
 * 用户注销
 */
export async function logout(token: string) {
  const db = await getDb();
  if (!db) throw new Error('数据库连接失败');
  
  // 删除会话记录
  await db
    .delete(sessions)
    .where(eq(sessions.token, token));
}

/**
 * 验证会话
 */
export async function validateSession(token: string) {
  // 1. 验证JWT token
  const decoded = verifyToken(token);
  if (!decoded) {
    throw new Error('无效的token');
  }

  const db = await getDb();
  if (!db) throw new Error('数据库连接失败');

  // 2. 查找会话记录
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!session) {
    throw new Error('会话不存在');
  }

  // 3. 检查会话是否过期
  if (session.expiresAt < new Date()) {
    // 删除过期会话
    await db
      .delete(sessions)
      .where(eq(sessions.id, session.id));
    throw new Error('会话已过期');
  }

  // 4. 检查空闲超时
  const idleTime = Date.now() - session.lastActivityAt.getTime();
  if (idleTime > SESSION_TIMEOUT) {
    // 删除超时会话
    await db
      .delete(sessions)
      .where(eq(sessions.id, session.id));
    throw new Error('会话超时');
  }

  // 5. 更新最后活动时间
  await db
    .update(sessions)
    .set({ lastActivityAt: new Date() })
    .where(eq(sessions.id, session.id));

  // 6. 返回用户信息
  return {
    userId: decoded.userId,
    username: decoded.username,
    role: decoded.role,
  };
}

/**
 * 清理过期会话
 */
export async function cleanupExpiredSessions() {
  const db = await getDb();
  if (!db) return;
  
  await db
    .delete(sessions)
    .where(sql`${sessions.expiresAt} < NOW()`);
}

/**
 * 获取用户的所有会话
 */
export async function getUserSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        sql`${sessions.expiresAt} > NOW()`
      )
    );
}

/**
 * 删除用户的所有会话(强制注销)
 */
export async function revokeAllUserSessions(userId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .delete(sessions)
    .where(eq(sessions.userId, userId));
}
