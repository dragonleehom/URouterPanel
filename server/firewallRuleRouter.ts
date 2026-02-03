/**
 * 防火墙自定义规则路由器
 * 提供防火墙规则配置的API接口
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { firewallRules } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { applyFirewallRules, validateIpOrCIDR, validatePort } from "./services/appliers/firewallRuleApplier";

export const firewallRuleRouter = router({
  /**
   * 获取所有防火墙规则
   */
  getAll: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return await db.select().from(firewallRules);
    }),

  /**
   * 创建防火墙规则
   */
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      action: z.enum(["accept", "reject", "drop"]),
      protocol: z.enum(["tcp", "udp", "icmp", "all"]).optional().default("all"),
      sourceZone: z.string().optional(),
      sourceIp: z.string().optional(),
      sourcePort: z.string().optional(),
      destZone: z.string().optional(),
      destIp: z.string().optional(),
      destPort: z.string().optional(),
      priority: z.number().optional().default(0),
      description: z.string().optional(),
      enabled: z.number().optional().default(1),
    }))
    .mutation(async ({ input }) => {
      // 验证IP地址格式
      if (input.sourceIp && !validateIpOrCIDR(input.sourceIp)) {
        throw new Error('无效的源IP地址格式');
      }
      if (input.destIp && !validateIpOrCIDR(input.destIp)) {
        throw new Error('无效的目标IP地址格式');
      }

      // 验证端口格式
      if (input.sourcePort && !validatePort(input.sourcePort)) {
        throw new Error('无效的源端口格式');
      }
      if (input.destPort && !validatePort(input.destPort)) {
        throw new Error('无效的目标端口格式');
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(firewallRules).values({
        ...input,
        pendingChanges: 1,
      });
      return { success: true, message: '防火墙规则已保存(未应用)' };
    }),

  /**
   * 更新防火墙规则
   */
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      action: z.enum(["accept", "reject", "drop"]).optional(),
      protocol: z.enum(["tcp", "udp", "icmp", "all"]).optional(),
      sourceZone: z.string().optional(),
      sourceIp: z.string().optional(),
      sourcePort: z.string().optional(),
      destZone: z.string().optional(),
      destIp: z.string().optional(),
      destPort: z.string().optional(),
      priority: z.number().optional(),
      description: z.string().optional(),
      enabled: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(firewallRules).set({
        ...data,
        pendingChanges: 1,
      }).where(eq(firewallRules.id, id));
      return { success: true, message: '防火墙规则已更新(未应用)' };
    }),

  /**
   * 删除防火墙规则
   */
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(firewallRules).where(eq(firewallRules.id, input.id));
      return { success: true, message: '防火墙规则已删除(需应用配置)' };
    }),

  /**
   * 应用所有防火墙规则到系统
   */
  applyAll: publicProcedure
    .mutation(async () => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const rules = await db.select().from(firewallRules);
        const result = await applyFirewallRules(rules);

        if (result.success) {
          for (const rule of rules) {
            await db.update(firewallRules).set({
              pendingChanges: 0,
              lastAppliedAt: new Date(),
              applyStatus: 'success',
              applyError: null,
            }).where(eq(firewallRules.id, rule.id));
          }
        }

        return result;
      } catch (error) {
        console.error('Failed to apply firewall rules:', error);
        return {
          success: false,
          message: `应用失败: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }),

  /**
   * 切换规则启用状态
   */
  toggleEnabled: publicProcedure
    .input(z.object({ id: z.number(), enabled: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(firewallRules).set({
        enabled: input.enabled,
        pendingChanges: 1,
      }).where(eq(firewallRules.id, input.id));
      return { success: true, message: '规则状态已更新(需应用配置)' };
    }),
});
