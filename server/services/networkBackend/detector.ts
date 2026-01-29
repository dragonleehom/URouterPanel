/**
 * 网络配置后端检测器
 * 自动检测Ubuntu系统使用的网络管理方式
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import type { NetworkBackendType } from './types';

const execAsync = promisify(exec);

export class NetworkBackendDetector {
  private cachedBackend: NetworkBackendType | null = null;
  
  /**
   * 检测系统使用的网络配置后端
   */
  async detect(): Promise<NetworkBackendType> {
    if (this.cachedBackend) {
      return this.cachedBackend;
    }
    
    // 1. 检查Netplan
    if (await this.hasNetplan()) {
      this.cachedBackend = 'netplan';
      console.log('[NetworkBackend] Detected: Netplan');
      return 'netplan';
    }
    
    // 2. 检查NetworkManager
    if (await this.hasNetworkManager()) {
      this.cachedBackend = 'networkmanager';
      console.log('[NetworkBackend] Detected: NetworkManager');
      return 'networkmanager';
    }
    
    // 3. 检查/etc/network/interfaces
    if (await this.hasInterfaces()) {
      this.cachedBackend = 'interfaces';
      console.log('[NetworkBackend] Detected: /etc/network/interfaces');
      return 'interfaces';
    }
    
    // 4. 默认使用手动模式(仅使用ip命令)
    this.cachedBackend = 'manual';
    console.log('[NetworkBackend] Detected: Manual (ip commands only)');
    return 'manual';
  }
  
  /**
   * 检查是否使用Netplan
   */
  private async hasNetplan(): Promise<boolean> {
    try {
      // 检查netplan命令是否存在
      await execAsync('which netplan');
      
      // 检查配置目录是否存在
      const stat = await fs.stat('/etc/netplan');
      if (!stat.isDirectory()) {
        return false;
      }
      
      // 检查是否有配置文件
      const files = await fs.readdir('/etc/netplan');
      const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
      
      return yamlFiles.length > 0;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 检查是否使用NetworkManager
   */
  private async hasNetworkManager(): Promise<boolean> {
    try {
      // 检查nmcli命令是否存在
      await execAsync('which nmcli');
      
      // 检查服务是否运行
      const { stdout } = await execAsync('systemctl is-active NetworkManager 2>/dev/null');
      return stdout.trim() === 'active';
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 检查是否使用/etc/network/interfaces
   */
  private async hasInterfaces(): Promise<boolean> {
    try {
      const stat = await fs.stat('/etc/network/interfaces');
      return stat.isFile();
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 清除缓存,强制重新检测
   */
  clearCache() {
    this.cachedBackend = null;
  }
}

// 单例
export const networkBackendDetector = new NetworkBackendDetector();
