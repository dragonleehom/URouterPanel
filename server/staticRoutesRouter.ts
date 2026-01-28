import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as staticRoutesService from "./services/staticRoutesService";

/**
 * 静态路由tRPC路由
 * 提供静态路由管理的API端点
 */

export const staticRoutesRouter = router({
  // 列出所有静态路由
  list: protectedProcedure.query(async () => {
    return await staticRoutesService.listStaticRoutes();
  }),

  // 获取单个静态路由
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await staticRoutesService.getStaticRoute(input.id);
    }),

  // 创建静态路由
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        interface: z.string().min(1).max(50),
        target: z.string().min(1).max(50),
        netmask: z.string().max(50).optional(),
        gateway: z.string().max(50).optional(),
        metric: z.number().default(0),
        mtu: z.number().optional(),
        table: z.string().max(50).optional(),
        type: z.enum(["unicast", "local", "broadcast", "multicast", "unreachable", "prohibit", "blackhole", "anycast"]).default("unicast"),
        enabled: z.number().default(1),
      })
    )
    .mutation(async ({ input }) => {
      return await staticRoutesService.createStaticRoute(input);
    }),

  // 更新静态路由
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        interface: z.string().min(1).max(50).optional(),
        target: z.string().min(1).max(50).optional(),
        netmask: z.string().max(50).optional(),
        gateway: z.string().max(50).optional(),
        metric: z.number().optional(),
        mtu: z.number().optional(),
        table: z.string().max(50).optional(),
        type: z.enum(["unicast", "local", "broadcast", "multicast", "unreachable", "prohibit", "blackhole", "anycast"]).optional(),
        enabled: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      return await staticRoutesService.updateStaticRoute(id, updates);
    }),

  // 删除静态路由
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await staticRoutesService.deleteStaticRoute(input.id);
      return { success: true };
    }),

  // 应用单个静态路由
  applyRoute: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const route = await staticRoutesService.getStaticRoute(input.id);
      if (!route) {
        throw new Error("Static route not found");
      }
      await staticRoutesService.applyStaticRoute(route);
      return { success: true };
    }),

  // 应用所有启用的静态路由
  applyAll: protectedProcedure.mutation(async () => {
    return await staticRoutesService.applyAllStaticRoutes();
  }),

  // 获取系统当前路由表
  getSystemRoutes: protectedProcedure.query(async () => {
    const routes = await staticRoutesService.getSystemRoutes();
    return { routes };
  }),
});
