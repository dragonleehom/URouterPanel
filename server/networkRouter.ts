/**
 * Docker网络管理tRPC路由
 * 提供网络创建、删除、查看和容器连接管理功能
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  listNetworks,
  createNetwork,
  removeNetwork,
  inspectNetwork,
  connectContainerToNetwork,
  disconnectContainerFromNetwork,
} from "./dockerService";

export const networkRouter = router({
  /**
   * 列出所有Docker网络
   */
  list: protectedProcedure.query(async () => {
    try {
      const networks = await listNetworks();
      return networks;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `获取网络列表失败: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }),

  /**
   * 创建Docker网络
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        driver: z.enum(["bridge", "host", "overlay", "macvlan"]).optional(),
        internal: z.boolean().optional(),
        subnet: z.string().optional(),
        gateway: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const network = await createNetwork(input);
        return network;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `创建网络失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  /**
   * 删除Docker网络
   */
  remove: protectedProcedure
    .input(
      z.object({
        networkId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await removeNetwork(input.networkId);
        return { message: "网络已删除" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `删除网络失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  /**
   * 获取网络详情
   */
  inspect: protectedProcedure
    .input(
      z.object({
        networkId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const network = await inspectNetwork(input.networkId);
        return network;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `获取网络详情失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  /**
   * 将容器连接到网络
   */
  connect: protectedProcedure
    .input(
      z.object({
        containerId: z.string(),
        networkId: z.string(),
        aliases: z.array(z.string()).optional(),
        ipv4Address: z.string().optional(),
        ipv6Address: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await connectContainerToNetwork(input.containerId, input.networkId, {
          aliases: input.aliases,
          ipv4Address: input.ipv4Address,
          ipv6Address: input.ipv6Address,
        });
        return { message: "容器已连接到网络" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `连接容器到网络失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  /**
   * 将容器从网络断开
   */
  disconnect: protectedProcedure
    .input(
      z.object({
        containerId: z.string(),
        networkId: z.string(),
        force: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await disconnectContainerFromNetwork(
          input.containerId,
          input.networkId,
          input.force
        );
        return { message: "容器已从网络断开" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `断开容器网络失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  /**
   * 获取网络拓扑数据
   * 返回网络和容器的节点及连接关系
   */
  topology: protectedProcedure.query(async () => {
    try {
      const networks = await listNetworks();
      const { listContainers } = await import("./dockerService");
      const containers = await listContainers();

      // 构建节点数据
      const nodes: Array<{
        id: string;
        type: "network" | "container";
        label: string;
        data: any;
      }> = [];

      // 构建边数据(连接关系)
      const edges: Array<{
        id: string;
        source: string;
        target: string;
      }> = [];

      // 添加网络节点
      networks.forEach((network) => {
        nodes.push({
          id: `network-${network.id}`,
          type: "network",
          label: network.name,
          data: {
            driver: network.driver,
            scope: network.scope,
            internal: network.internal,
          },
        });

        // 添加容器到网络的连接
        if (network.containers) {
          network.containers.forEach((containerId) => {
            edges.push({
              id: `edge-${network.id}-${containerId}`,
              source: `network-${network.id}`,
              target: `container-${containerId}`,
            });
          });
        }
      });

      // 添加容器节点
      containers.forEach((container) => {
        nodes.push({
          id: `container-${container.id}`,
          type: "container",
          label: container.name,
          data: {
            image: container.image,
            status: container.status,
            ports: container.ports,
          },
        });
      });

      return {
        nodes,
        edges,
      };
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `获取网络拓扑失败: ${error.message}`,
      });
    }
  }),
});
