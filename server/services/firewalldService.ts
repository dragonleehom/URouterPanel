/**
 * Firewalld防火墙服务
 * 管理Firewalld区域、规则和接口绑定
 * 参考OpenWrt防火墙策略设计
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 防火墙区域信息
 */
export interface FirewallZone {
  name: string;
  target: 'ACCEPT' | 'REJECT' | 'DROP' | 'default';
  interfaces: string[];
  services: string[];
  ports: string[];
  masquerade: boolean;
  forward: boolean;
  description: string;
}

/**
 * 防火墙区域策略
 */
export interface ZonePolicy {
  name: string;
  input: 'ACCEPT' | 'REJECT' | 'DROP';
  output: 'ACCEPT' | 'REJECT' | 'DROP';
  forward: 'ACCEPT' | 'REJECT' | 'DROP';
  masquerade: boolean;
}

/**
 * 检查Firewalld是否已安装并运行
 */
export async function checkFirewalldStatus(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('systemctl is-active firewalld');
    return stdout.trim() === 'active';
  } catch (error) {
    return false;
  }
}

/**
 * 获取所有防火墙区域
 */
export async function listZones(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('firewall-cmd --get-zones');
    return stdout.trim().split(/\s+/).filter(z => z.length > 0);
  } catch (error) {
    console.error('Failed to list zones:', error);
    return [];
  }
}

/**
 * 获取区域详细信息
 */
export async function getZoneInfo(zoneName: string): Promise<FirewallZone | null> {
  try {
    // 获取区域的所有信息
    const { stdout } = await execAsync(`firewall-cmd --zone=${zoneName} --list-all`);
    
    // 解析输出
    const lines = stdout.split('\n');
    const zone: FirewallZone = {
      name: zoneName,
      target: 'default',
      interfaces: [],
      services: [],
      ports: [],
      masquerade: false,
      forward: false,
      description: '',
    };
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('target:')) {
        const target = trimmed.split(':')[1].trim();
        zone.target = target as any;
      } else if (trimmed.startsWith('interfaces:')) {
        const interfaces = trimmed.split(':')[1].trim();
        zone.interfaces = interfaces ? interfaces.split(/\s+/) : [];
      } else if (trimmed.startsWith('services:')) {
        const services = trimmed.split(':')[1].trim();
        zone.services = services ? services.split(/\s+/) : [];
      } else if (trimmed.startsWith('ports:')) {
        const ports = trimmed.split(':')[1].trim();
        zone.ports = ports ? ports.split(/\s+/) : [];
      } else if (trimmed.startsWith('masquerade:')) {
        zone.masquerade = trimmed.includes('yes');
      } else if (trimmed.startsWith('forward:')) {
        zone.forward = trimmed.includes('yes');
      }
    }
    
    // 获取区域描述
    try {
      const { stdout: descOutput } = await execAsync(`firewall-cmd --permanent --zone=${zoneName} --get-description`);
      zone.description = descOutput.trim();
    } catch (e) {
      // 忽略描述获取失败
    }
    
    return zone;
  } catch (error) {
    console.error(`Failed to get zone info for ${zoneName}:`, error);
    return null;
  }
}

/**
 * 获取所有区域的详细信息
 */
export async function getAllZonesInfo(): Promise<FirewallZone[]> {
  const zones = await listZones();
  const zonesInfo: FirewallZone[] = [];
  
  for (const zoneName of zones) {
    const info = await getZoneInfo(zoneName);
    if (info) {
      zonesInfo.push(info);
    }
  }
  
  return zonesInfo;
}

/**
 * 将接口绑定到防火墙区域
 */
