/**
 * 网络配置管理器
 * 统一入口,自动选择合适的后端
 */

import { networkBackendDetector } from './detector';
import { NetplanBackend } from './netplanBackend';
import type { NetworkBackendInterface, SystemNetworkConfig, ConfiguredPort, PhysicalInterface } from './types';
import { physicalInterfaceMonitor } from './physicalInterfaceMonitor';

class NetworkConfigManager {
  private backend: NetworkBackendInterface | null = null;
  private backendType: string | null = null;
  
  /**
   * 初始化并获取合适的后端
   */
  private async getBackend(): Promise<NetworkBackendInterface> {
    const type = await networkBackendDetector.detect();
    
    // 如果后端类型没变,复用现有实例
    if (this.backend && this.backendType === type) {
      return this.backend;
    }
    
    this.backendType = type;
    
    switch (type) {
      case 'netplan':
        this.backend = new NetplanBackend();
        break;
      
      case 'networkmanager':
        // TODO: 实现NetworkManager后端
        throw new Error('NetworkManager backend not implemented yet');
      
      case 'interfaces':
        // TODO: 实现interfaces后端
        throw new Error('/etc/network/interfaces backend not implemented yet');
      
      case 'manual':
      default:
        // 使用手动模式(仅ip命令,不持久化)
        throw new Error('Manual mode: Configuration will not persist across reboots');
    }
    
    return this.backend;
  }
  
  /**
   * 读取系统网络配置
   */
  async readSystemConfig(): Promise<SystemNetworkConfig> {
    const backend = await this.getBackend();
    return await backend.readSystemConfig();
  }
  
  /**
   * 应用配置到系统
   */
  async applyConfig(port: ConfiguredPort): Promise<void> {
    const backend = await this.getBackend();
    
    // 验证配置
    const isValid = await backend.validateConfig(port);
    if (!isValid) {
      throw new Error('Invalid configuration');
    }
    
    // 应用配置
    await backend.applyConfig(port);
  }
  
  /**
   * 删除配置
   */
  async removeConfig(portName: string): Promise<void> {
    const backend = await this.getBackend();
    await backend.removeConfig(portName);
  }
  
  /**
   * 获取物理接口列表
   */
  async listPhysicalInterfaces(): Promise<PhysicalInterface[]> {
    return await physicalInterfaceMonitor.listPhysicalInterfaces();
  }
  
  /**
   * 获取当前使用的后端类型
   */
  async getBackendType(): Promise<string> {
    return await networkBackendDetector.detect();
  }
}

// 单例
export const networkConfigManager = new NetworkConfigManager();

// 导出类型
export type { PhysicalInterface, SystemNetworkConfig, ConfiguredPort } from './types';
