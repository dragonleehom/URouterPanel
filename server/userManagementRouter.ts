import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { localUsers } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./services/localAuthService";
import { TRPCError } from "@trpc/server";

export const userManagementRouter = router({
  /**
   * 获取所有用户列表
   */
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("数据库连接失败");

    const users = await db
      .select({
        id: localUsers.id,
        username: localUsers.username,
        role: localUsers.role,
        enabled: localUsers.enabled,
        lastLoginAt: localUsers.lastLoginAt,
        lastLoginIp: localUsers.lastLoginIp,
        failedLoginAttempts: localUsers.failedLoginAttempts,
        lockedUntil: localUsers.lockedUntil,
        createdAt: localUsers.createdAt,
      })
      .from(localUsers);

    return users;
  }),

  /**
   * 创建新用户
   */
  create: publicProcedure
    .input(
      z.object({
        username: z.string().min(3, "用户名至少3个字符").max(64),
        password: z.string().min(6, "密码至少6个字符"),
        role: z.enum(["admin", "user"]).default("user"),
        enabled: z.number().min(0).max(1).default(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("数据库连接失败");

      // 检查用户名是否已存在
      const existing = await db
        .select()
        .from(localUsers)
        .where(eq(localUsers.username, input.username))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "用户名已存在",
        });
      }

      // 创建用户
      const passwordHash = await hashPassword(input.password);
      const [result] = await db.insert(localUsers).values({
        username: input.username,
        passwordHash,
        role: input.role,
        enabled: input.enabled,
      });

      return { success: true, id: result.insertId };
    }),

  /**
   * 更新用户信息
   */
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        username: z.string().min(3).max(64).optional(),
        role: z.enum(["admin", "user"]).optional(),
        enabled: z.number().min(0).max(1).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("数据库连接失败");

      const { id, ...updates } = input;

      // 如果更新用户名,检查是否已存在
      if (updates.username) {
        const existing = await db
          .select()
          .from(localUsers)
          .where(eq(localUsers.username, updates.username))
          .limit(1);

        if (existing.length > 0 && existing[0].id !== id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "用户名已存在",
          });
        }
      }

      await db
        .update(localUsers)
        .set(updates)
        .where(eq(localUsers.id, id));

      return { success: true };
    }),

  /**
   * 删除用户
   */
  delete: publicProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("数据库连接失败");

      await db
        .delete(localUsers)
        .where(eq(localUsers.id, input.id));

      return { success: true };
    }),

  /**
   * 修改密码
   */
  changePassword: publicProcedure
    .input(
      z.object({
        id: z.number(),
        newPassword: z.string().min(6, "密码至少6个字符"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("数据库连接失败");

      const passwordHash = await hashPassword(input.newPassword);

      await db
        .update(localUsers)
        .set({
          passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
        })
        .where(eq(localUsers.id, input.id));

      return { success: true };
    }),
});