export async function bindInterfaceToZone(interfaceName: string, zoneName: string): Promise<void> {
  try {
    // 先检查接口是否已绑定到其他区域
    const currentZone = await getInterfaceZone(interfaceName);
    if (currentZone && currentZone !== zoneName) {
      // 从旧区域移除
      await unbindInterfaceFromZone(interfaceName, currentZone);
    }
    
    // 绑定到新区域(运行时)
    await execAsync(`firewall-cmd --zone=${zoneName} --add-interface=${interfaceName}`);
    
    // 绑定到新区域(永久)
    await execAsync(`firewall-cmd --permanent --zone=${zoneName} --add-interface=${interfaceName}`);
    
    console.log(`Interface ${interfaceName} bound to zone ${zoneName}`);
  } catch (error) {
    throw new Error(`绑定接口到区域失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 从防火墙区域解绑接口
 */
export async function unbindInterfaceFromZone(interfaceName: string, zoneName: string): Promise<void> {
  try {
    // 从区域移除(运行时)
    try {
      await execAsync(`firewall-cmd --zone=${zoneName} --remove-interface=${interfaceName}`);
    } catch (e) {
      // 忽略运行时移除失败
    }
    
    // 从区域移除(永久)
    try {
      await execAsync(`firewall-cmd --permanent --zone=${zoneName} --remove-interface=${interfaceName}`);
    } catch (e) {
      // 忽略永久移除失败
    }
    
    console.log(`Interface ${interfaceName} unbound from zone ${zoneName}`);
  } catch (error) {
    console.error(`Failed to unbind interface ${interfaceName} from zone ${zoneName}:`, error);
  }
}

/**
 * 获取接口当前所属的防火墙区域
 */
export async function getInterfaceZone(interfaceName: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`firewall-cmd --get-zone-of-interface=${interfaceName}`);
    const zone = stdout.trim();
    return zone || null;
  } catch (error) {
    // 接口未绑定到任何区域
    return null;
  }
}

/**
 * 获取区域的策略配置
 */
export async function getZonePolicy(zoneName: string): Promise<ZonePolicy | null> {
  try {
    const zoneInfo = await getZoneInfo(zoneName);
    if (!zoneInfo) {
      return null;
    }
    
    // Firewalld的target映射到OpenWrt的策略
    let input: 'ACCEPT' | 'REJECT' | 'DROP' = 'REJECT';
    let output: 'ACCEPT' | 'REJECT' | 'DROP' = 'ACCEPT';
    let forward: 'ACCEPT' | 'REJECT' | 'DROP' = 'REJECT';
    
    switch (zoneInfo.target) {
      case 'ACCEPT':
        input = 'ACCEPT';
        output = 'ACCEPT';
        forward = 'ACCEPT';
        break;
      case 'DROP':
        input = 'DROP';
        output = 'DROP';
        forward = 'DROP';
        break;
      case 'REJECT':
        input = 'REJECT';
        output = 'REJECT';
        forward = 'REJECT';
        break;
      case 'default':
        // 根据区域名称设置默认策略
        if (zoneName === 'wan') {
          input = 'DROP';
          output = 'ACCEPT';
          forward = 'DROP';
        } else if (zoneName === 'lan') {
          input = 'ACCEPT';
          output = 'ACCEPT';
          forward = 'ACCEPT';
        } else if (zoneName === 'docker') {
          input = 'ACCEPT';
          output = 'ACCEPT';
          forward = 'ACCEPT';
        }
        break;
    }
    
    return {
      name: zoneName,
      input,
      output,
      forward,
      masquerade: zoneInfo.masquerade,
    };
  } catch (error) {
    console.error(`Failed to get zone policy for ${zoneName}:`, error);
    return null;
  }
}

/**
 * 应用区域策略
 */
export async function applyZonePolicy(zoneName: string, policy: Partial<ZonePolicy>): Promise<void> {
  try {
    // 设置target(Firewalld不支持分别设置input/output/forward,使用target统一控制)
    if (policy.input || policy.output || policy.forward) {
      // 根据策略组合确定target
      let target: string = 'default';
      
      if (policy.input === 'ACCEPT' && policy.output === 'ACCEPT' && policy.forward === 'ACCEPT') {
        target = 'ACCEPT';
      } else if (policy.input === 'DROP' && policy.output === 'DROP' && policy.forward === 'DROP') {
        target = 'DROP';
      } else if (policy.input === 'REJECT' || policy.output === 'REJECT' || policy.forward === 'REJECT') {
        target = 'REJECT';
      } else if (policy.input === 'DROP') {
        target = 'DROP';
      }
      
      await execAsync(`firewall-cmd --permanent --zone=${zoneName} --set-target=${target}`);
    }
    
    // 设置masquerade
    if (policy.masquerade !== undefined) {
      if (policy.masquerade) {
        await execAsync(`firewall-cmd --permanent --zone=${zoneName} --add-masquerade`);
      } else {
        await execAsync(`firewall-cmd --permanent --zone=${zoneName} --remove-masquerade`);
      }
    }
    
    // 重新加载防火墙
    await execAsync('firewall-cmd --reload');
    
    console.log(`Zone policy applied for ${zoneName}`);
  } catch (error) {
    throw new Error(`应用区域策略失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 重新加载防火墙配置
 */
export async function reloadFirewall(): Promise<void> {
  try {
    await execAsync('firewall-cmd --reload');
    console.log('Firewall reloaded');
  } catch (error) {
    throw new Error(`重新加载防火墙失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 获取防火墙运行状态
 */
export async function getFirewallStatus(): Promise<{
  running: boolean;
  version: string;
  backend: string;
}> {
  try {
    const running = await checkFirewalldStatus();
    
    let version = 'unknown';
    let backend = 'unknown';
    
    if (running) {
      try {
        const { stdout: versionOutput } = await execAsync('firewall-cmd --version');
        version = versionOutput.trim();
      } catch (e) {
        // 忽略版本获取失败
      }
      
      try {
        const { stdout: backendOutput } = await execAsync('firewall-cmd --get-default-zone');
        backend = backendOutput.trim();
      } catch (e) {
        // 忽略backend获取失败
      }
    }
    
    return {
      running,
      version,
      backend,
    };
  } catch (error) {
    return {
      running: false,
      version: 'unknown',
      backend: 'unknown',
    };
  }
}
