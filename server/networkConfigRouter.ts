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
      // 新增字段
      autoStart: z.number().optional(),
      dhcpHostname: z.string().optional(),
      dhcpBroadcast: z.number().optional(),
      dhcpClientId: z.string().optional(),
      dhcpVendorClass: z.string().optional(),
      useDefaultGateway: z.number().optional(),
      useCustomDns: z.number().optional(),
      dnsServers: z.string().optional(),
      peerdns: z.number().optional(),
      ipv6Delegation: z.number().optional(),
      ipv6Assignment: z.string().optional(),
      ipv6Suffix: z.string().optional(),
      ipv6PrefixFilter: z.string().optional(),
      ipv4RoutingTable: z.string().optional(),
      ipv6RoutingTable: z.string().optional(),
      ignoreDhcpServer: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      
      // 1. Update database
      await networkConfigService.updateNetworkPort(id, updates);
      
      // 2. Get the updated port configuration
      const port = await networkConfigService.getNetworkPort(id);
      if (!port) {
        throw new Error('Port not found');
      }
      
      // 3. Apply configuration to system
      const { applyInterfaceConfig, validateInterfaceConfig } = await import('./services/networkBackend/interfaceConfigApplier');
      
      // Prepare configuration object
      const config = {
        interfaceName: port.ifname || port.name,
        protocol: port.protocol,
        autoStart: port.autoStart === 1,
        dhcpHostname: port.dhcpHostname || undefined,
        useBroadcastFlag: port.dhcpBroadcast === 1,
        overrideDhcpServerId: port.dhcpVendorClass || undefined,
        overrideDhcpClientId: port.dhcpClientId || undefined,
        useDefaultGateway: port.useDefaultGateway === 1,
        useCustomDns: port.useCustomDns === 1,
        customDnsServers: port.dnsServers || undefined,
        delegateIpv6Prefix: port.ipv6Delegation === 1,
        ipv6AssignmentLength: port.ipv6Assignment ? parseInt(port.ipv6Assignment) : undefined,
        ipv6PrefixFilter: port.ipv6PrefixFilter || undefined,
        ipv6Suffix: port.ipv6Suffix || undefined,
        overrideIpv4RouteTable: port.ipv4RoutingTable || undefined,
        overrideIpv6RouteTable: port.ipv6RoutingTable || undefined,
        useGatewayMetric: port.metric !== undefined && port.metric !== null && port.metric > 0,
        gatewayMetric: port.metric !== null ? port.metric : undefined,
        dhcpServerEnabled: port.dhcpServer === 1 && port.ignoreDhcpServer !== 1,
        dhcpStartIp: port.dhcpStart || undefined,
        dhcpEndIp: port.dhcpEnd || undefined,
        dhcpLeaseTime: port.dhcpTime || undefined,
        firewallZone: port.firewallZone || undefined,
      };
      
      // Validate configuration
      const validation = validateInterfaceConfig(config);
      if (!validation.valid) {
        return {
          success: false,
          message: '配置验证失败',
          errors: validation.errors
        };
      }
      
      // Apply configuration
      const result = await applyInterfaceConfig(config);
      
      return result;
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
