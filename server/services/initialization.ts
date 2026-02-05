/**
 * URouterOS 后台服务初始化模块
 * 
 * 职责:
 * 1. 服务启动时进行初始化检测
 * 2. 自动检测网卡并创建默认配置
 * 3. 应用默认防火墙策略
 * 4. 启动网络监控服务
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { getDb } from '../db';
import { networkPorts, localUsers } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from './localAuthService';

const execAsync = promisify(exec);

interface NetworkInterface {
  name: string;
  mac: string;
  driver: string;
  speed: string;
  isUp: boolean;
  hasCarrier: boolean;
}

/**
 * 检测所有可用的物理网卡
 */
async function detectNetworkInterfaces(): Promise<NetworkInterface[]> {
  try {
    console.log('[Init] 检测网络接口...');
    
    // 获取所有网络接口(排除lo和虚拟接口)
    const { stdout } = await execAsync("ip -o link show | awk -F': ' '{print $2}' | grep -v -E '^(lo|docker|br-|veth|virbr)'");
    const interfaces = stdout.trim().split('\n').filter(i => i);
    
    const result: NetworkInterface[] = [];
    
    for (const iface of interfaces) {
      try {
        // 获取MAC地址
        const { stdout: macOutput } = await execAsync(`ip link show ${iface} | grep -oP 'link/ether \\K[^ ]+'`);
        const mac = macOutput.trim();
        
        // 获取驱动信息
        let driver = 'unknown';
        try {
          const { stdout: driverOutput } = await execAsync(`ethtool -i ${iface} 2>/dev/null | grep driver | awk '{print $2}'`);
          driver = driverOutput.trim() || 'unknown';
        } catch (e) {
          // ethtool可能失败,使用默认值
        }
        
        // 获取速率信息
        let speed = 'unknown';
        try {
          const { stdout: speedOutput } = await execAsync(`ethtool ${iface} 2>/dev/null | grep Speed | awk '{print $2}'`);
          speed = speedOutput.trim() || 'unknown';
        } catch (e) {
          // ethtool可能失败,使用默认值
        }
        
        // 检查接口状态
        const { stdout: stateOutput } = await execAsync(`ip link show ${iface} | grep -oP 'state \\K[^ ]+'`);
        const state = stateOutput.trim();
        const isUp = state === 'UP' || state === 'UNKNOWN';
        
        // 检查carrier状态
        let hasCarrier = false;
        try {
          const { stdout: carrierOutput } = await execAsync(`cat /sys/class/net/${iface}/carrier 2>/dev/null`);
          hasCarrier = carrierOutput.trim() === '1';
        } catch (e) {
          // carrier文件可能不存在
        }
        
        result.push({
          name: iface,
          mac,
          driver,
          speed,
          isUp,
          hasCarrier,
        });
        
        console.log(`[Init] 检测到接口: ${iface} (MAC: ${mac}, Driver: ${driver}, Speed: ${speed}, Up: ${isUp}, Carrier: ${hasCarrier})`);
      } catch (error) {
        console.error(`[Init] 检测接口 ${iface} 失败:`, error);
      }
    }
    
    return result;
  } catch (error) {
    console.error('[Init] 检测网络接口失败:', error);
    return [];
  }
}

/**
 * 创建默认WAN配置
 */
async function createDefaultWANConfig(iface: NetworkInterface): Promise<void> {
  try {
    console.log(`[Init] 创建默认WAN配置: ${iface.name}`);
    
    const db = await getDb();
    if (!db) {
      throw new Error('数据库不可用');
    }
    
    await db.insert(networkPorts).values({
      name: 'WAN',
      type: 'wan',
      enabled: 1,
      protocol: 'dhcp',
      ifname: iface.name,
      // macAddress字段不存在于数据库schema中,移除
      // macAddress: iface.mac,
      mtu: 1500,
      metric: 10,
      firewallZone: 'wan',
      autoStart: 1,
      peerdns: 1, // 使用对端的DNS
      useDefaultGateway: 1, // 使用默认网关
      ignoreDhcpServer: 1, // WAN不提供DHCP服务
      // createdAt和updatedAt由数据库自动生成,不需要手动设置
    });
    
    console.log(`[Init] ✅ WAN配置创建成功: ${iface.name}`);
  } catch (error) {
    console.error('[Init] 创建WAN配置失败:', error);
    throw error;
  }
}

