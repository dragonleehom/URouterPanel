import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import * as networkConfigService from './services/networkConfigService';
import { networkConfigManager } from './services/networkBackend';

export const networkConfigRouter = router({
  // ==================== 全局配置 ====================
  
  getGlobalConfig: publicProcedure.query(async () => {
    return await networkConfigService.getGlobalConfig();
  }),
  
  updateGlobalConfig: publicProcedure
    .input(z.object({
      ipv6UlaPrefix: z.string().optional(),
      packetSteering: z.number().optional(),
      rpsEnabled: z.number().optional(),
      rpsCpus: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await networkConfigService.updateGlobalConfig(input);
      return { success: true };
    }),
  
  // ==================== 网口配置 ====================
  
  listPorts: publicProcedure.query(async () => {
    return await networkConfigService.listNetworkPorts();
  }),
  
  getPort: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await networkConfigService.getNetworkPort(input.id);
    }),
  
  createPort: publicProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(['wan', 'lan']),
      protocol: z.enum(['static', 'dhcp', 'pppoe']),
      ifname: z.string().optional(),
      ipaddr: z.string().optional(),
      netmask: z.string().optional(),
      gateway: z.string().optional(),
      dns: z.string().optional(),
      ipv6: z.number().optional(),
      ipv6addr: z.string().optional(),
      ipv6gateway: z.string().optional(),
      mtu: z.number().optional(),
      metric: z.number().optional(),
      firewallZone: z.string().optional(),
      dhcpServer: z.number().optional(),
      dhcpStart: z.string().optional(),
      dhcpEnd: z.string().optional(),
      dhcpTime: z.string().optional(),
      enabled: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return await networkConfigService.createNetworkPort(input as any);
    }),
  
  updatePort: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      type: z.enum(['wan', 'lan']).optional(),
      protocol: z.enum(['static', 'dhcp', 'pppoe']).optional(),
      ifname: z.string().optional(),
      ipaddr: z.string().optional(),
      netmask: z.string().optional(),
      gateway: z.string().optional(),
      dns: z.string().optional(),
      ipv6: z.number().optional(),
      ipv6addr: z.string().optional(),
      ipv6gateway: z.string().optional(),
      mtu: z.number().optional(),
      metric: z.number().optional(),
      firewallZone: z.string().optional(),
      dhcpServer: z.number().optional(),
      dhcpStart: z.string().optional(),
      dhcpEnd: z.string().optional(),
      dhcpTime: z.string().optional(),
      enabled: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await networkConfigService.updateNetworkPort(id, updates);
      return { success: true };
    }),
  
  deletePort: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await networkConfigService.deleteNetworkPort(input.id);
      return { success: true };
    }),
  
  restartPort: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await networkConfigService.restartNetworkPort(input.id);
      return { success: true };
    }),
  
  stopPort: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await networkConfigService.stopNetworkPort(input.id);
      return { success: true };
    }),
  
  // ==================== 设备配置 ====================
  
  listDevices: publicProcedure.query(async () => {
    return await networkConfigService.listNetworkDevices();
  }),
  
  getDevice: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await networkConfigService.getNetworkDevice(input.id);
    }),
  
  updateDevice: publicProcedure
    .input(z.object({
      id: z.number(),
      macaddr: z.string().optional(),
      mtu: z.number().optional(),
      promisc: z.number().optional(),
      multicast: z.number().optional(),
      icmpRedirect: z.number().optional(),
      txqueuelen: z.number().optional(),
      acceptRa: z.number().optional(),
      sendRs: z.number().optional(),
      igmpSnooping: z.number().optional(),
      bridgePorts: z.string().optional(),
      vlanId: z.number().optional(),
      parentDevice: z.string().optional(),
      enabled: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await networkConfigService.updateNetworkDevice(id, updates);
      return { success: true };
    }),
  
  // ==================== 系统操作 ====================
  
  scanDevices: publicProcedure.mutation(async () => {
    await networkConfigService.scanSystemDevices();
    return { success: true };
  }),
  
  createDefaultConfig: publicProcedure.mutation(async () => {
    await networkConfigService.createDefaultConfig();
    return { success: true };
  }),

  applyAllConfigs: publicProcedure.mutation(async () => {
    const ports = await networkConfigService.listNetworkPorts();
    const results = [];
    
    for (const port of ports) {
      if (port.enabled) {
        try {
          await networkConfigService.applyNetworkPort(port as any);
          results.push({ id: port.id, name: port.name, success: true });
        } catch (error: any) {
          results.push({ 
            id: port.id, 
            name: port.name, 
            success: false, 
            error: error.message 
          });
        }
      }
    }
    
    return { 
      success: results.every(r => r.success),
      results 
    };
  }),
  
  // ==================== 物理接口管理 ====================
  
  listPhysicalInterfaces: publicProcedure.query(async () => {
    return await networkConfigManager.listPhysicalInterfaces();
  }),
  
  syncSystemConfig: publicProcedure.mutation(async () => {
    try {
      const systemConfig = await networkConfigManager.readSystemConfig();
      
      // TODO: 将系统配置同步到数据库
      // 这里需要将systemConfig.configuredPorts与数据库中的配置对比
      // 并更新数据库
      
      return { 
        success: true,
        backendType: await networkConfigManager.getBackendType(),
        physicalInterfaces: systemConfig.interfaces.length,
        configuredPorts: systemConfig.configuredPorts.length,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }),
  
  getBackendInfo: publicProcedure.query(async () => {
    return {
      type: await networkConfigManager.getBackendType(),
    };
  }),
});
