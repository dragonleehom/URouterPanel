import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import * as localAuthService from "./services/localAuthService";
import { TRPCError } from "@trpc/server";

export const localAuthRouter = router({
  /**
   * 本地用户登录
   */
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1, "用户名不能为空"),
        password: z.string().min(1, "密码不能为空"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // 从请求头获取IP和User-Agent
        const ipAddress = ctx.req?.headers['x-forwarded-for'] as string || 
                         ctx.req?.headers['x-real-ip'] as string ||
                         ctx.req?.socket?.remoteAddress;
        const userAgent = ctx.req?.headers['user-agent'];

        const result = await localAuthService.login(
          input.username,
          input.password,
          ipAddress,
          userAgent
        );

        // 设置cookie
        if (ctx.res) {
          ctx.res.setHeader('Set-Cookie', [
            `auth_token=${result.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}` // 7天
          ]);
        }

        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: error.message || "登录失败",
        });
      }
    }),

  /**
   * 用户注销
   */
  logout: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await localAuthService.logout(input.token);
        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "注销失败",
        });
      }
    }),

  /**
   * 验证会话 - 从cookie中读取token
   */
  validateSession: publicProcedure
    .query(async ({ ctx }) => {
      try {
        // 从cookie中读取token
        const token = ctx.req?.headers?.cookie?.split(';').find(c => c.trim().startsWith('auth_token='))?.split('=')[1];
        if (!token) {
          return { valid: false, error: 'No token found' };
        }
        const user = await localAuthService.validateSession(token);
        return { valid: true, user };
      } catch (error: any) {
        return { valid: false, error: error.message };
      }
    }),

  /**
   * 获取当前用户信息
   */
  me: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const user = await localAuthService.validateSession(input.token);
        return user;
      } catch (error: any) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "未登录或会话已过期",
        });
      }
    }),

  /**
   * 获取用户的所有会话
   */
  getSessions: publicProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const sessions = await localAuthService.getUserSessions(input.userId);
      return sessions;
    }),

  /**
   * 强制注销用户的所有会话
   */
  revokeAllSessions: publicProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await localAuthService.revokeAllUserSessions(input.userId);
      return { success: true };
    }),

  /**
   * 清理过期会话(定时任务调用)
   */
  cleanupExpiredSessions: publicProcedure
    .mutation(async () => {
      await localAuthService.cleanupExpiredSessions();
      return { success: true };
    }),
});