/**
 * 创建默认LAN配置
 */
async function createDefaultLANConfig(iface: NetworkInterface): Promise<void> {
  try {
    console.log(`[Init] 创建默认LAN配置: ${iface.name}`);
    
    const db = await getDb();
    if (!db) {
      throw new Error('数据库不可用');
    }
    
    await db.insert(networkPorts).values({
      name: 'LAN',
      type: 'lan',
      enabled: 1,
      protocol: 'static',
      ifname: iface.name,
      // macAddress字段不存在于数据库schema中,移除
      // macAddress: iface.mac,
      ipaddr: '192.168.1.1',
      netmask: '255.255.255.0',
      mtu: 1500,
      firewallZone: 'lan',
      autoStart: 1,
      ignoreDhcpServer: 0, // LAN提供DHCP服务
      // createdAt和updatedAt由数据库自动生成,不需要手动设置
    });
    
    console.log(`[Init] ✅ LAN配置创建成功: ${iface.name} (192.168.1.1/24)`);
  } catch (error) {
    console.error('[Init] 创建LAN配置失败:', error);
    throw error;
  }
}

/**
 * 应用默认防火墙策略
 */
async function applyDefaultFirewallPolicy(): Promise<void> {
  try {
    console.log('[Init] 应用默认防火墙策略...');
    
    // 检查firewalld是否安装
    try {
      await execAsync('which firewall-cmd');
    } catch (error) {
      console.warn('[Init] ⚠️  firewalld未安装,跳过防火墙配置');
      return;
    }
    
    // 检查firewalld是否运行
    try {
      await execAsync('systemctl is-active firewalld');
    } catch (error) {
      console.warn('[Init] ⚠️  firewalld未运行,尝试启动...');
      try {
        await execAsync('systemctl start firewalld');
        console.log('[Init] ✅ firewalld已启动');
      } catch (startError) {
        console.error('[Init] ❌ firewalld启动失败,跳过防火墙配置');
        return;
      }
    }
    
    // 获取所有接口配置
    const db = await getDb();
    if (!db) {
      console.warn('[Init] 数据库不可用,跳过防火墙配置');
      return;
    }
    
    const ports = await db.select().from(networkPorts);
    
    // 为每个接口绑定防火墙区域
    for (const port of ports) {
      if (port.ifname && port.firewallZone) {
        try {
          // 检查接口是否已绑定到其他区域
          const { stdout: currentZone } = await execAsync(`firewall-cmd --get-zone-of-interface=${port.ifname} 2>/dev/null || echo ""`);
          
          if (currentZone.trim() && currentZone.trim() !== port.firewallZone) {
            // 从当前区域移除
            await execAsync(`firewall-cmd --zone=${currentZone.trim()} --remove-interface=${port.ifname} --permanent`);
          }
          
          // 绑定到新区域
          await execAsync(`firewall-cmd --zone=${port.firewallZone} --add-interface=${port.ifname} --permanent`);
          console.log(`[Init] ✅ 接口 ${port.ifname} 已绑定到防火墙区域 ${port.firewallZone}`);
        } catch (error) {
          console.error(`[Init] 绑定接口 ${port.ifname} 到防火墙区域失败:`, error);
        }
      }
    }
    
    // 重新加载防火墙配置
    await execAsync('firewall-cmd --reload');
    console.log('[Init] ✅ 防火墙策略应用成功');
  } catch (error) {
    console.error('[Init] 应用防火墙策略失败:', error);
  }
}

/**
 * 确保默认管理员用户存在
 */
