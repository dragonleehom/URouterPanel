/**
 * 容器监控tRPC路由
 * 提供容器资源使用监控功能
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getContainerStats, listContainers } from "./dockerService";

export const containerMonitorRouter = router({
  /**
   * 获取单个容器的资源使用统计
   */
  getStats: protectedProcedure
    .input(
      z.object({
        containerId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const stats = await getContainerStats(input.containerId);
        return stats;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `获取容器统计信息失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  /**
   * 获取所有运行中容器的资源使用统计
   */
  getAllStats: protectedProcedure.query(async () => {
    try {
      const containers = await listContainers(false); // 只获取运行中的容器
      const statsPromises = containers.map(async (container) => {
        try {
          const stats = await getContainerStats(container.id);
          return {
            containerId: container.id,
            containerName: container.name,
            ...stats,
          };
        } catch (error) {
          console.error(`Failed to get stats for ${container.name}:`, error);
          return null;
        }
      });

      const allStats = await Promise.all(statsPromises);
      return allStats.filter((stat) => stat !== null);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `获取容器统计信息失败: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }),
});
