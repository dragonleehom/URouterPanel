/**
 * 防火墙管理tRPC路由
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  listFirewallRules,
  addFirewallRule,
  updateFirewallRule,
  deleteFirewallRule,
  toggleFirewallRule,
  listPortForwardRules,
  addPortForwardRule,
  deletePortForwardRule,
  listNATRules,
  addNATRule,
  deleteNATRule,
  reloadAllRules,
  getFirewallStatus,
  listFirewallZones,
} from "./services/firewallService";

import {
  checkFirewalldStatus,
  listZones,
  getZoneInfo,
  getAllZonesInfo,
  bindInterfaceToZone,
  unbindInterfaceFromZone,
  getInterfaceZone,
  getZonePolicy,
  applyZonePolicy,
  reloadFirewall,
  getFirewallStatus as getFirewalldStatus,
} from "./services/firewalldService";

export const firewallRouter = router({
  listRules: publicProcedure.query(async () => {
    try {
      return await listFirewallRules();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `获取防火墙规则失败: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }),

  addRule: publicProcedure
    .input(
      z.object({
        name: z.string(),
        chain: z.enum(["INPUT", "OUTPUT", "FORWARD"]),
        protocol: z.enum(["tcp", "udp", "both", "all"]),
        sourceIp: z.string(),
        sourcePort: z.string(),
        destIp: z.string(),
        destPort: z.string(),
        action: z.enum(["ACCEPT", "DROP", "REJECT"]),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await addFirewallRule({
          name: input.name,
          chain: input.chain,
          protocol: input.protocol,
          source_ip: input.sourceIp,
          source_port: input.sourcePort,
          dest_ip: input.destIp,
          dest_port: input.destPort,
          action: input.action,
          enabled: input.enabled,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `添加规则失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  deleteRule: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await deleteFirewallRule(input.id);
        return { message: "规则已删除" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `删除规则失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  toggleRule: publicProcedure
    .input(z.object({ id: z.string(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      try {
        await toggleFirewallRule(input.id, input.enabled);
        return { message: "规则状态已更新" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `更新状态失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  listPortForwards: publicProcedure.query(async () => {
    try {
      return await listPortForwardRules();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `获取端口转发规则失败: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }),

  addPortForward: publicProcedure
    .input(
      z.object({
        name: z.string(),
        protocol: z.enum(["tcp", "udp", "both"]),
        externalPort: z.string(),
        internalIp: z.string(),
        internalPort: z.string(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await addPortForwardRule({
          name: input.name,
          protocol: input.protocol,
          external_port: input.externalPort,
          internal_ip: input.internalIp,
          internal_port: input.internalPort,
          enabled: input.enabled,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `添加端口转发失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  deletePortForward: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await deletePortForwardRule(input.id);
        return { message: "端口转发规则已删除" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `删除端口转发失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  listNATRules: publicProcedure.query(async () => {
    try {
      return await listNATRules();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `获取NAT规则失败: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }),

  addNATRule: publicProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.enum(["SNAT", "DNAT", "MASQUERADE"]),
        sourceNetwork: z.string(),
        destNetwork: z.string(),
        interface: z.string(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await addNATRule({
          name: input.name,
          type: input.type,
          source_network: input.sourceNetwork,
          dest_network: input.destNetwork,
          interface: input.interface,
          enabled: input.enabled,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `添加NAT规则失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  deleteNATRule: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await deleteNATRule(input.id);
        return { message: "NAT规则已删除" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `删除NAT规则失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  reloadAll: publicProcedure.mutation(async () => {
    try {
      await reloadAllRules();
      return { message: "所有规则已重新加载" };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `重新加载失败: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }),

  getStatus: publicProcedure.query(async () => {
    try {
      return await getFirewallStatus();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `获取状态失败: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }),

  listZones: publicProcedure.query(async () => {
    try {
      return await listFirewallZones();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `获取防火墙区域列表失败: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }),

  // ==================== Firewalld相关API ====================

  /**
   * 检查Firewalld状态
   */
  checkFirewalldStatus: publicProcedure.query(async () => {
    try {
      return await checkFirewalldStatus();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `检查Firewalld状态失败: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }),

  /**
   * 获取所有Firewalld区域
   */
  listFirewalldZones: publicProcedure.query(async () => {
    try {
      return await listZones();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `获取区域列表失败: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }),

  /**
   * 获取所有区域的详细信息
   */
  getAllFirewalldZonesInfo: publicProcedure.query(async () => {
    try {
      return await getAllZonesInfo();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `获取区域信息失败: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }),

  /**
   * 获取单个区域信息
   */
  getFirewalldZoneInfo: publicProcedure
    .input(z.object({ zoneName: z.string() }))
    .query(async ({ input }) => {
      try {
        return await getZoneInfo(input.zoneName);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `获取区域信息失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  /**
   * 绑定接口到防火墙区域
   */
  bindInterfaceToFirewalldZone: publicProcedure
    .input(
      z.object({
        interfaceName: z.string(),
        zoneName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await bindInterfaceToZone(input.interfaceName, input.zoneName);
        return { message: `接口 ${input.interfaceName} 已绑定到区域 ${input.zoneName}` };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `绑定接口失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  /**
   * 解绑接口从防火墙区域
   */
  unbindInterfaceFromFirewalldZone: publicProcedure
    .input(
      z.object({
        interfaceName: z.string(),
        zoneName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await unbindInterfaceFromZone(input.interfaceName, input.zoneName);
        return { message: `接口 ${input.interfaceName} 已从区域 ${input.zoneName} 解绑` };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `解绑接口失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  /**
   * 获取接口所属的防火墙区域
   */
  getInterfaceFirewalldZone: publicProcedure
    .input(z.object({ interfaceName: z.string() }))
    .query(async ({ input }) => {
      try {
        return await getInterfaceZone(input.interfaceName);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `获取接口区域失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  /**
   * 获取区域策略
   */
  getFirewalldZonePolicy: publicProcedure
    .input(z.object({ zoneName: z.string() }))
    .query(async ({ input }) => {
      try {
        return await getZonePolicy(input.zoneName);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `获取区域策略失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  /**
   * 应用区域策略
   */
  applyFirewalldZonePolicy: publicProcedure
    .input(
      z.object({
        zoneName: z.string(),
        policy: z.object({
          input: z.enum(["ACCEPT", "REJECT", "DROP"]).optional(),
          output: z.enum(["ACCEPT", "REJECT", "DROP"]).optional(),
          forward: z.enum(["ACCEPT", "REJECT", "DROP"]).optional(),
          masquerade: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await applyZonePolicy(input.zoneName, input.policy);
        return { message: `区域 ${input.zoneName} 的策略已应用` };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `应用区域策略失败: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  /**
   * 重新加载Firewalld配置
   */
  reloadFirewalld: publicProcedure.mutation(async () => {
    try {
      await reloadFirewall();
      return { message: "Firewalld配置已重新加载" };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `重新加载Firewalld失败: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }),

  /**
   * 获取Firewalld运行状态
   */
  getFirewalldStatus: publicProcedure.query(async () => {
    try {
      return await getFirewalldStatus();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `获取Firewalld状态失败: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }),
});