async function ensureDefaultUser(): Promise<void> {
  try {
    console.log('[Init] 检查默认管理员用户...');
    
    const db = await getDb();
    if (!db) {
      console.error('[Init] 数据库不可用,跳过用户初始化');
      return;
    }
    
    // 检查是否已有用户
    const existingUsers = await db.select().from(localUsers);
    
    if (existingUsers.length > 0) {
      console.log(`[Init] 检测到 ${existingUsers.length} 个已有用户,跳过默认用户创建`);
      return;
    }
    
    console.log('[Init] 未检测到用户,创建默认管理员账号...');
    
    // 创建默认管理员用户: URouterOS / password
    const defaultUsername = 'URouterOS';
    const defaultPassword = 'password';
    const passwordHash = await hashPassword(defaultPassword);
    
    await db.insert(localUsers).values({
      username: defaultUsername,
      passwordHash: passwordHash,
      role: 'admin',
      enabled: 1,
    });
    
    console.log(`[Init] ✅ 默认管理员账号创建成功`);
    console.log(`[Init]    用户名: ${defaultUsername}`);
    console.log(`[Init]    密码: ${defaultPassword}`);
    console.log(`[Init]    ⚠️  首次登录后请立即修改密码!`);
  } catch (error) {
    console.error('[Init] 创建默认用户失败:', error);
  }
}

/**
 * 启动网络监控服务
 */
async function startNetworkMonitoring(): Promise<void> {
  try {
    console.log('[Init] 启动网络监控服务...');
    
    // 导入并启动物理接口监控
    // TODO: 实现startMonitoring函数
    // const { startMonitoring } = await import('./networkBackend/physicalInterfaceMonitor');
    // await startMonitoring();
    
    console.log('[Init] ✅ 网络监控服务已启动');
  } catch (error) {
    console.error('[Init] 启动网络监控服务失败:', error);
  }
}

/**
 * 主初始化函数
 * 在服务启动时调用
 */
export async function initializeOnStartup(): Promise<void> {
  console.log('');
  console.log('========================================');
  console.log('URouterOS 后台服务初始化');
  console.log('========================================');
  console.log('');
  
  try {
    // 1. 确保默认管理员用户存在
    await ensureDefaultUser();
    
    // 2. 检查数据库中是否已有配置
    console.log('[Init] 检查现有配置...');
    const db = await getDb();
    if (!db) {
      console.error('[Init] 数据库不可用,跳过自动配置');
      return;
    }
    
    const existingPorts = await db.select().from(networkPorts);
    
    if (existingPorts.length > 0) {
      console.log(`[Init] 检测到 ${existingPorts.length} 个已有配置,跳过自动配置`);
      console.log('[Init] 现有配置:');
      for (const port of existingPorts) {
        console.log(`  - ${port.name} (${port.type}): ${port.ifname || 'N/A'}`);
      }
    } else {
      console.log('[Init] 未检测到配置,开始自动配置...');
      
      // 3. 检测可用网卡
      const interfaces = await detectNetworkInterfaces();
      
      if (interfaces.length === 0) {
        console.warn('[Init] ⚠️  未检测到可用网卡,跳过自动配置');
      } else {
        console.log(`[Init] 检测到 ${interfaces.length} 个网卡`);
        
        // 4. 创建默认WAN配置(第一个网卡)
        await createDefaultWANConfig(interfaces[0]);
        
        // 5. 如果有第二个网卡,创建默认LAN配置
        if (interfaces.length > 1) {
          await createDefaultLANConfig(interfaces[1]);
        } else {
          console.log('[Init] 只有一个网卡,跳过LAN配置');
        }
        
        // 6. 应用默认防火墙策略
        await applyDefaultFirewallPolicy();
      }
    }
    
    // 7. 启动网络监控服务(无论是否有配置都启动)
    await startNetworkMonitoring();
    
    console.log('');
    console.log('========================================');
    console.log('✅ 初始化完成');
    console.log('========================================');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('❌ 初始化失败');
    console.error('========================================');
    console.error('');
    console.error(error);
    
    // 不抛出错误,允许服务继续启动
    console.warn('[Init] ⚠️  初始化失败,但服务将继续运行');
  }
}
