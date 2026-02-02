/**
 * DHCP静态租约路由器
 * 提供DHCP静态地址分配的API接口
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { dhcpStaticLeaseDb } from "./db";
import { applyDhcpStaticLeases, validateMacAddress, validateIpAddress } from "./services/appliers/dhcpStaticLeaseApplier";

export const dhcpStaticLeaseRouter = router({
  /**
   * 获取所有静态租约
   */
  getAll: publicProcedure
    .input(z.object({ networkPortId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return await dhcpStaticLeaseDb.getAll(input?.networkPortId);
    }),

  /**
   * 根据ID获取静态租约
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await dhcpStaticLeaseDb.getById(input.id);
    }),

  /**
   * 创建静态租约(仅保存到数据库)
   */
  create: publicProcedure
    .input(z.object({
      networkPortId: z.number(),
      macAddress: z.string(),
      ipAddress: z.string(),
      hostname: z.string().optional(),
      description: z.string().optional(),
      enabled: z.number().optional().default(1),
    }))
    .mutation(async ({ input }) => {
      // 验证MAC地址格式
      if (!validateMacAddress(input.macAddress)) {
        throw new Error('无效的MAC地址格式');
      }

      // 验证IP地址格式
      if (!validateIpAddress(input.ipAddress)) {
        throw new Error('无效的IP地址格式');
      }

      // 检查MAC地址是否已存在
      const existing = await dhcpStaticLeaseDb.getByMac(input.macAddress);
      if (existing) {
        throw new Error('该MAC地址已存在静态租约');
      }

      await dhcpStaticLeaseDb.create(input);
      return { success: true, message: '静态租约已保存(未应用)' };
    }),

  /**
   * 更新静态租约(仅保存到数据库)
   */
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      macAddress: z.string().optional(),
      ipAddress: z.string().optional(),
      hostname: z.string().optional(),
      description: z.string().optional(),
      enabled: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      // 验证MAC地址格式
      if (data.macAddress && !validateMacAddress(data.macAddress)) {
        throw new Error('无效的MAC地址格式');
      }

      // 验证IP地址格式
      if (data.ipAddress && !validateIpAddress(data.ipAddress)) {
        throw new Error('无效的IP地址格式');
      }

      await dhcpStaticLeaseDb.update(id, data);
      return { success: true, message: '静态租约已更新(未应用)' };
    }),

  /**
   * 删除静态租约
   */
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await dhcpStaticLeaseDb.delete(input.id);
      return { success: true, message: '静态租约已删除(需应用配置)' };
    }),

  /**
   * 应用所有静态租约到系统
   */
  applyAll: publicProcedure
    .mutation(async () => {
      try {
        // 获取所有静态租约
        const leases = await dhcpStaticLeaseDb.getAll();

        // 应用到系统
        const result = await applyDhcpStaticLeases(leases);

        if (result.success) {
          // 标记所有租约为已应用
          for (const lease of leases) {
            await dhcpStaticLeaseDb.markAsApplied(lease.id);
          }
        }

        return result;
      } catch (error) {
        console.error('Failed to apply DHCP static leases:', error);
        return {
          success: false,
          message: `应用失败: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }),

  /**
   * 获取待应用的租约数量
   */
  getPendingCount: publicProcedure
    .query(async () => {
      const pendingLeases = await dhcpStaticLeaseDb.getPendingLeases();
      return { count: pendingLeases.length };
    }),

  /**
   * 复位未应用的修改
   */
  revert: publicProcedure
    .mutation(async () => {
      try {
        // 获取所有待应用的租约
        const pendingLeases = await dhcpStaticLeaseDb.getPendingLeases();

        // 删除新创建但未应用的租约
        for (const lease of pendingLeases) {
          if (!lease.lastAppliedAt) {
            // 从未应用过,删除
            await dhcpStaticLeaseDb.delete(lease.id);
          } else {
            // 已应用过,恢复到上次应用的状态
            // TODO: 从configSnapshots表恢复
          }
        }

        return { success: true, message: '已复位未应用的修改' };
      } catch (error) {
        console.error('Failed to revert DHCP static leases:', error);
        return {
          success: false,
          message: `复位失败: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }),
});
