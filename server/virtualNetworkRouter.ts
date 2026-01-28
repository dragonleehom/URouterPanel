/**
 * 虚拟网络管理tRPC路由
 * 提供网络创建、拓扑管理、设备连接等API
 * 支持容器和虚拟机的统一网络配置
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  virtualNetworks,
  networkTopology,
  networkInterfaces,
  routingRules,
  natRules,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import * as networkManager from "./networkManager";
import * as trafficMonitor from "./networkTrafficMonitor";

export const virtualNetworkRouter = router({
  /**
   * 列出所有虚拟网络(包括数据库中的和系统中的)
   */
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // 获取数据库中的虚拟网络
    const dbNetworks = await db.select().from(virtualNetworks);
    
    // 获取系统中的网桥设备
    const systemBridges = await networkManager.listBridges();
    
    // 合并结果,标记系统网桥
    const dbBridgeNames = new Set(dbNetworks.map(n => n.bridgeName));
    const systemOnlyBridges = systemBridges
      .filter(b => !dbBridgeNames.has(b.name))
      .map(b => ({
        id: -1, // 系统网桥使用负数ID
        name: b.name,
        description: `系统网桥 (${b.state})`,
        type: 'bridge' as const,
        subnet: b.addresses[0] || '',
        gateway: b.addresses[0]?.split('/')[0] || '',
        bridgeName: b.name,
        vlanId: null,
        dhcpEnabled: false,
        dhcpRange: null,
        dnsServers: null,
        status: b.state,
        createdAt: new Date(),
        updatedAt: new Date(),
        isSystemBridge: true, // 标记为系统网桥
      }));
    
    // 合并并标记数据库网络
    const allNetworks = [
      ...dbNetworks.map(n => ({ ...n, isSystemBridge: false })),
      ...systemOnlyBridges,
    ];
    
    return allNetworks;
  }),

  /**
   * 创建虚拟网络
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        type: z.enum(["bridge", "nat", "routed", "isolated"]),
        subnet: z.string(), // CIDR格式
        gateway: z.string(),
        vlanId: z.number().optional(),
        dhcpEnabled: z.boolean().default(true),
        dhcpRange: z.string().optional(),
        dnsServers: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // 验证CIDR格式
      if (!networkManager.isValidCIDR(input.subnet)) {
        throw new Error("Invalid subnet CIDR format");
      }

      // 验证网关IP
      if (!networkManager.isValidIP(input.gateway)) {
        throw new Error("Invalid gateway IP address");
      }

      // 生成Bridge名称
      const bridgeName = networkManager.generateBridgeName(input.name);

      try {
        // 创建Linux Bridge
        await networkManager.createBridge(bridgeName);

        // 配置IP地址
        await networkManager.configureBridgeIP(bridgeName, input.gateway, input.subnet);

        // 如果是NAT类型,配置NAT规则
        if (input.type === "nat") {
          await networkManager.configureNAT(bridgeName, input.subnet);
        }

        // 保存到数据库
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const [network] = await db.insert(virtualNetworks).values({
          name: input.name,
          description: input.description,
          type: input.type,
          subnet: input.subnet,
          gateway: input.gateway,
          vlanId: input.vlanId,
          bridgeName,
          dhcpEnabled: input.dhcpEnabled ? 1 : 0,
          dhcpRange: input.dhcpRange,
          dnsServers: input.dnsServers ? JSON.stringify(input.dnsServers) : null,
          status: "active",
        });

        return {
          success: true,
          message: "Virtual network created successfully",
          networkId: network.insertId,
          bridgeName,
        };
      } catch (error: any) {
        console.error("Failed to create virtual network:", error);
        throw new Error(`Network creation failed: ${error.message}`);
      }
    }),

  /**
   * 删除虚拟网络
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      // 查询网络信息
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [network] = await db.select().from(virtualNetworks).where(eq(virtualNetworks.id, input.id));

      if (!network) {
        throw new Error("Network not found");
      }

      try {
        // 删除NAT规则(如果存在)
        if (network.type === "nat" && network.subnet) {
          await networkManager.removeNAT(network.subnet);
        }

        // 删除Linux Bridge
        if (network.bridgeName) {
          await networkManager.deleteBridge(network.bridgeName);
        }

        // 删除数据库记录
        await db.delete(virtualNetworks).where(eq(virtualNetworks.id, input.id));
        await db.delete(networkTopology).where(eq(networkTopology.networkId, input.id));
        await db.delete(networkInterfaces).where(eq(networkInterfaces.networkId, input.id));

        return { success: true, message: "Virtual network deleted successfully" };
      } catch (error: any) {
        console.error("Failed to delete virtual network:", error);
        throw new Error(`Network deletion failed: ${error.message}`);
      }
    }),

  /**
   * 获取网络拓扑数据
   */
  getTopology: protectedProcedure
    .input(z.object({ networkId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [topology] = await db
        .select()
        .from(networkTopology)
        .where(eq(networkTopology.networkId, input.networkId));

      if (!topology) {
        // 返回空拓扑
        return {
          nodes: [],
          edges: [],
        };
      }

      return JSON.parse(topology.topologyData);
    }),

  /**
   * 保存网络拓扑数据
   */
  saveTopology: protectedProcedure
    .input(
      z.object({
        networkId: z.number(),
        topologyData: z.object({
          nodes: z.array(z.any()),
          edges: z.array(z.any()),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const topologyJson = JSON.stringify(input.topologyData);

      // 检查是否已存在
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [existing] = await db
        .select()
        .from(networkTopology)
        .where(eq(networkTopology.networkId, input.networkId));

      if (existing) {
        // 更新
        await db
          .update(networkTopology)
          .set({ topologyData: topologyJson })
          .where(eq(networkTopology.networkId, input.networkId));
      } else {
        // 插入
        await db.insert(networkTopology).values({
          networkId: input.networkId,
          topologyData: topologyJson,
        });
      }

      return { success: true, message: "Topology saved successfully" };
    }),

  /**
   * 获取物理网卡列表
   */
  getPhysicalNICs: protectedProcedure.query(async () => {
    const nics = await networkManager.getPhysicalNICs();
    return nics;
  }),

  /**
   * 将物理网卡连接到虚拟网络
   */
  attachPhysicalNIC: protectedProcedure
    .input(
      z.object({
        networkId: z.number(),
        nicName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [network] = await db.select().from(virtualNetworks).where(eq(virtualNetworks.id, input.networkId));

      if (!network || !network.bridgeName) {
        throw new Error("Network not found");
      }

      try {
        await networkManager.attachNICToBridge(input.nicName, network.bridgeName);
        return { success: true, message: `NIC ${input.nicName} attached to network` };
      } catch (error: any) {
        throw new Error(`Failed to attach NIC: ${error.message}`);
      }
    }),

  /**
   * 从虚拟网络分离物理网卡
   */
  detachPhysicalNIC: protectedProcedure
    .input(z.object({ nicName: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await networkManager.detachNICFromBridge(input.nicName);
        return { success: true, message: `NIC ${input.nicName} detached from network` };
      } catch (error: any) {
        throw new Error(`Failed to detach NIC: ${error.message}`);
      }
    }),

  /**
   * 将容器连接到虚拟网络
   */
  attachContainer: protectedProcedure
    .input(
      z.object({
        networkId: z.number(),
        containerId: z.string(),
        ipAddress: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [network] = await db.select().from(virtualNetworks).where(eq(virtualNetworks.id, input.networkId));

      if (!network || !network.bridgeName) {
        throw new Error("Network not found");
      }

      try {
        await networkManager.attachContainerToNetwork(
          input.containerId,
          network.bridgeName,
          input.ipAddress
        );

        // 记录到数据库
        await db.insert(networkInterfaces).values({
          networkId: input.networkId,
          resourceType: "container",
          resourceId: input.containerId,
          ipAddress: input.ipAddress,
        });

        return { success: true, message: "Container attached to network" };
      } catch (error: any) {
        throw new Error(`Failed to attach container: ${error.message}`);
      }
    }),

  /**
   * 从虚拟网络分离容器
   */
  detachContainer: protectedProcedure
    .input(
      z.object({
        networkId: z.number(),
        containerId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [network] = await db.select().from(virtualNetworks).where(eq(virtualNetworks.id, input.networkId));

      if (!network || !network.bridgeName) {
        throw new Error("Network not found");
      }

      try {
        await networkManager.detachContainerFromNetwork(input.containerId, network.bridgeName);

        // 从数据库删除记录
        await db
          .delete(networkInterfaces)
          .where(
            and(
              eq(networkInterfaces.networkId, input.networkId),
              eq(networkInterfaces.resourceId, input.containerId)
            )
          );

        return { success: true, message: "Container detached from network" };
      } catch (error: any) {
        throw new Error(`Failed to detach container: ${error.message}`);
      }
    }),

  /**
   * 将虚拟机连接到虚拟网络
   */
  attachVM: protectedProcedure
    .input(
      z.object({
        networkId: z.number(),
        vmName: z.string(),
        ipAddress: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [network] = await db.select().from(virtualNetworks).where(eq(virtualNetworks.id, input.networkId));

      if (!network || !network.bridgeName) {
        throw new Error("Network not found");
      }

      try {
        // 记录到数据库
        await db.insert(networkInterfaces).values({
          networkId: input.networkId,
          resourceType: "vm",
          resourceId: input.vmName,
          ipAddress: input.ipAddress,
        });

        return { success: true, message: "VM attached to network", bridgeName: network.bridgeName };
      } catch (error: any) {
        throw new Error(`Failed to attach VM: ${error.message}`);
      }
    }),

  /**
   * 从虚拟网络分离VM
   */
  detachVM: protectedProcedure
    .input(
      z.object({
        networkId: z.number(),
        vmName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // 从数据库删除记录
        await db
          .delete(networkInterfaces)
          .where(
            and(
              eq(networkInterfaces.networkId, input.networkId),
              eq(networkInterfaces.resourceId, input.vmName)
            )
          );

        return { success: true, message: "VM detached from network" };
      } catch (error: any) {
        throw new Error(`Failed to detach VM: ${error.message}`);
      }
    }),

  /**
   * 获取网络的已连接资源
   */
  getConnectedResources: protectedProcedure
    .input(z.object({ networkId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const interfaces = await db
        .select()
        .from(networkInterfaces)
        .where(eq(networkInterfaces.networkId, input.networkId));

      return interfaces;
    }),

  /**
   * 获取资源的当前网络连接
   */
  getResourceNetwork: protectedProcedure
    .input(
      z.object({
        resourceId: z.string(),
        resourceType: z.enum(["container", "vm"]),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 查询网络连接
      const [networkInterface] = await db
        .select()
        .from(networkInterfaces)
        .where(
          and(
            eq(networkInterfaces.resourceId, input.resourceId),
            eq(networkInterfaces.resourceType, input.resourceType)
          )
        )
        .limit(1);

      if (!networkInterface) {
        return null;
      }

      // 获取网络详细信息
      const [network] = await db
        .select()
        .from(virtualNetworks)
        .where(eq(virtualNetworks.id, networkInterface.networkId));

      if (!network) {
        return null;
      }

      return {
        ...networkInterface,
        networkName: network.name,
        subnet: network.subnet,
        gateway: network.gateway,
        type: network.type,
      };
    }),

  /**
   * 更新容器网络连接
   */
  updateContainerNetwork: protectedProcedure
    .input(
      z.object({
        containerId: z.string(),
        newNetworkId: z.number(),
        ipAddress: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 获取新网络信息
      const [newNetwork] = await db
        .select()
        .from(virtualNetworks)
        .where(eq(virtualNetworks.id, input.newNetworkId));

      if (!newNetwork || !newNetwork.bridgeName) {
        throw new Error("New network not found");
      }

      try {
        // 查询当前网络连接
        const [currentInterface] = await db
          .select()
          .from(networkInterfaces)
          .where(
            and(
              eq(networkInterfaces.resourceId, input.containerId),
              eq(networkInterfaces.resourceType, "container")
            )
          )
          .limit(1);

        // 如果有旧网络,先分离
        if (currentInterface) {
          const [oldNetwork] = await db
            .select()
            .from(virtualNetworks)
            .where(eq(virtualNetworks.id, currentInterface.networkId));

          if (oldNetwork?.bridgeName) {
            await networkManager.detachContainerFromNetwork(
              input.containerId,
              oldNetwork.bridgeName
            );
          }

          // 删除旧记录
          await db
            .delete(networkInterfaces)
            .where(
              and(
                eq(networkInterfaces.resourceId, input.containerId),
                eq(networkInterfaces.resourceType, "container")
              )
            );
        }

        // 连接到新网络
        await networkManager.attachContainerToNetwork(
          input.containerId,
          newNetwork.bridgeName,
          input.ipAddress
        );

        // 保存新记录
        await db.insert(networkInterfaces).values({
          networkId: input.newNetworkId,
          resourceType: "container",
          resourceId: input.containerId,
          ipAddress: input.ipAddress,
        });

        return { success: true, message: "Container network updated successfully" };
      } catch (error: any) {
        throw new Error(`Failed to update container network: ${error.message}`);
      }
    }),

  /**
   * 更新虚拟机网络连接
   */
  updateVMNetwork: protectedProcedure
    .input(
      z.object({
        vmName: z.string(),
        newNetworkId: z.number(),
        ipAddress: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 获取新网络信息
      const [newNetwork] = await db
        .select()
        .from(virtualNetworks)
        .where(eq(virtualNetworks.id, input.newNetworkId));

      if (!newNetwork || !newNetwork.bridgeName) {
        throw new Error("New network not found");
      }

      try {
        // 查询当前网络连接
        const [currentInterface] = await db
          .select()
          .from(networkInterfaces)
          .where(
            and(
              eq(networkInterfaces.resourceId, input.vmName),
              eq(networkInterfaces.resourceType, "vm")
            )
          )
          .limit(1);

        // 如果有旧网络,删除记录
        if (currentInterface) {
          await db
            .delete(networkInterfaces)
            .where(
              and(
                eq(networkInterfaces.resourceId, input.vmName),
                eq(networkInterfaces.resourceType, "vm")
              )
            );
        }

        // 保存新记录
        await db.insert(networkInterfaces).values({
          networkId: input.newNetworkId,
          resourceType: "vm",
          resourceId: input.vmName,
          ipAddress: input.ipAddress,
        });

        return {
          success: true,
          message: "VM network updated successfully",
          bridgeName: newNetwork.bridgeName,
        };
      } catch (error: any) {
        throw new Error(`Failed to update VM network: ${error.message}`);
      }
    }),

  /**
   * 添加NAT规则
   */
  addNATRule: protectedProcedure
    .input(
      z.object({
        networkId: z.number(),
        ruleType: z.enum(["snat", "dnat", "masquerade"]),
        protocol: z.enum(["tcp", "udp", "all"]),
        sourcePort: z.number().optional(),
        destinationIp: z.string().optional(),
        destinationPort: z.number().optional(),
        targetIp: z.string().optional(),
        targetPort: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // 如果是DNAT(端口转发),应用iptables规则
      if (input.ruleType === "dnat" && input.sourcePort && input.targetIp && input.targetPort) {
        await networkManager.addPortForward(
          input.protocol,
          input.sourcePort,
          input.targetIp,
          input.targetPort
        );
      }

      // 保存到数据库
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(natRules).values({
        networkId: input.networkId,
        ruleType: input.ruleType,
        protocol: input.protocol,
        sourcePort: input.sourcePort,
        destinationIp: input.destinationIp,
        destinationPort: input.destinationPort,
        targetIp: input.targetIp,
        targetPort: input.targetPort,
        enabled: 1,
      });

      return { success: true, message: "NAT rule added successfully" };
    }),

  /**
   * 获取网络的NAT规则
   */
  getNATRules: protectedProcedure
    .input(z.object({ networkId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rules = await db.select().from(natRules).where(eq(natRules.networkId, input.networkId));
      return rules;
    }),

  /**
   * 获取网络的实时流量统计
   */
  getNetworkTraffic: protectedProcedure
    .input(z.object({ networkId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 获取网络信息
      const [network] = await db
        .select()
        .from(virtualNetworks)
        .where(eq(virtualNetworks.id, input.networkId));

      if (!network || !network.bridgeName) {
        throw new Error("Network not found or bridge not created");
      }

      // 采集流量数据
      const stats = await trafficMonitor.collectTrafficStats(network.bridgeName);
      
      if (!stats) {
        return null;
      }

      return stats;
    }),

  /**
   * 获取网络的历史流量数据
   */
  getNetworkTrafficHistory: protectedProcedure
    .input(
      z.object({
        networkId: z.number(),
        maxPoints: z.number().optional().default(60),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 获取网络信息
      const [network] = await db
        .select()
        .from(virtualNetworks)
        .where(eq(virtualNetworks.id, input.networkId));

      if (!network || !network.bridgeName) {
        throw new Error("Network not found or bridge not created");
      }

      // 获取历史数据
      const history = trafficMonitor.getTrafficHistory(
        network.bridgeName,
        input.maxPoints
      );

      return history;
    }),

  /**
   * 获取所有网络的流量概览
   */
  getAllNetworksTraffic: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 获取所有网络
    const networks = await db.select().from(virtualNetworks);

    // 采集每个网络的流量数据
    const trafficData = await Promise.all(
      networks.map(async (network) => {
        if (!network.bridgeName) {
          return {
            networkId: network.id,
            networkName: network.name,
            stats: null,
          };
        }

        const stats = await trafficMonitor.collectTrafficStats(network.bridgeName);
        return {
          networkId: network.id,
          networkName: network.name,
          stats,
        };
      })
    );

    return trafficData;
  }),
});
