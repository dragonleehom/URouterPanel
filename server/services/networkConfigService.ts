import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import { getDb } from '../db';
import { 
  globalNetworkConfig, 
  networkPorts, 
  networkDevices,
  type GlobalNetworkConfig,
  type NetworkPort,
  type NetworkDevice 
} from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const execAsync = promisify(exec);

/**
 * 网络配置服务
 * 管理全局网络配置、网口配置、设备配置
 */

// ==================== 全局配置 ====================

export async function getGlobalConfig(): Promise<GlobalNetworkConfig | null> {
  const db = await getDb();
  if (!db) return null;
  const configs = await db.select().from(globalNetworkConfig).limit(1);
  return configs[0] || null;
}

export async function updateGlobalConfig(config: Partial<GlobalNetworkConfig>): Promise<void> {
  const existing = await getGlobalConfig();
  
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  if (existing) {
    await db.update(globalNetworkConfig)
      .set(config)
      .where(eq(globalNetworkConfig.id, existing.id));
  } else {
    await db.insert(globalNetworkConfig).values(config as any);
  }
  
  // 应用配置到系统
  await applyGlobalConfig(config);
}

async function applyGlobalConfig(config: Partial<GlobalNetworkConfig>): Promise<void> {
  // 应用IPv6 ULA前缀
  if (config.ipv6UlaPrefix) {
    // TODO: 配置IPv6 ULA
  }
  
  // 应用RPS配置
  if (config.rpsEnabled !== undefined) {
    const interfaces = await execAsync('ls /sys/class/net');
    const ifaces = interfaces.stdout.trim().split('\n');
    
    for (const iface of ifaces) {
      if (iface === 'lo') continue;
      try {
        const rpsFile = `/sys/class/net/${iface}/queues/rx-0/rps_cpus`;
        const value = config.rpsEnabled ? (config.rpsCpus || 'f') : '0';
        await execAsync(`echo "${value}" > ${rpsFile}`);
      } catch (error) {
        // 忽略不支持RPS的接口
      }
    }
  }
}

// ==================== 网口配置 ====================

export async function listNetworkPorts(): Promise<NetworkPort[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(networkPorts);
}

export async function getNetworkPort(id: number): Promise<NetworkPort | null> {
  const db = await getDb();
  if (!db) return null;
  const ports = await db.select().from(networkPorts).where(eq(networkPorts.id, id)).limit(1);
  return ports[0] || null;
}

export async function createNetworkPort(port: Omit<NetworkPort, 'id' | 'createdAt' | 'updatedAt'>): Promise<NetworkPort> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(networkPorts).values(port as any);
  const newPort = await getNetworkPort(Number(result[0].insertId));
  
  if (newPort && newPort.ifname && newPort.enabled) {
    // 只在指定了接口且启用时才应用配置
    try {
      await applyNetworkPort(newPort);
    } catch (error) {
      console.error(`Failed to apply network port ${newPort.name}:`, error);
      // 不抛出错误,允许配置保存到数据库
    }
  }
  
  return newPort!;
}

export async function updateNetworkPort(id: number, updates: Partial<NetworkPort>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(networkPorts).set(updates).where(eq(networkPorts.id, id));
  
  const port = await getNetworkPort(id);
  if (port && port.ifname && port.enabled) {
    // 只在指定了接口且启用时才应用配置
    try {
      await applyNetworkPort(port);
    } catch (error) {
      console.error(`Failed to apply network port ${port.name}:`, error);
      // 不抛出错误,允许配置更新
    }
  }
}

export async function deleteNetworkPort(id: number): Promise<void> {
  const port = await getNetworkPort(id);
  if (port) {
    // 停止接口
    if (port.ifname) {
      try {
        await execAsync(`ip link set ${port.ifname} down`);
      } catch (error) {
        console.error(`Failed to bring down interface ${port.ifname}:`, error);
      }
    }
    
    const db = await getDb();
    if (db) {
      await db.delete(networkPorts).where(eq(networkPorts.id, id));
    }
  }
}

