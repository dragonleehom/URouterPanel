/**
 * 物理接口监控器
 * 负责获取物理网卡的实时状态
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import type { PhysicalInterface, TrafficStats } from './types';

const execAsync = promisify(exec);

/**
 * 驱动名称友好转换映射表
 */
const DRIVER_FRIENDLY_NAMES: Record<string, string> = {
  // Realtek
  'r8125': 'Realtek 2.5G Ethernet',
  'r8169': 'Realtek Gigabit Ethernet',
  'r8168': 'Realtek Gigabit Ethernet',
  'r8101': 'Realtek Fast Ethernet',
  
  // Intel
  'igc': 'Intel 2.5G Ethernet',
  'e1000e': 'Intel Gigabit Ethernet',
  'e1000': 'Intel Gigabit Ethernet',
  'ixgbe': 'Intel 10G Ethernet',
  'i40e': 'Intel XL710 40G Ethernet',
  'ice': 'Intel E810 Ethernet',
  'igb': 'Intel Gigabit Ethernet',
  
  // Broadcom
  'bnx2': 'Broadcom NetXtreme II Gigabit',
  'bnx2x': 'Broadcom NetXtreme II 10G',
  'tg3': 'Broadcom Tigon3 Gigabit',
  'bnxt_en': 'Broadcom NetXtreme-C/E',
  
  // Marvell
  'sky2': 'Marvell Yukon 2 Gigabit',
  'skge': 'Marvell Yukon Gigabit',
  
  // Atheros/Qualcomm
  'atl1c': 'Atheros/Qualcomm Gigabit',
  'alx': 'Qualcomm Atheros Gigabit',
  
  // Mellanox
  'mlx4_en': 'Mellanox ConnectX-3 10G/40G',
  'mlx5_core': 'Mellanox ConnectX-4/5/6',
  
  // Others
  'virtio_net': 'VirtIO Virtual Ethernet',
  'vmxnet3': 'VMware vmxnet3 Virtual',
  'veth': 'Virtual Ethernet',
};

/**
 * 将驱动名称转换为友好名称
 */
function getFriendlyDriverName(driver: string): string {
  return DRIVER_FRIENDLY_NAMES[driver] || driver;
}

export class PhysicalInterfaceMonitor {
  private trafficCache: Map<string, TrafficStats> = new Map();
  
  /**
   * 获取所有物理网络接口
   */
  async listPhysicalInterfaces(): Promise<PhysicalInterface[]> {
    const interfaces: PhysicalInterface[] = [];
    
    try {
      // 1. 获取所有网络接口
      const { stdout: ipOutput } = await execAsync('ip -o link show');
      const lines = ipOutput.trim().split('\n');
      
      for (const line of lines) {
        const match = line.match(/^\d+:\s+(\S+):/);
        if (!match) continue;
        
        const ifname = match[1].replace('@.*', ''); // 移除VLAN标记
        
        // 跳过虚拟接口
        if (ifname === 'lo' || ifname.startsWith('veth') || ifname.startsWith('docker') || 
            ifname.startsWith('br-') || ifname.startsWith('virbr')) {
          continue;
        }
        
        // 获取接口详细信息
        const ifaceInfo = await this.getInterfaceInfo(ifname);
        if (ifaceInfo) {
          interfaces.push(ifaceInfo);
        }
      }
    } catch (error) {
      console.error('Failed to list physical interfaces:', error);
    }
    
    return interfaces;
  }
  
