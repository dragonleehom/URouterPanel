/**
 * 网络接口管理服务
 * 使用Linux命令直接管理网络接口
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface NetworkInterface {
  name: string;
  type: string; // ethernet, wireless, bridge, virtual
  state: string; // up, down
  ipv4?: string;
  ipv6?: string;
  mac?: string;
  mtu?: number;
  speed?: string;
  rx_bytes?: number;
  tx_bytes?: number;
}

/**
 * 获取所有网络接口
 */
export async function listInterfaces(): Promise<NetworkInterface[]> {
  try {
    // 使用ip命令获取接口列表
    const { stdout } = await execAsync('ip -j addr show');
    const interfaces = JSON.parse(stdout);
    
    return interfaces.map((iface: any) => {
      const ipv4 = iface.addr_info?.find((addr: any) => addr.family === 'inet')?.local;
      const ipv6 = iface.addr_info?.find((addr: any) => addr.family === 'inet6')?.local;
      
      return {
        name: iface.ifname,
        type: detectInterfaceType(iface.ifname, iface.link_type),
        state: iface.operstate?.toLowerCase() || 'unknown',
        ipv4,
        ipv6,
        mac: iface.address,
        mtu: iface.mtu,
      };
    });
  } catch (error) {
    console.error('Failed to list interfaces:', error);
    throw new Error(`获取网络接口列表失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 检测接口类型
 */
function detectInterfaceType(name: string, linkType?: string): string {
  if (name.startsWith('wlan') || name.startsWith('wlp')) return 'wireless';
  if (name.startsWith('br-') || name.startsWith('docker')) return 'bridge';
  if (name.startsWith('veth') || name.startsWith('tun') || name.startsWith('tap')) return 'virtual';
  if (name === 'lo') return 'loopback';
  if (linkType === 'ether' || name.startsWith('eth') || name.startsWith('enp')) return 'ethernet';
  return 'unknown';
}

/**
 * 获取物理网络接口(排除虚拟接口)
 */
export async function listPhysicalInterfaces(): Promise<NetworkInterface[]> {
  const allInterfaces = await listInterfaces();
  return allInterfaces.filter(iface => 
    iface.type === 'ethernet' || iface.type === 'wireless'
  );
}

/**
 * 获取指定接口详情
 */
export async function getInterface(name: string): Promise<NetworkInterface> {
  const interfaces = await listInterfaces();
  const iface = interfaces.find(i => i.name === name);
  
  if (!iface) {
    throw new Error(`接口 ${name} 不存在`);
  }
  
  // 获取统计信息
  try {
    const { stdout } = await execAsync(`cat /sys/class/net/${name}/statistics/rx_bytes /sys/class/net/${name}/statistics/tx_bytes`);
    const [rx, tx] = stdout.trim().split('\n').map(Number);
    iface.rx_bytes = rx;
    iface.tx_bytes = tx;
  } catch (error) {
    console.warn(`Failed to get stats for ${name}:`, error);
  }
  
  // 获取速度信息
  try {
    const { stdout } = await execAsync(`ethtool ${name} 2>/dev/null | grep Speed`);
    const match = stdout.match(/Speed: (.+)/);
    if (match) {
      iface.speed = match[1].trim();
    }
  } catch (error) {
    // ethtool可能不可用或接口不支持
  }
  
  return iface;
}

/**
 * 配置网络接口
 */
export async function configureInterface(name: string, config: {
  ipv4?: string;
  netmask?: string;
  gateway?: string;
  ipv6?: string;
  mtu?: number;
  state?: 'up' | 'down';
}): Promise<void> {
  try {
    // 如果设置了IP地址
    if (config.ipv4) {
      const cidr = config.netmask ? ipv4ToCIDR(config.ipv4, config.netmask) : config.ipv4;
      await execAsync(`sudo ip addr flush dev ${name}`);
      await execAsync(`sudo ip addr add ${cidr} dev ${name}`);
    }
    
    // 如果设置了IPv6地址
    if (config.ipv6) {
      await execAsync(`sudo ip -6 addr add ${config.ipv6} dev ${name}`);
    }
    
    // 如果设置了MTU
    if (config.mtu) {
      await execAsync(`sudo ip link set dev ${name} mtu ${config.mtu}`);
    }
    
    // 如果设置了状态
    if (config.state) {
      await execAsync(`sudo ip link set dev ${name} ${config.state}`);
    }
    
    // 如果设置了网关
    if (config.gateway) {
      await execAsync(`sudo ip route add default via ${config.gateway} dev ${name}`);
    }
  } catch (error) {
    console.error(`Failed to configure interface ${name}:`, error);
    throw new Error(`配置接口失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 启用网络接口
 */
export async function enableInterface(name: string): Promise<void> {
  try {
    await execAsync(`sudo ip link set dev ${name} up`);
  } catch (error) {
    throw new Error(`启用接口失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 禁用网络接口
 */
export async function disableInterface(name: string): Promise<void> {
  try {
    await execAsync(`sudo ip link set dev ${name} down`);
  } catch (error) {
    throw new Error(`禁用接口失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 创建网桥
 */
export async function createBridge(name: string, interfaces: string[]): Promise<void> {
  try {
    // 创建网桥
    await execAsync(`sudo ip link add name ${name} type bridge`);
    await execAsync(`sudo ip link set dev ${name} up`);
    
    // 将接口添加到网桥
    for (const iface of interfaces) {
      await execAsync(`sudo ip link set dev ${iface} master ${name}`);
      await execAsync(`sudo ip link set dev ${iface} up`);
    }
  } catch (error) {
    throw new Error(`创建网桥失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 删除网桥
 */
export async function deleteBridge(name: string): Promise<void> {
  try {
    await execAsync(`sudo ip link set dev ${name} down`);
    await execAsync(`sudo ip link delete ${name} type bridge`);
  } catch (error) {
    throw new Error(`删除网桥失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 将IPv4地址和子网掩码转换为CIDR格式
 */
function ipv4ToCIDR(ip: string, netmask: string): string {
  const maskBits = netmask.split('.').reduce((acc, octet) => {
    return acc + parseInt(octet).toString(2).split('1').length - 1;
  }, 0);
  return `${ip}/${maskBits}`;
}

/**
 * 获取接口统计信息
 */
export async function getInterfaceStats(name: string): Promise<{
  rx_bytes: number;
  tx_bytes: number;
  rx_packets: number;
  tx_packets: number;
  rx_errors: number;
  tx_errors: number;
}> {
  try {
    const statsPath = `/sys/class/net/${name}/statistics`;
    const { stdout } = await execAsync(`
      cat ${statsPath}/rx_bytes ${statsPath}/tx_bytes \
          ${statsPath}/rx_packets ${statsPath}/tx_packets \
          ${statsPath}/rx_errors ${statsPath}/tx_errors
    `);
    
    const [rx_bytes, tx_bytes, rx_packets, tx_packets, rx_errors, tx_errors] = 
      stdout.trim().split('\n').map(Number);
    
    return { rx_bytes, tx_bytes, rx_packets, tx_packets, rx_errors, tx_errors };
  } catch (error) {
    throw new Error(`获取接口统计失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}