export async function restartNetworkPort(id: number): Promise<void> {
  const port = await getNetworkPort(id);
  if (!port) throw new Error('Network port not found');
  
  // 停止接口
  if (port.ifname) {
    try {
      await execAsync(`ip link set ${port.ifname} down`);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to bring down interface:`, error);
    }
  }
  
  // 重新应用配置
  await applyNetworkPort(port);
}

export async function stopNetworkPort(id: number): Promise<void> {
  const port = await getNetworkPort(id);
  if (!port || !port.ifname) return;
  
  try {
    await execAsync(`ip link set ${port.ifname} down`);
    const db = await getDb();
    if (db) {
      await db.update(networkPorts).set({ enabled: 0 }).where(eq(networkPorts.id, id));
    }
  } catch (error) {
    throw new Error(`Failed to stop interface: ${error}`);
  }
}

export async function applyNetworkPort(port: NetworkPort): Promise<void> {
  if (!port.ifname || !port.enabled) return;
  
  try {
    // 启用接口
    await execAsync(`ip link set ${port.ifname} up`);
    
    // 设置MTU
    if (port.mtu) {
      await execAsync(`ip link set ${port.ifname} mtu ${port.mtu}`);
    }
    
    // 配置IP地址
    if (port.protocol === 'static' && port.ipaddr && port.netmask) {
      // 清除旧IP
      await execAsync(`ip addr flush dev ${port.ifname}`).catch(() => {});
      
      // 添加新IP
      const cidr = netmaskToCIDR(port.netmask);
      await execAsync(`ip addr add ${port.ipaddr}/${cidr} dev ${port.ifname}`);
      
      // 配置网关
      if (port.gateway && port.type === 'wan') {
        await execAsync(`ip route add default via ${port.gateway} dev ${port.ifname} metric ${port.metric || 0}`).catch(() => {});
      }
    } else if (port.protocol === 'dhcp') {
      // 启动DHCP客户端
      await execAsync(`dhclient ${port.ifname}`).catch(() => {});
    }
    
    // 配置IPv6
    if (port.ipv6 && port.ipv6addr) {
      await execAsync(`ip -6 addr add ${port.ipv6addr} dev ${port.ifname}`).catch(() => {});
      
      if (port.ipv6gateway) {
        await execAsync(`ip -6 route add default via ${port.ipv6gateway} dev ${port.ifname}`).catch(() => {});
      }
    }
    
  } catch (error) {
    console.error(`Failed to apply network port config:`, error);
    throw error;
  }
}

function netmaskToCIDR(netmask: string): number {
  const parts = netmask.split('.').map(Number);
  let cidr = 0;
  for (const part of parts) {
    cidr += part.toString(2).split('1').length - 1;
  }
  return cidr;
}

// ==================== 设备配置 ====================

export async function listNetworkDevices(): Promise<NetworkDevice[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(networkDevices);
}

export async function getNetworkDevice(id: number): Promise<NetworkDevice | null> {
  const db = await getDb();
  if (!db) return null;
  const devices = await db.select().from(networkDevices).where(eq(networkDevices.id, id)).limit(1);
  return devices[0] || null;
}

export async function updateNetworkDevice(id: number, updates: Partial<NetworkDevice>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(networkDevices).set(updates).where(eq(networkDevices.id, id));
  
  const device = await getNetworkDevice(id);
  if (device && device.enabled) {
    // 只在启用时才应用配置
    try {
      await applyDeviceConfig(device);
    } catch (error) {
      console.error(`Failed to apply device config ${device.name}:`, error);
      // 不抛出错误,允许配置更新
    }
  }
}

async function applyDeviceConfig(device: NetworkDevice): Promise<void> {
  if (!device.enabled) {
    try {
      await execAsync(`ip link set ${device.name} down`);
    } catch (error) {
      console.error(`Failed to disable device:`, error);
    }
    return;
  }
  
  try {
    // 启用设备
    await execAsync(`ip link set ${device.name} up`);
    
    // 设置MTU
    if (device.mtu) {
      await execAsync(`ip link set ${device.name} mtu ${device.mtu}`);
    }
    
    // 设置混杂模式
    if (device.promisc) {
      await execAsync(`ip link set ${device.name} promisc on`);
    } else {
      await execAsync(`ip link set ${device.name} promisc off`);
    }
    
    // 设置多播
    if (device.multicast) {
      await execAsync(`ip link set ${device.name} multicast on`);
    } else {
      await execAsync(`ip link set ${device.name} multicast off`);
    }
    
    // 设置发送队列长度
    if (device.txqueuelen) {
      await execAsync(`ip link set ${device.name} txqueuelen ${device.txqueuelen}`);
    }
    
    // 网桥特定配置
    if (device.type === 'bridge' && device.bridgePorts) {
      const ports = JSON.parse(device.bridgePorts);
      for (const port of ports) {
        await execAsync(`ip link set ${port} master ${device.name}`).catch(() => {});
      }
      
      // IGMP Snooping
      if (device.igmpSnooping !== undefined) {
        const value = device.igmpSnooping ? '1' : '0';
        await execAsync(`echo ${value} > /sys/class/net/${device.name}/bridge/multicast_snooping`).catch(() => {});
      }
    }
    
  } catch (error) {
    console.error(`Failed to apply device config:`, error);
    throw error;
  }
}

// ==================== 系统扫描和导入 ====================

export async function scanSystemDevices(): Promise<void> {
  try {
    const { stdout } = await execAsync('ip -j link show');
    const interfaces = JSON.parse(stdout);
    
    for (const iface of interfaces) {
      const name = iface.ifname;
      if (name === 'lo') continue;
      
      // 检查设备是否已存在
      const db = await getDb();
      if (!db) continue;
      
      const existing = await db.select().from(networkDevices)
        .where(eq(networkDevices.name, name))
        .limit(1);
      
      if (existing.length === 0) {
        // 确定设备类型
        let type: 'ethernet' | 'bridge' | 'vlan' | 'wireless' | 'virtual' = 'ethernet';
        if (name.startsWith('br')) type = 'bridge';
        else if (name.startsWith('wlan') || name.startsWith('wl')) type = 'wireless';
        else if (name.includes('.')) type = 'vlan';
        else if (name.startsWith('veth') || name.startsWith('docker') || name.startsWith('vir')) type = 'virtual';
        
        if (db) {
          await db.insert(networkDevices).values({
          name,
          type,
          macaddr: iface.address || null,
          mtu: iface.mtu || 1500,
          enabled: iface.operstate === 'UP' ? 1 : 0,
          } as any);
        }
      }
    }
  } catch (error) {
    console.error('Failed to scan system devices:', error);
    throw error;
  }
}

export async function createDefaultConfig(): Promise<void> {
  // 检查是否已有配置
  const existingPorts = await listNetworkPorts();
  if (existingPorts.length > 0) return;
  
  // 扫描系统设备
  await scanSystemDevices();
  
  // 获取所有以太网设备
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const devices = await db.select().from(networkDevices)
    .where(eq(networkDevices.type, 'ethernet'));
  
  if (devices.length === 0) {
    throw new Error('No ethernet devices found');
  }
  
  // 创建WAN口(使用第一个eth设备)
  const wanDevice = devices[0];
  await createNetworkPort({
    name: 'wan',
    type: 'wan',
    protocol: 'dhcp',
    ifname: wanDevice.name,
    mtu: 1500,
    metric: 0,
    firewallZone: 'wan',
    enabled: 1,
  } as any);
  
  // 创建LAN口(使用剩余设备)
  const lanDevices = devices.slice(1);
  if (lanDevices.length > 0) {
    await createNetworkPort({
      name: 'lan',
      type: 'lan',
      protocol: 'static',
      ifname: lanDevices.map((d: NetworkDevice) => d.name).join(' '),
      ipaddr: '192.168.1.1',
      netmask: '255.255.255.0',
      mtu: 1500,
      firewallZone: 'lan',
      dhcpServer: 1,
      dhcpStart: '192.168.1.100',
      dhcpEnd: '192.168.1.200',
      dhcpTime: '12h',
      enabled: 1,
    } as any);
  }
}
