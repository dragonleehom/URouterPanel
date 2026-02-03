/**
 * 端口转发配置应用器
 * 负责将数据库中的端口转发规则应用到系统(iptables)
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface PortForwardingRule {
  id: number;
  name: string;
  protocol: string;
  sourceZone: string | null;
  externalPort: string;
  internalIp: string;
  internalPort: string;
  enabled: number | null;
}

/**
 * 应用所有端口转发规则到系统
 */
export async function applyPortForwardingRules(rules: PortForwardingRule[]): Promise<{ success: boolean; message: string }> {
  try {
    // 只使用启用的规则
    const enabledRules = rules.filter(r => r.enabled === 1);

    // 清除现有的端口转发规则(URouterOS自定义链)
    await clearPortForwardingChain();

    // 添加新规则
    const errors: string[] = [];
    let successCount = 0;

    for (const rule of enabledRules) {
      try {
        await addPortForwardingRule(rule);
        successCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`规则 ${rule.name}: ${errorMsg}`);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: `部分规则应用失败(成功${successCount}/${enabledRules.length}):\n${errors.join('\n')}`,
      };
    }

    return { 
      success: true, 
      message: `成功应用${successCount}条端口转发规则` 
    };
  } catch (error) {
    console.error('Failed to apply port forwarding rules:', error);
    return { 
      success: false, 
      message: `应用配置失败: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * 清除URouterOS端口转发链
 */
async function clearPortForwardingChain(): Promise<void> {
  try {
    // 创建自定义链(如果不存在)
    await execAsync('iptables -t nat -N UROUTEROS_PORTFORWARD 2>/dev/null || true');
    
    // 清空自定义链
    await execAsync('iptables -t nat -F UROUTEROS_PORTFORWARD');
    
    // 确保自定义链被引用
    const { stdout } = await execAsync('iptables -t nat -L PREROUTING -n --line-numbers | grep UROUTEROS_PORTFORWARD || true');
    if (!stdout.trim()) {
      await execAsync('iptables -t nat -A PREROUTING -j UROUTEROS_PORTFORWARD');
    }
  } catch (error) {
    console.error('Failed to clear port forwarding chain:', error);
    throw error;
  }
}

/**
 * 添加单条端口转发规则
 */
async function addPortForwardingRule(rule: PortForwardingRule): Promise<void> {
  const protocol = rule.protocol === 'both' ? 'tcp,udp' : rule.protocol;
  
  // DNAT规则: 外部端口 -> 内部IP:端口
  const dnatCmd = [
    'iptables -t nat -A UROUTEROS_PORTFORWARD',
    `-p ${protocol}`,
    `--dport ${rule.externalPort}`,
    `-j DNAT --to-destination ${rule.internalIp}:${rule.internalPort}`,
    `-m comment --comment "URouterOS: ${rule.name}"`,
  ].join(' ');

  await execAsync(dnatCmd);

  // FORWARD规则: 允许转发的流量通过
  const forwardCmd = [
    'iptables -A FORWARD',
    `-p ${protocol}`,
    `-d ${rule.internalIp}`,
    `--dport ${rule.internalPort}`,
    '-j ACCEPT',
    `-m comment --comment "URouterOS: ${rule.name}"`,
  ].join(' ');

  await execAsync(forwardCmd);
}

/**
 * 验证IP地址格式
 */
export function validateIpAddress(ip: string): boolean {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) return false;
  
  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}

/**
 * 验证端口格式(支持单个端口或端口范围)
 */
export function validatePort(port: string): boolean {
  // 单个端口
  if (/^\d+$/.test(port)) {
    const num = parseInt(port, 10);
    return num >= 1 && num <= 65535;
  }

  // 端口范围
  if (/^\d+-\d+$/.test(port)) {
    const [start, end] = port.split('-').map(p => parseInt(p, 10));
    return start >= 1 && start <= 65535 && end >= 1 && end <= 65535 && start < end;
  }

  return false;
}

/**
 * 获取当前NAT规则
 */
export async function getCurrentNatRules(): Promise<string> {
  try {
    const { stdout } = await execAsync('iptables -t nat -L UROUTEROS_PORTFORWARD -n --line-numbers');
    return stdout;
  } catch (error) {
    console.error('Failed to get current NAT rules:', error);
    return '';
  }
}
