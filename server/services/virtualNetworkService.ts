/**
 * 虚拟网络服务
 * 管理Linux网桥、虚拟网络、VLAN等
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export interface VirtualNetwork {
  id: number;
  name: string;
  description?: string;
  type: 'bridge' | 'nat' | 'routed' | 'isolated';
  subnet: string;
  gateway: string;
  dhcp_enabled: boolean;
  dhcp_range?: string;
  vlan_id?: number;
  interfaces: string[];
  status: 'active' | 'inactive';
  created_at: string;
}

export interface NetworkTraffic {
  rx_bytes: number;
  tx_bytes: number;
  rx_packets: number;
  tx_packets: number;
  rx_errors: number;
  tx_errors: number;
}

const NETWORKS_CONFIG_FILE = '/etc/urouteros/virtual_networks.json';

/**
 * 加载虚拟网络配置
 */
async function loadNetworksConfig(): Promise<VirtualNetwork[]> {
  try {
    const content = await fs.readFile(NETWORKS_CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // 文件不存在或解析失败,返回空数组
    return [];
  }
}

/**
 * 保存虚拟网络配置
 */
async function saveNetworksConfig(networks: VirtualNetwork[]): Promise<void> {
  try {
    // 确保目录存在
    await fs.mkdir('/etc/urouteros', { recursive: true });
    await fs.writeFile(NETWORKS_CONFIG_FILE, JSON.stringify(networks, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save networks config:', error);
    throw new Error(`保存配置失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 获取下一个可用的网络ID
 */
async function getNextNetworkId(): Promise<number> {
  const networks = await loadNetworksConfig();
  if (networks.length === 0) return 1;
  return Math.max(...networks.map(n => n.id)) + 1;
}

/**
 * 检查网桥是否存在
 */
async function bridgeExists(name: string): Promise<boolean> {
  try {
    await execAsync(`ip link show ${name}`);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 创建Linux网桥
 */
async function createBridge(name: string): Promise<void> {
  try {
    // 创建网桥
    await execAsync(`ip link add name ${name} type bridge`);
    // 启动网桥
    await execAsync(`ip link set ${name} up`);
  } catch (error) {
    throw new Error(`创建网桥失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 删除Linux网桥
 */
async function deleteBridge(name: string): Promise<void> {
  try {
    // 关闭网桥
    await execAsync(`ip link set ${name} down`);
    // 删除网桥
    await execAsync(`ip link delete ${name} type bridge`);
  } catch (error) {
    throw new Error(`删除网桥失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 配置网桥IP地址
 */
async function configureBridgeIP(name: string, ip: string, subnet: string): Promise<void> {
  try {
    // 计算CIDR前缀长度
    const cidr = subnetToCIDR(subnet);
    // 清除现有IP地址
    await execAsync(`ip addr flush dev ${name}`);
    // 添加新IP地址
    await execAsync(`ip addr add ${ip}/${cidr} dev ${name}`);
  } catch (error) {
    throw new Error(`配置网桥IP失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 将子网掩码转换为CIDR前缀长度
 */
function subnetToCIDR(subnet: string): number {
  // 如果已经是CIDR格式(如192.168.1.0/24),提取前缀长度
  if (subnet.includes('/')) {
    return parseInt(subnet.split('/')[1]);
  }
  
  // 如果是子网掩码格式(如255.255.255.0),转换为CIDR
  const parts = subnet.split('.').map(Number);
  let cidr = 0;
  for (const part of parts) {
    cidr += part.toString(2).split('1').length - 1;
  }
  return cidr;
}

/**
 * 获取网桥接口列表
 */
async function getBridgeInterfaces(name: string): Promise<string[]> {
  try {
    const { stdout } = await execAsync(`ip link show master ${name}`);
    const interfaces: string[] = [];
    const lines = stdout.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^\d+:\s+(\S+):/);
      if (match) {
        interfaces.push(match[1]);
      }
    }
    
    return interfaces;
  } catch (error) {
    return [];
  }
}

/**
 * 获取网桥状态
 */
async function getBridgeStatus(name: string): Promise<'active' | 'inactive'> {
  try {
    const { stdout } = await execAsync(`ip link show ${name}`);
    return stdout.includes('state UP') ? 'active' : 'inactive';
  } catch (error) {
    return 'inactive';
  }
}

/**
 * 获取网桥流量统计
 */
export async function getNetworkTraffic(name: string): Promise<NetworkTraffic> {
  try {
    const { stdout } = await execAsync(`ip -s link show ${name}`);
    const lines = stdout.split('\n');
    
    // 解析RX统计(接收)
    let rxBytes = 0, rxPackets = 0, rxErrors = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('RX:')) {
        const rxLine = lines[i + 1];
        const rxMatch = rxLine.match(/(\d+)\s+(\d+)\s+(\d+)/);
        if (rxMatch) {
          rxBytes = parseInt(rxMatch[1]);
          rxPackets = parseInt(rxMatch[2]);
          rxErrors = parseInt(rxMatch[3]);
        }
        break;
      }
    }
    
    // 解析TX统计(发送)
    let txBytes = 0, txPackets = 0, txErrors = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('TX:')) {
        const txLine = lines[i + 1];
        const txMatch = txLine.match(/(\d+)\s+(\d+)\s+(\d+)/);
        if (txMatch) {
          txBytes = parseInt(txMatch[1]);
          txPackets = parseInt(txMatch[2]);
          txErrors = parseInt(txMatch[3]);
        }
        break;
      }
    }
    
    return {
      rx_bytes: rxBytes,
      tx_bytes: txBytes,
      rx_packets: rxPackets,
      tx_packets: txPackets,
      rx_errors: rxErrors,
      tx_errors: txErrors,
    };
  } catch (error) {
    return {
      rx_bytes: 0,
      tx_bytes: 0,
      rx_packets: 0,
      tx_packets: 0,
      rx_errors: 0,
      tx_errors: 0,
    };
  }
}

/**
 * 列出所有虚拟网络
 */
export async function listVirtualNetworks(): Promise<VirtualNetwork[]> {
  const networks = await loadNetworksConfig();
  
  // 更新每个网络的实时状态
  for (const network of networks) {
    network.status = await getBridgeStatus(network.name);
    network.interfaces = await getBridgeInterfaces(network.name);
  }
  
  return networks;
}

/**
 * 获取虚拟网络详情
 */
export async function getVirtualNetwork(id: number): Promise<VirtualNetwork | null> {
  const networks = await loadNetworksConfig();
  const network = networks.find(n => n.id === id);
  
  if (!network) return null;
  
  // 更新实时状态
  network.status = await getBridgeStatus(network.name);
  network.interfaces = await getBridgeInterfaces(network.name);
  
  return network;
}

/**
 * 创建虚拟网络
 */
export async function createVirtualNetwork(config: {
  name: string;
  description?: string;
  type: 'bridge' | 'nat' | 'routed' | 'isolated';
  subnet: string;
  gateway: string;
  dhcp_enabled: boolean;
  dhcp_range?: string;
  vlan_id?: number;
}): Promise<VirtualNetwork> {
  // 验证网络名称
  if (!config.name || config.name.length < 1) {
    throw new Error('网络名称不能为空');
  }
  
  // 检查网桥是否已存在
  const exists = await bridgeExists(config.name);
  if (exists) {
    throw new Error(`网桥 ${config.name} 已存在`);
  }
  
  // 创建网桥
  await createBridge(config.name);
  
  // 配置IP地址
  await configureBridgeIP(config.name, config.gateway, config.subnet);
  
  // 创建网络配置
  const networks = await loadNetworksConfig();
  const id = await getNextNetworkId();
  
  const network: VirtualNetwork = {
    id,
    name: config.name,
    description: config.description,
    type: config.type,
    subnet: config.subnet,
    gateway: config.gateway,
    dhcp_enabled: config.dhcp_enabled,
    dhcp_range: config.dhcp_range,
    vlan_id: config.vlan_id,
    interfaces: [],
    status: 'active',
    created_at: new Date().toISOString(),
  };
  
  networks.push(network);
  await saveNetworksConfig(networks);
  
  // 如果启用DHCP,配置dnsmasq
  if (config.dhcp_enabled && config.dhcp_range) {
    await configureDHCP(config.name, config.dhcp_range);
  }
  
  // 如果是NAT类型,配置NAT规则
  if (config.type === 'nat') {
    await configureNAT(config.name, config.subnet);
  }
  
  return network;
}

/**
 * 删除虚拟网络
 */
export async function deleteVirtualNetwork(id: number): Promise<void> {
  const networks = await loadNetworksConfig();
  const network = networks.find(n => n.id === id);
  
  if (!network) {
    throw new Error('网络不存在');
  }
  
  // 删除网桥
  const exists = await bridgeExists(network.name);
  if (exists) {
    await deleteBridge(network.name);
  }
  
  // 如果是NAT类型,删除NAT规则
  if (network.type === 'nat') {
    await removeNAT(network.name, network.subnet);
  }
  
  // 从配置中删除
  const updatedNetworks = networks.filter(n => n.id !== id);
  await saveNetworksConfig(updatedNetworks);
}

/**
 * 配置DHCP服务
 */
async function configureDHCP(bridge: string, range: string): Promise<void> {
  try {
    // 解析DHCP范围
    const [start, end] = range.split('-');
    
    // 添加dnsmasq配置
    const config = `
# DHCP配置 for ${bridge}
interface=${bridge}
dhcp-range=${start.trim()},${end.trim()},12h
`;
    
    await fs.appendFile('/etc/dnsmasq.conf', config, 'utf-8');
    
    // 重启dnsmasq
    await execAsync('systemctl restart dnsmasq');
  } catch (error) {
    console.error('Failed to configure DHCP:', error);
    // 不抛出错误,DHCP配置失败不应该阻止网络创建
  }
}

/**
 * 配置NAT规则
 */
async function configureNAT(bridge: string, subnet: string): Promise<void> {
  try {
    // 启用IP转发
    await execAsync('echo 1 > /proc/sys/net/ipv4/ip_forward');
    
    // 添加MASQUERADE规则
    await execAsync(`iptables -t nat -A POSTROUTING -s ${subnet} ! -d ${subnet} -j MASQUERADE`);
    
    // 允许转发
    await execAsync(`iptables -A FORWARD -i ${bridge} -j ACCEPT`);
    await execAsync(`iptables -A FORWARD -o ${bridge} -j ACCEPT`);
  } catch (error) {
    console.error('Failed to configure NAT:', error);
    throw new Error(`配置NAT失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 删除NAT规则
 */
async function removeNAT(bridge: string, subnet: string): Promise<void> {
  try {
    // 删除MASQUERADE规则
    await execAsync(`iptables -t nat -D POSTROUTING -s ${subnet} ! -d ${subnet} -j MASQUERADE`);
    
    // 删除转发规则
    await execAsync(`iptables -D FORWARD -i ${bridge} -j ACCEPT`);
    await execAsync(`iptables -D FORWARD -o ${bridge} -j ACCEPT`);
  } catch (error) {
    // 忽略删除失败的错误
    console.error('Failed to remove NAT:', error);
  }
}

/**
 * 将接口添加到网桥
 */
export async function addInterfaceToBridge(networkId: number, interfaceName: string): Promise<void> {
  const networks = await loadNetworksConfig();
  const network = networks.find(n => n.id === networkId);
  
  if (!network) {
    throw new Error('网络不存在');
  }
  
  try {
    // 将接口添加到网桥
    await execAsync(`ip link set ${interfaceName} master ${network.name}`);
    await execAsync(`ip link set ${interfaceName} up`);
    
    // 更新配置
    if (!network.interfaces.includes(interfaceName)) {
      network.interfaces.push(interfaceName);
      await saveNetworksConfig(networks);
    }
  } catch (error) {
    throw new Error(`添加接口失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 从网桥移除接口
 */
export async function removeInterfaceFromBridge(networkId: number, interfaceName: string): Promise<void> {
  const networks = await loadNetworksConfig();
  const network = networks.find(n => n.id === networkId);
  
  if (!network) {
    throw new Error('网络不存在');
  }
  
  try {
    // 从网桥移除接口
    await execAsync(`ip link set ${interfaceName} nomaster`);
    
    // 更新配置
    network.interfaces = network.interfaces.filter(i => i !== interfaceName);
    await saveNetworksConfig(networks);
  } catch (error) {
    throw new Error(`移除接口失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}
