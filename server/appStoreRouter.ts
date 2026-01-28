/**
 * 应用市场tRPC路由
 * 提供应用列表、详情、安装、卸载等功能
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { appStoreApps, appStoreVersions, installedApps } from "../drizzle/schema";
import { eq, like, or, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { syncAllApps } from "./appStoreSyncService";
import { parseDockerCompose, serviceToDockerodeConfig } from "./dockerComposeParser";
import { pullImage, createContainer, startContainer } from "./dockerService";

export const appStoreRouter = router({
  /**
   * 获取应用列表
   */
  list: publicProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        type: z.string().optional(),
        tag: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, type, tag, search } = input;
      const offset = (page - 1) * pageSize;

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "数据库不可用",
        });
      }

      // 构建查询条件
      const conditions = [];
      if (type) {
        conditions.push(eq(appStoreApps.type, type));
      }
      if (search) {
        conditions.push(
          or(
            like(appStoreApps.name, `%${search}%`),
            like(appStoreApps.shortDesc, `%${search}%`)
          )
        );
      }
      if (tag) {
        // JSON字段查询需要使用LIKE
        conditions.push(like(appStoreApps.tags, `%${tag}%`));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // 查询应用列表
      const apps = await db
        .select()
        .from(appStoreApps)
        .where(whereClause)
        .orderBy(desc(appStoreApps.recommend), desc(appStoreApps.installCount))
        .limit(pageSize)
        .offset(offset);

      // 查询总数
      const totalResult = await db
        .select({ count: appStoreApps.id })
        .from(appStoreApps)
        .where(whereClause);
      const total = totalResult.length;

      return {
        apps: apps.map((app: any) => ({
          ...app,
          tags: app.tags ? JSON.parse(app.tags) : [],
          architectures: app.architectures ? JSON.parse(app.architectures) : [],
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /**
   * 获取应用详情
   */
  detail: publicProcedure
    .input(
      z.object({
        appKey: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "数据库不可用",
        });
      }

      const app = await db
        .select()
        .from(appStoreApps)
        .where(eq(appStoreApps.appKey, input.appKey))
        .limit(1);

      if (!app || app.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "应用不存在",
        });
      }

      // 获取应用的所有版本
      const versions = await db
        .select()
        .from(appStoreVersions)
        .where(eq(appStoreVersions.appKey, input.appKey))
        .orderBy(desc(appStoreVersions.createdAt));

      return {
        ...app[0],
        tags: app[0].tags ? JSON.parse(app[0].tags) : [],
        architectures: app[0].architectures ? JSON.parse(app[0].architectures) : [],
        versions: versions.map((v: any) => ({
          ...v,
          isStable: v.isStable === 1,
        })),
      };
    }),

  /**
   * 获取已安装应用列表
   */
  installed: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "数据库不可用",
      });
    }

    const apps = await db
      .select()
      .from(installedApps)
      .where(eq(installedApps.userId, ctx.user.id))
      .orderBy(desc(installedApps.installedAt));

    return apps.map((app: any) => ({
      ...app,
      portMappings: app.portMappings ? JSON.parse(app.portMappings) : {},
      envConfig: app.envConfig ? JSON.parse(app.envConfig) : {},
    }));
  }),

  /**
   * 安装应用
   * TODO: 实现Docker Compose部署逻辑
   */
  install: protectedProcedure
    .input(
      z.object({
        appKey: z.string(),
        version: z.string(),
        config: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "数据库不可用",
        });
      }

      // 检查应用是否存在
      const app = await db
        .select()
        .from(appStoreApps)
        .where(eq(appStoreApps.appKey, input.appKey))
        .limit(1);

      if (!app || app.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "应用不存在",
        });
      }

      // 检查版本是否存在
      const version = await db
        .select()
        .from(appStoreVersions)
        .where(
          and(
            eq(appStoreVersions.appKey, input.appKey),
            eq(appStoreVersions.version, input.version)
          )
        )
        .limit(1);

      if (!version || version.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "应用版本不存在",
        });
      }

      // 生成容器名称
      const containerName = `${input.appKey}_${ctx.user.id}_${Date.now()}`;

      // 创建安装记录
      const result = await db.insert(installedApps).values({
        userId: ctx.user.id,
        appKey: input.appKey,
        version: input.version,
        containerName,
        status: "installing",
        portMappings: JSON.stringify(input.config?.portMappings || {}),
        envConfig: JSON.stringify(input.config || {}),
        installPath: `/opt/urouteros/apps/${containerName}`,
      });

      // 实现Docker Compose部署
      try {
        const dockerComposeYaml = version[0].dockerCompose;
        if (!dockerComposeYaml) {
          throw new Error("应用版本缺少docker-compose.yml配置");
        }

        // 1. 解析docker-compose.yml
        const parsed = parseDockerCompose(dockerComposeYaml);
        if (parsed.services.length === 0) {
          throw new Error("docker-compose.yml中没有定义服务");
        }

        // 只处理第一个服务(大多数1Panel应用只有一个主服务)
        const mainService = parsed.services[0];

        // 2. 合并用户配置的环境变量
        if (input.config?.environment) {
          Object.assign(mainService.environment, input.config.environment);
        }

        // 3. 合并用户配置的端口映射
        if (input.config?.ports) {
          mainService.ports = input.config.ports.map((p: any) => ({
            host: p.host || p.hostPort,
            container: p.container || p.containerPort,
            protocol: p.protocol || "tcp",
          }));
        }

        // 4. 设置容器名称
        mainService.containerName = containerName;

        // 5. 拉取镜像
        console.log(`Pulling image: ${mainService.image}`);
        await pullImage(mainService.image);

        // 6. 创建容器
        const containerConfig = serviceToDockerodeConfig(mainService);
        console.log(`Creating container: ${containerName}`);
        const container = await createContainer(containerConfig);

        // 7. 启动容器
        console.log(`Starting container: ${containerName}`);
        await startContainer(container.id);

        // 8. 更新安装状态
        await db
          .update(installedApps)
          .set({
            status: "running",
            containerId: container.id,
            portMappings: JSON.stringify(
              mainService.ports.map((p) => ({
                host: p.host,
                container: p.container,
                protocol: p.protocol || "tcp",
              }))
            ),
          })
          .where(eq(installedApps.containerName, containerName));

        console.log(`✓ Application ${input.appKey} installed successfully`);
      } catch (error) {
        console.error(`Failed to install ${input.appKey}:`, error);
        
        // 更新安装状态为失败
        await db
          .update(installedApps)
          .set({
            status: "failed",
          })
          .where(eq(installedApps.containerName, containerName));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `应用安装失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }

      // 更新安装次数
      const currentInstallCount = app[0].installCount ?? 0;
      await db
        .update(appStoreApps)
        .set({
          installCount: currentInstallCount + 1,
        })
        .where(eq(appStoreApps.appKey, input.appKey));

      return {
        id: 1, // TODO: 使用实际的insertId
        containerName,
        message: "应用正在安装中,请稍候...",
      };
    }),

  /**
   * 卸载应用
   * TODO: 实现Docker Compose清理逻辑
   */
  uninstall: protectedProcedure
    .input(
      z.object({
        installedId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "数据库不可用",
        });
      }

      // 检查应用是否存在且属于当前用户
      const app = await db
        .select()
        .from(installedApps)
        .where(
          and(
            eq(installedApps.id, input.installedId),
            eq(installedApps.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!app || app.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "应用不存在或无权限",
        });
      }

      // 实现Docker Compose清理
      try {
        const containerId = app[0].containerId;
        if (containerId) {
          // 1. 停止并删除容器
          const { stopContainer, removeContainer } = await import("./dockerService");
          
          try {
            await stopContainer(containerId);
            console.log(`Stopped container: ${containerId}`);
          } catch (error) {
            console.warn(`Failed to stop container: ${error}`);
          }

          try {
            await removeContainer(containerId);
            console.log(`Removed container: ${containerId}`);
          } catch (error) {
            console.warn(`Failed to remove container: ${error}`);
          }
        }

        // 2. 删除安装记录
        await db.delete(installedApps).where(eq(installedApps.id, input.installedId));

        console.log(`✓ Application ${app[0].appKey} uninstalled successfully`);
      } catch (error) {
        console.error(`Failed to uninstall application:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `应用卸载失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }

      return {
        message: "应用已卸载",
      };
    }),

  /**
   * 应用操作(启动/停止/重启)
   * TODO: 实现Docker Compose控制逻辑
   */
  control: protectedProcedure
    .input(
      z.object({
        installedId: z.number(),
        action: z.enum(["start", "stop", "restart"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "数据库不可用",
        });
      }

      // 检查应用是否存在且属于当前用户
      const app = await db
        .select()
        .from(installedApps)
        .where(
          and(
            eq(installedApps.id, input.installedId),
            eq(installedApps.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!app || app.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "应用不存在或无权限",
        });
      }

      // 实现Docker Compose控制
      try {
        const containerId = app[0].containerId;
        if (!containerId) {
          throw new Error("应用未关联到容器");
        }

        const { startContainer, stopContainer, restartContainer } = await import("./dockerService");

        // 1. 执行对应的Docker操作
        switch (input.action) {
          case "start":
            await startContainer(containerId);
            console.log(`Started container: ${containerId}`);
            break;
          case "stop":
            await stopContainer(containerId);
            console.log(`Stopped container: ${containerId}`);
            break;
          case "restart":
            await restartContainer(containerId);
            console.log(`Restarted container: ${containerId}`);
            break;
        }

        // 2. 更新应用状态
        const statusMap = {
          start: "running" as const,
          stop: "stopped" as const,
          restart: "running" as const,
        };

        await db
          .update(installedApps)
          .set({
            status: statusMap[input.action],
          })
          .where(eq(installedApps.id, input.installedId));

        console.log(`✓ Application ${app[0].appKey} ${input.action} successfully`);
      } catch (error) {
        console.error(`Failed to ${input.action} application:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `应用操作失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }

      return {
        message: `应用${input.action === "start" ? "已启动" : input.action === "stop" ? "已停止" : "已重启"}`,
      };
    }),

  /**
   * 同步应用仓库
   * TODO: 实现从1Panel GitHub仓库同步应用
   */
  syncRepo: protectedProcedure.mutation(async ({ ctx }) => {
    // 仅管理员可以同步
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "仅管理员可以执行此操作",
      });
    }

    try {
      const result = await syncAllApps();
      return {
        message: `同步完成: ${result.success}个成功, ${result.failed}个失败, 总计${result.total}个应用`,
        ...result,
      };
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `同步失败: ${error.message}`,
      });
    }
  }),
});
