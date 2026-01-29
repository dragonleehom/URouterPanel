/**
 * 网络配置后端类型定义
 */

export type NetworkBackendType = 'netplan' | 'networkmanager' | 'interfaces' | 'manual';

export interface PhysicalInterface {
  name: string;                    // eth0, eth1, enp1s0...
  type: 'ethernet' | 'fiber';      // 电口/光口
  linkStatus: 'up' | 'down';       // 链路状态
  speed: string;                   // 100M/1G/2.5G/10G/unknown
  duplex: 'full' | 'half' | 'unknown';  // 全双工/半双工
  txActivity: boolean;             // 发送活动(用于指示灯)
  rxActivity: boolean;             // 接收活动(用于指示灯)
  macAddress: string;
  driver: string;
  mtu: number;
  operstate: string;               // up/down/unknown
  carrier: boolean;                // 物理链路是否连接
}

export interface SystemNetworkConfig {
  interfaces: PhysicalInterface[];
  configuredPorts: ConfiguredPort[];
}

export interface ConfiguredPort {
  name: string;                    // 接口名称
  type: 'wan' | 'lan';
  physicalInterfaces: string[];    // 绑定的物理接口
  protocol: 'static' | 'dhcp' | 'pppoe';
  enabled: boolean;
  ipaddr?: string;
  netmask?: string;
  gateway?: string;
  dns?: string;
  // ... 其他配置
}

export interface TrafficStats {
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
  timestamp: number;
}

/**
 * 网络配置后端接口
 */
export interface NetworkBackendInterface {
  /**
   * 读取系统网络配置
   */
  readSystemConfig(): Promise<SystemNetworkConfig>;
  
  /**
   * 应用配置到系统
   */
  applyConfig(config: ConfiguredPort): Promise<void>;
  
  /**
   * 验证配置
   */
  validateConfig(config: ConfiguredPort): Promise<boolean>;
  
  /**
   * 删除配置
   */
  removeConfig(portName: string): Promise<void>;
}
