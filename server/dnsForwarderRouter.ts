/**
 * DNS转发器路由器
 * 提供DNS转发器配置的API接口
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { dnsForwarderDb } from "./db";
import { applyDnsForwarders, validateDnsServer, getCurrentDnsServers } from "./services/appliers/dnsForwarderApplier";

export const dnsForwarderRouter = router({
  /**
   * 获取所有DNS转发器
   */
  getAll: publicProcedure
    .input(z.object({ networkPortId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return await dnsForwarderDb.getAll(input?.networkPortId);
    }),

  /**
   * 获取当前系统DNS配置
   */
  getCurrentDns: publicProcedure
    .query(async () => {
      const dnsServers = await getCurrentDnsServers();
      return { dnsServers };
    }),

  /**
   * 创建DNS转发器(仅保存到数据库)
   */
  create: publicProcedure
    .input(z.object({
      networkPortId: z.number().optional(),
      dnsServer: z.string(),
      priority: z.number().optional().default(0),
      enabled: z.number().optional().default(1),
    }))
    .mutation(async ({ input }) => {
      // 验证DNS服务器地址格式
      if (!validateDnsServer(input.dnsServer)) {
        throw new Error('无效的DNS服务器地址格式');
      }

      await dnsForwarderDb.create(input);
      return { success: true, message: 'DNS转发器已保存(未应用)' };
    }),

  /**
   * 批量创建DNS转发器
   */
  createBatch: publicProcedure
    .input(z.object({
      networkPortId: z.number().optional(),
      dnsServers: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      // 验证所有DNS服务器地址格式
      for (const dns of input.dnsServers) {
        if (!validateDnsServer(dns)) {
          throw new Error(`无效的DNS服务器地址格式: ${dns}`);
        }
      }

      // 批量创建
      for (let i = 0; i < input.dnsServers.length; i++) {
        await dnsForwarderDb.create({
          networkPortId: input.networkPortId,
          dnsServer: input.dnsServers[i],
          priority: i,
          enabled: 1,
        });
      }

      return { success: true, message: `已添加${input.dnsServers.length}个DNS转发器(未应用)` };
    }),

  /**
   * 更新DNS转发器(仅保存到数据库)
   */
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      dnsServer: z.string().optional(),
      priority: z.number().optional(),
      enabled: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      // 验证DNS服务器地址格式
      if (data.dnsServer && !validateDnsServer(data.dnsServer)) {
        throw new Error('无效的DNS服务器地址格式');
      }

      await dnsForwarderDb.update(id, data);
      return { success: true, message: 'DNS转发器已更新(未应用)' };
    }),

  /**
   * 删除DNS转发器
   */
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await dnsForwarderDb.delete(input.id);
      return { success: true, message: 'DNS转发器已删除(需应用配置)' };
    }),

  /**
   * 应用所有DNS转发器到系统
   */
  applyAll: publicProcedure
    .mutation(async () => {
      try {
        // 获取所有DNS转发器
        const forwarders = await dnsForwarderDb.getAll();

        // 应用到系统
        const result = await applyDnsForwarders(forwarders);

        if (result.success) {
          // 标记所有转发器为已应用
          for (const forwarder of forwarders) {
            await dnsForwarderDb.markAsApplied(forwarder.id);
          }
        }

        return result;
      } catch (error) {
        console.error('Failed to apply DNS forwarders:', error);
        return {
          success: false,
          message: `应用失败: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }),

  /**
   * 复位未应用的修改
   */
  revert: publicProcedure
    .mutation(async () => {
      try {
        // 获取所有DNS转发器
        const forwarders = await dnsForwarderDb.getAll();

        // 删除所有待应用的转发器
        for (const forwarder of forwarders) {
          if (forwarder.pendingChanges === 1 && !forwarder.lastAppliedAt) {
            // 从未应用过,删除
            await dnsForwarderDb.delete(forwarder.id);
          }
        }

        return { success: true, message: '已复位未应用的修改' };
      } catch (error) {
        console.error('Failed to revert DNS forwarders:', error);
        return {
          success: false,
          message: `复位失败: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }),
});
