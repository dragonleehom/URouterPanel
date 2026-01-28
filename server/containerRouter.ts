/**
 * 容器管理tRPC路由
 * 提供Docker容器和镜像管理功能
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as dockerService from "./dockerService";

export const containerRouter = router({
  /**
   * 检查Docker是否可用
   */
  checkDocker: publicProcedure.query(async () => {
    const available = await dockerService.isDockerAvailable();
    return { available };
  }),

  /**
   * 列出所有容器
   */
  listContainers: publicProcedure
    .input(
      z.object({
        all: z.boolean().optional().default(true),
      })
    )
    .query(async ({ input }) => {
      try {
        const containers = await dockerService.listContainers(input.all);
        return containers;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  /**
   * 获取容器详情
   */
  getContainer: publicProcedure
    .input(
      z.object({
        containerId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const info = await dockerService.getContainerInfo(input.containerId);
        return info;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  /**
   * 创建容器
   */
  createContainer: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        image: z.string(),
        env: z.array(z.string()).optional(),
        ports: z.record(z.string(), z.object({})).optional(),
        volumes: z.array(z.string()).optional(),
        cmd: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await dockerService.createContainer(input);
        return {
          success: true,
          message: "容器创建成功",
          ...result,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  /**
   * 启动容器
   */
  startContainer: protectedProcedure
    .input(
      z.object({
        containerId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await dockerService.startContainer(input.containerId);
        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  /**
   * 停止容器
   */
  stopContainer: protectedProcedure
    .input(
      z.object({
        containerId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await dockerService.stopContainer(input.containerId);
        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  /**
   * 重启容器
   */
  restartContainer: protectedProcedure
    .input(
      z.object({
        containerId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await dockerService.restartContainer(input.containerId);
        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  /**
   * 删除容器
   */
  removeContainer: protectedProcedure
    .input(
      z.object({
        containerId: z.string(),
        force: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await dockerService.removeContainer(
          input.containerId,
          input.force
        );
        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  /**
   * 获取容器日志
   */
  getContainerLogs: publicProcedure
    .input(
      z.object({
        containerId: z.string(),
        tail: z.number().optional().default(100),
      })
    )
    .query(async ({ input }) => {
      try {
        const logs = await dockerService.getContainerLogs(
          input.containerId,
          input.tail
        );
        return { logs };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  /**
   * 获取容器统计信息
   */
  getContainerStats: publicProcedure
    .input(
      z.object({
        containerId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const stats = await dockerService.getContainerStats(input.containerId);
        return stats;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  /**
   * 列出所有镜像
   */
  listImages: publicProcedure.query(async () => {
    try {
      const images = await dockerService.listImages();
      return images;
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
  }),

  /**
   * 拉取镜像
   */
  pullImage: protectedProcedure
    .input(
      z.object({
        imageName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await dockerService.pullImage(input.imageName);
        return {
          success: true,
          message: "镜像拉取成功",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  /**
   * 删除镜像
   */
  removeImage: protectedProcedure
    .input(
      z.object({
        imageId: z.string(),
        force: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await dockerService.removeImage(input.imageId, input.force);
        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  /**
   * Docker Compose相关API
   */

  // 创建Compose项目
  createComposeProject: publicProcedure
    .input(
      z.object({
        projectName: z.string(),
        composeContent: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await dockerService.createComposeProject(
          input.projectName,
          input.composeContent
        );
        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // 列出Compose项目
  listComposeProjects: publicProcedure.query(async () => {
    try {
      const projects = await dockerService.listComposeProjects();
      return projects;
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
  }),

  // 启动Compose项目
  startComposeProject: publicProcedure
    .input(
      z.object({
        projectName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await dockerService.startComposeProject(input.projectName);
        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // 停止Compose项目
  stopComposeProject: publicProcedure
    .input(
      z.object({
        projectName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await dockerService.stopComposeProject(input.projectName);
        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // 删除Compose项目
  removeComposeProject: publicProcedure
    .input(
      z.object({
        projectName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await dockerService.removeComposeProject(input.projectName);
        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // 获取Compose项目配置
  getComposeProjectConfig: publicProcedure
    .input(
      z.object({
        projectName: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const config = await dockerService.getComposeProjectConfig(input.projectName);
        return { config };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),
});