  /**
   * 获取单个接口的详细信息
   */
  private async getInterfaceInfo(ifname: string): Promise<PhysicalInterface | null> {
    try {
      // 读取基本信息
      const sysPath = `/sys/class/net/${ifname}`;
      
      const [macAddress, operstate, mtu, carrierStr] = await Promise.all([
        fs.readFile(`${sysPath}/address`, 'utf-8').catch(() => ''),
        fs.readFile(`${sysPath}/operstate`, 'utf-8').catch(() => 'unknown'),
        fs.readFile(`${sysPath}/mtu`, 'utf-8').catch(() => '1500'),
        fs.readFile(`${sysPath}/carrier`, 'utf-8').catch(() => '0'),
      ]);
      
      const carrier = carrierStr.trim() === '1';
      const linkStatus = carrier ? 'up' : 'down';
      
      // 获取速率和双工信息
      let speed = 'unknown';
      let duplex: 'full' | 'half' | 'unknown' = 'unknown';
      let driver = 'unknown';
      
      try {
        const { stdout: ethtoolOutput } = await execAsync(`ethtool ${ifname} 2>/dev/null`);
        
        // 解析速率 - 支持多种格式
        // 格式1: "Speed: 1000Mb/s" 或 "Speed: 10Gb/s"
        // 格式2: "Speed: 1000 Mb/s" (带空格)
        // 格式3: "Speed: Unknown!"
        const speedMatch = ethtoolOutput.match(/Speed:\s+(\d+)\s?(Mb|Gb)\/s/i);
        if (speedMatch) {
          const value = parseInt(speedMatch[1]);
          const unit = speedMatch[2].toLowerCase();
          if (unit === 'gb') {
            speed = `${value} Gbps`;
          } else {
            speed = `${value} Mbps`;
          }
        } else if (ethtoolOutput.includes('Speed: Unknown')) {
          // 如果速率未知,尝试从/sys读取
          try {
            const sysSpeed = await fs.readFile(`/sys/class/net/${ifname}/speed`, 'utf-8');
            const speedValue = parseInt(sysSpeed.trim());
            if (speedValue > 0) {
              if (speedValue >= 1000) {
                speed = `${speedValue / 1000} Gbps`;
              } else {
                speed = `${speedValue} Mbps`;
              }
            }
          } catch (e) {
            // /sys/class/net/读取失败,保持unknown
          }
        }
        
        // 解析双工
        const duplexMatch = ethtoolOutput.match(/Duplex:\s+(Full|Half)/i);
        if (duplexMatch) {
          duplex = duplexMatch[1].toLowerCase() as 'full' | 'half';
        }
      } catch (error) {
        console.error(`Failed to get ethtool info for ${ifname}:`, error);
        // ethtool失败,尝试从/sys读取速率
        try {
          const sysSpeed = await fs.readFile(`/sys/class/net/${ifname}/speed`, 'utf-8');
          const speedValue = parseInt(sysSpeed.trim());
          if (speedValue > 0) {
            if (speedValue >= 1000) {
              speed = `${speedValue / 1000} Gbps`;
            } else {
              speed = `${speedValue} Mbps`;
            }
          }
        } catch (e) {
          // 所有方法失败,保持unknown
        }
      }
      
      // 如果速率仍然未知且网口未连接,尝试获取最大支持速率
      if (speed === 'unknown' && !carrier) {
        try {
          const { stdout: ethtoolOutput } = await execAsync(`ethtool ${ifname} 2>/dev/null`);
          // 查找 "Supported link modes" 中的所有速率
          // 支持多行格式,例如:
          // Supported link modes:   10baseT/Half 10baseT/Full
          //                         100baseT/Half 100baseT/Full
          //                         1000baseT/Full
          //                         2500baseT/Full
          const supportedMatch = ethtoolOutput.match(/(\d+)(base|BASE)(T|TX|T4|SX|LX)\/(Full|Half)/g);
          if (supportedMatch && supportedMatch.length > 0) {
            // 提取所有支持的速率
            const speeds = supportedMatch.map(m => {
              const match = m.match(/(\d+)/);
              return match ? parseInt(match[1]) : 0;
            });
            // 使用最大支持速率(最后一个通常是最大的)
            const maxSpeed = Math.max(...speeds);
            if (maxSpeed >= 1000) {
              speed = `${maxSpeed / 1000} Gbps`;
            } else {
              speed = `${maxSpeed} Mbps`;
            }
          }
        } catch (e) {
          console.error(`Failed to get max supported speed for ${ifname}:`, e);
        }
      }
      
      // 获取驱动信息
      try {
        const { stdout: driverOutput } = await execAsync(`ethtool -i ${ifname} 2>/dev/null`);
        const driverMatch = driverOutput.match(/driver:\s+(\S+)/i);
        if (driverMatch) {
          const rawDriver = driverMatch[1];
          // 转换为友好名称
          driver = getFriendlyDriverName(rawDriver);
        }
      } catch (error) {
        // 忽略
      }
      
      // 判断接口类型(光口/电口)
      const type = await this.detectInterfaceType(ifname);
      
      // 获取流量活动状态
      const traffic = await this.getTrafficStats(ifname);
      const prevTraffic = this.trafficCache.get(ifname);
      
      let txActivity = false;
      let rxActivity = false;
      
      if (prevTraffic) {
        const timeDiff = traffic.timestamp - prevTraffic.timestamp;
        if (timeDiff > 0) {
          // 如果1秒内有流量变化,认为有活动
          txActivity = (traffic.txBytes - prevTraffic.txBytes) > 0;
          rxActivity = (traffic.rxBytes - prevTraffic.rxBytes) > 0;
        }
      }
      
      this.trafficCache.set(ifname, traffic);
      
      return {
        name: ifname,
        type,
        linkStatus: linkStatus as 'up' | 'down',
        speed,
        duplex,
        txActivity,
        rxActivity,
        macAddress: macAddress.trim(),
        driver,
        mtu: parseInt(mtu.trim()),
        operstate: operstate.trim(),
        carrier,
      };
    } catch (error) {
      console.error(`Failed to get info for ${ifname}:`, error);
      return null;
    }
  }
  
  /**
   * 检测接口类型(光口/电口)
   */
  private async detectInterfaceType(ifname: string): Promise<'ethernet' | 'fiber'> {
    try {
      // 尝试使用ethtool -m检测SFP模块
      const { stdout } = await execAsync(`ethtool -m ${ifname} 2>/dev/null`);
      if (stdout.includes('Identifier') || stdout.includes('SFP')) {
        return 'fiber';
      }
    } catch (error) {
      // 如果ethtool -m失败,说明不是光口
    }
    
    // 默认为电口
    return 'ethernet';
  }
  
  /**
   * 获取流量统计
   */
  async getTrafficStats(ifname: string): Promise<TrafficStats> {
    try {
      const sysPath = `/sys/class/net/${ifname}/statistics`;
      
      const [rxBytes, txBytes, rxPackets, txPackets] = await Promise.all([
        fs.readFile(`${sysPath}/rx_bytes`, 'utf-8').then(s => parseInt(s.trim())),
        fs.readFile(`${sysPath}/tx_bytes`, 'utf-8').then(s => parseInt(s.trim())),
        fs.readFile(`${sysPath}/rx_packets`, 'utf-8').then(s => parseInt(s.trim())),
        fs.readFile(`${sysPath}/tx_packets`, 'utf-8').then(s => parseInt(s.trim())),
      ]);
      
      return {
        rxBytes,
        txBytes,
        rxPackets,
        txPackets,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        rxBytes: 0,
        txBytes: 0,
        rxPackets: 0,
        txPackets: 0,
        timestamp: Date.now(),
      };
    }
  }
  
  /**
   * 清理缓存
   */
  clearCache() {
    this.trafficCache.clear();
  }
}

// 单例
export const physicalInterfaceMonitor = new PhysicalInterfaceMonitor();
