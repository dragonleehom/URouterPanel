/**
 * 静态路由路由器
 * 提供静态路由配置的API接口
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { staticRoutes } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { applyStaticRoutes, validateCIDR, validateIpAddress, getCurrentRoutes } from "./services/appliers/staticRouteApplier";

export const staticRouteRouter = router({
  /**
   * 获取所有静态路由
   */
  getAll: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return await db.select().from(staticRoutes);
    }),

  /**
   * 根据ID获取静态路由
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(staticRoutes).where(eq(staticRoutes.id, input.id));
      return result[0] || null;
    }),

  /**
   * 获取当前系统路由表
   */
  getCurrentRoutes: publicProcedure
    .query(async () => {
      const routes = await getCurrentRoutes();
      return { routes };
    }),

  /**
   * 创建静态路由(仅保存到数据库)
   */
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      interface: z.string(),
      target: z.string(),
      netmask: z.string().optional(),
      gateway: z.string().optional(),
      metric: z.number().optional().default(0),
      mtu: z.number().optional(),
      table: z.string().optional(),
      type: z.enum(["unicast", "local", "broadcast", "multicast", "unreachable", "prohibit", "blackhole", "anycast"]).optional().default("unicast"),
      enabled: z.number().optional().default(1),
    }))
    .mutation(async ({ input }) => {
      // 验证目标网络格式(CIDR或IP地址)
      if (!validateCIDR(input.target) && !validateIpAddress(input.target)) {
        throw new Error('无效的目标网络格式(应为CIDR如192.168.1.0/24或IP地址)');
      }

      // 验证网关格式
      if (input.gateway && !validateIpAddress(input.gateway)) {
        throw new Error('无效的网关IP地址格式');
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(staticRoutes).values(input);
      return { success: true, message: '静态路由已保存(未应用)' };
    }),

  /**
   * 更新静态路由(仅保存到数据库)
   */
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      interface: z.string().optional(),
      target: z.string().optional(),
      netmask: z.string().optional(),
      gateway: z.string().optional(),
      metric: z.number().optional(),
      mtu: z.number().optional(),
      table: z.string().optional(),
      type: z.enum(["unicast", "local", "broadcast", "multicast", "unreachable", "prohibit", "blackhole", "anycast"]).optional(),
      enabled: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      // 验证目标网络格式
      if (data.target && !validateCIDR(data.target) && !validateIpAddress(data.target)) {
        throw new Error('无效的目标网络格式');
      }

      // 验证网关格式
      if (data.gateway && !validateIpAddress(data.gateway)) {
        throw new Error('无效的网关IP地址格式');
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(staticRoutes).set(data).where(eq(staticRoutes.id, id));
      return { success: true, message: '静态路由已更新(未应用)' };
    }),

  /**
   * 删除静态路由
   */
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(staticRoutes).where(eq(staticRoutes.id, input.id));
      return { success: true, message: '静态路由已删除(需应用配置)' };
    }),

  /**
   * 应用所有静态路由到系统
   */
  applyAll: publicProcedure
    .mutation(async () => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // 获取所有静态路由
        const routes = await db.select().from(staticRoutes);

        // 应用到系统
        const result = await applyStaticRoutes(routes);

        return result;
      } catch (error) {
        console.error('Failed to apply static routes:', error);
        return {
          success: false,
          message: `应用失败: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }),

  /**
   * 切换路由启用状态
   */
  toggleEnabled: publicProcedure
    .input(z.object({ id: z.number(), enabled: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(staticRoutes).set({ enabled: input.enabled }).where(eq(staticRoutes.id, input.id));
      return { success: true, message: '路由状态已更新(需应用配置)' };
    }),
});
