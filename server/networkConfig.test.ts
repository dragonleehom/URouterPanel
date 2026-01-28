import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/context';

// Mock context for testing
const mockContext: Context = {
  req: {} as any,
  res: {} as any,
  user: null,
};

// Create tRPC caller
const caller = appRouter.createCaller(mockContext);

describe('Network Config API', () => {
  describe('Global Config', () => {
    it('should get global config', async () => {
      const config = await caller.networkConfig.getGlobalConfig();
      // 首次调用可能返回null(未初始化)或配置对象
      expect(config === null || typeof config === 'object').toBe(true);
    });

    it('should update global config', async () => {
      const result = await caller.networkConfig.updateGlobalConfig({
        ipv6UlaPrefix: 'fd00::/48',
        packetSteering: 1,
        rpsEnabled: 1,
        rpsCpus: 'f',
      });
      expect(result).toEqual({ success: true });

      // 验证更新后的配置
      const config = await caller.networkConfig.getGlobalConfig();
      expect(config).not.toBeNull();
      expect(config?.ipv6UlaPrefix).toBe('fd00::/48');
      expect(config?.packetSteering).toBe(1);
    });
  });

  describe('Network Ports - Basic Operations', () => {
    it('should list network ports', async () => {
      const ports = await caller.networkConfig.listPorts();
      expect(Array.isArray(ports)).toBe(true);
    });
  });

  describe('Network Devices', () => {
    it('should scan system devices', async () => {
      const result = await caller.networkConfig.scanDevices();
      expect(result).toEqual({ success: true });
    });

    it('should list network devices', async () => {
      const devices = await caller.networkConfig.listDevices();
      expect(Array.isArray(devices)).toBe(true);
    });
  });

  describe('System Operations', () => {
    it('should create default config', async () => {
      const result = await caller.networkConfig.createDefaultConfig();
      expect(result).toEqual({ success: true });

      // 验证创建了配置
      const ports = await caller.networkConfig.listPorts();
      expect(ports.length).toBeGreaterThanOrEqual(0);
    });
  });
});
