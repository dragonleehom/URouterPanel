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
      ifname: z.string().nullish(),
      ipaddr: z.string().nullish(),
      netmask: z.string().nullish(),
      gateway: z.string().nullish(),
      dns: z.string().nullish(),
      ipv6: z.number().nullish(),
      ipv6addr: z.string().nullish(),
      ipv6gateway: z.string().nullish(),
      mtu: z.number().nullish(),
      metric: z.number().nullish(),
      firewallZone: z.string().nullish(),
      dhcpServer: z.number().nullish(),
      dhcpStart: z.string().nullish(),
      dhcpEnd: z.string().nullish(),
      dhcpTime: z.string().nullish(),
      enabled: z.number().nullish(),
    }))
    .mutation(async ({ input }) => {
      return await networkConfigService.createNetworkPort(input as any);
    }),
  
  updatePort: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().nullish(),
      type: z.enum(['wan', 'lan']).nullish(),
      protocol: z.enum(['static', 'dhcp', 'pppoe']).nullish(),
      ifname: z.string().nullish(),
      ipaddr: z.string().nullish(),
      netmask: z.string().nullish(),
      gateway: z.string().nullish(),
      dns: z.string().nullish(),
      ipv6: z.number().nullish(),
      ipv6addr: z.string().nullish(),
      ipv6gateway: z.string().nullish(),
      mtu: z.number().nullish(),
      metric: z.number().nullish(),
      firewallZone: z.string().nullish(),
      dhcpServer: z.number().nullish(),
      dhcpStart: z.string().nullish(),
      dhcpEnd: z.string().nullish(),
      dhcpTime: z.string().nullish(),
      enabled: z.number().nullish(),
      // 新增字段
      autoStart: z.number().nullish(),
      dhcpHostname: z.string().nullish(),
      dhcpBroadcast: z.number().nullish(),
      dhcpClientId: z.string().nullish(),
      dhcpVendorClass: z.string().nullish(),
      useDefaultGateway: z.number().nullish(),
      useCustomDns: z.number().nullish(),
      dnsServers: z.string().nullish(),
      peerdns: z.number().nullish(),
      ipv6Delegation: z.number().nullish(),
      ipv6Assignment: z.string().nullish(),
      ipv6Suffix: z.string().nullish(),
      ipv6PrefixFilter: z.string().nullish(),
      ipv4RoutingTable: z.string().nullish(),
      ipv6RoutingTable: z.string().nullish(),
      ignoreDhcpServer: z.number().nullish(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      
      // Filter out null and undefined values
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== null && value !== undefined)
      );
      
      // Update database only - do not apply to system
      // User must explicitly click "Apply Configuration" button to apply changes
      await networkConfigService.updateNetworkPort(id, filteredUpdates);
      
      return { success: true, message: '配置已保存,请点击"应用配置"按钮使其生效' };
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
  
  // ==================== 配置版本管理 ====================
  
  /**
   * 保存并应用网口配置
   * 保存到数据库,应用到系统,重启服务
   */
  saveAndApplyPort: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { restartRelatedServices, createSnapshot } = await import('./services/configVersionService');
      
      // 1. 获取当前配置
      const port = await networkConfigService.getNetworkPort(input.id);
      if (!port) {
        throw new Error('配置不存在');
      }
      
      // 2. 创建快照
      await createSnapshot('network_port', input.id, port);
      
      // 3. 应用配置到系统
      await networkConfigService.applyNetworkPort(port);
      
      // 4. 重启服务
      const restartResult = await restartRelatedServices('network_port');
      
      return {
        success: restartResult.success,
        message: restartResult.message,
        details: restartResult.details,
      };
    }),
  
  /**
   * 复位网口配置到最后应用的版本
   */
  resetPort: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { getLastAppliedSnapshot, restartRelatedServices } = await import('./services/configVersionService');
      
      // 1. 获取最后应用的快照
      const snapshot = await getLastAppliedSnapshot('network_port', input.id);
      if (!snapshot) {
        throw new Error('没有可用的快照,无法复位');
      }
      
      // 2. 从快照恢复配置
      const restoredConfig = snapshot.snapshotData as any;
      await networkConfigService.updateNetworkPort(input.id, restoredConfig);
      
      // 3. 重新获取更新后的配置
      const updatedPort = await networkConfigService.getNetworkPort(input.id);
      if (!updatedPort) {
        throw new Error('配置不存在');
      }
      
      // 4. 应用配置到系统
      await networkConfigService.applyNetworkPort(updatedPort);
      
      // 4. 重启服务
      const restartResult = await restartRelatedServices('network_port');
      
      return {
        success: restartResult.success,
        message: restartResult.message,
        restoredConfig,
        details: restartResult.details,
      };
    }),
});
