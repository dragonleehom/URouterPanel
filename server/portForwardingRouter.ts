/**
 * 端口转发路由器
 * 提供端口转发规则配置的API接口
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { portForwardingRules } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { applyPortForwardingRules, validateIpAddress, validatePort, getCurrentNatRules } from "./services/appliers/portForwardingApplier";

export const portForwardingRouter = router({
  /**
   * 获取所有端口转发规则
   */
  getAll: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return await db.select().from(portForwardingRules);
    }),

  /**
   * 根据ID获取端口转发规则
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(portForwardingRules).where(eq(portForwardingRules.id, input.id));
      return result[0] || null;
    }),

  /**
   * 获取当前系统NAT规则
   */
  getCurrentNatRules: publicProcedure
    .query(async () => {
      const rules = await getCurrentNatRules();
      return { rules };
    }),

  /**
   * 创建端口转发规则(仅保存到数据库)
   */
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      protocol: z.enum(["tcp", "udp", "both"]),
      sourceZone: z.string().optional().default("wan"),
      externalPort: z.string(),
      internalIp: z.string(),
      internalPort: z.string(),
      description: z.string().optional(),
      enabled: z.number().optional().default(1),
    }))
    .mutation(async ({ input }) => {
      // 验证内部IP地址格式
      if (!validateIpAddress(input.internalIp)) {
        throw new Error('无效的内部IP地址格式');
      }

      // 验证端口格式
      if (!validatePort(input.externalPort)) {
        throw new Error('无效的外部端口格式(应为1-65535或范围如8080-8090)');
      }

      if (!validatePort(input.internalPort)) {
        throw new Error('无效的内部端口格式(应为1-65535或范围如8080-8090)');
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(portForwardingRules).values({
        ...input,
        pendingChanges: 1,
      });
      return { success: true, message: '端口转发规则已保存(未应用)' };
    }),

  /**
   * 更新端口转发规则(仅保存到数据库)
   */
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      protocol: z.enum(["tcp", "udp", "both"]).optional(),
      sourceZone: z.string().optional(),
      externalPort: z.string().optional(),
      internalIp: z.string().optional(),
      internalPort: z.string().optional(),
      description: z.string().optional(),
      enabled: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      // 验证内部IP地址格式
      if (data.internalIp && !validateIpAddress(data.internalIp)) {
        throw new Error('无效的内部IP地址格式');
      }

      // 验证端口格式
      if (data.externalPort && !validatePort(data.externalPort)) {
        throw new Error('无效的外部端口格式');
      }

      if (data.internalPort && !validatePort(data.internalPort)) {
        throw new Error('无效的内部端口格式');
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(portForwardingRules).set({
        ...data,
        pendingChanges: 1,
      }).where(eq(portForwardingRules.id, id));
      return { success: true, message: '端口转发规则已更新(未应用)' };
    }),

  /**
   * 删除端口转发规则
   */
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(portForwardingRules).where(eq(portForwardingRules.id, input.id));
      return { success: true, message: '端口转发规则已删除(需应用配置)' };
    }),

  /**
   * 应用所有端口转发规则到系统
   */
  applyAll: publicProcedure
    .mutation(async () => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // 获取所有端口转发规则
        const rules = await db.select().from(portForwardingRules);

        // 应用到系统
        const result = await applyPortForwardingRules(rules);

        if (result.success) {
          // 标记所有规则为已应用
          for (const rule of rules) {
            await db.update(portForwardingRules).set({
              pendingChanges: 0,
              lastAppliedAt: new Date(),
              applyStatus: 'success',
              applyError: null,
            }).where(eq(portForwardingRules.id, rule.id));
          }
        }

        return result;
      } catch (error) {
        console.error('Failed to apply port forwarding rules:', error);
        return {
          success: false,
          message: `应用失败: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }),

  /**
   * 获取待应用的规则数量
   */
  getPendingCount: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const pending = await db.select().from(portForwardingRules).where(eq(portForwardingRules.pendingChanges, 1));
      return { count: pending.length };
    }),

  /**
   * 切换规则启用状态
   */
  toggleEnabled: publicProcedure
    .input(z.object({ id: z.number(), enabled: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(portForwardingRules).set({
        enabled: input.enabled,
        pendingChanges: 1,
      }).where(eq(portForwardingRules.id, input.id));
      return { success: true, message: '规则状态已更新(需应用配置)' };
    }),
});
