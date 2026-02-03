/**
 * 防火墙自定义规则配置应用器
 * 负责将数据库中的防火墙规则应用到系统(iptables)
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface FirewallRule {
  id: number;
  name: string;
  action: string;
  protocol: string | null;
  sourceZone: string | null;
  sourceIp: string | null;
  sourcePort: string | null;
  destZone: string | null;
  destIp: string | null;
  destPort: string | null;
  priority: number | null;
  enabled: number | null;
}

/**
 * 应用所有防火墙自定义规则到系统
 */
export async function applyFirewallRules(rules: FirewallRule[]): Promise<{ success: boolean; message: string }> {
  try {
    // 只使用启用的规则
    const enabledRules = rules.filter(r => r.enabled === 1);

    // 按优先级排序(数字越小优先级越高)
    enabledRules.sort((a, b) => (a.priority || 999) - (b.priority || 999));

    // 清除现有的自定义规则链
    await clearFirewallChain();

    // 添加新规则
    const errors: string[] = [];
    let successCount = 0;

    for (const rule of enabledRules) {
      try {
        await addFirewallRule(rule);
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
      message: `成功应用${successCount}条防火墙规则` 
    };
  } catch (error) {
    console.error('Failed to apply firewall rules:', error);
    return { 
      success: false, 
      message: `应用配置失败: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * 清除URouterOS防火墙自定义链
 */
async function clearFirewallChain(): Promise<void> {
  try {
    // 创建自定义链(如果不存在)
    await execAsync('iptables -N UROUTEROS_CUSTOM 2>/dev/null || true');
    
    // 清空自定义链
    await execAsync('iptables -F UROUTEROS_CUSTOM');
    
    // 确保自定义链被引用(在INPUT链的开头)
    const { stdout } = await execAsync('iptables -L INPUT -n --line-numbers | grep UROUTEROS_CUSTOM || true');
    if (!stdout.trim()) {
      await execAsync('iptables -I INPUT 1 -j UROUTEROS_CUSTOM');
    }

    // 确保自定义链被引用(在FORWARD链的开头)
    const { stdout: forwardOut } = await execAsync('iptables -L FORWARD -n --line-numbers | grep UROUTEROS_CUSTOM || true');
    if (!forwardOut.trim()) {
      await execAsync('iptables -I FORWARD 1 -j UROUTEROS_CUSTOM');
    }
  } catch (error) {
    console.error('Failed to clear firewall chain:', error);
    throw error;
  }
}

/**
 * 添加单条防火墙规则
 */
async function addFirewallRule(rule: FirewallRule): Promise<void> {
  const parts = ['iptables -A UROUTEROS_CUSTOM'];

  // 协议
  if (rule.protocol && rule.protocol !== 'all') {
    parts.push(`-p ${rule.protocol}`);
  }

  // 源IP
  if (rule.sourceIp) {
    parts.push(`-s ${rule.sourceIp}`);
  }

  // 源端口
  if (rule.sourcePort && rule.protocol && rule.protocol !== 'all' && rule.protocol !== 'icmp') {
    parts.push(`--sport ${rule.sourcePort}`);
  }

  // 目标IP
  if (rule.destIp) {
    parts.push(`-d ${rule.destIp}`);
  }

  // 目标端口
  if (rule.destPort && rule.protocol && rule.protocol !== 'all' && rule.protocol !== 'icmp') {
    parts.push(`--dport ${rule.destPort}`);
  }

  // 动作
  const action = rule.action.toUpperCase();
  parts.push(`-j ${action}`);

  // 注释
  parts.push(`-m comment --comment "URouterOS: ${rule.name}"`);

  const cmd = parts.join(' ');
  await execAsync(cmd);
}

/**
 * 验证IP地址或CIDR格式
 */
export function validateIpOrCIDR(ip: string): boolean {
  // IP地址
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipRegex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  // CIDR
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  if (cidrRegex.test(ip)) {
    const [ipPart, prefix] = ip.split('/');
    const parts = ipPart.split('.');
    
    if (!parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    })) {
      return false;
    }

    const prefixNum = parseInt(prefix, 10);
    return prefixNum >= 0 && prefixNum <= 32;
  }

  return false;
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
  if (/^\d+:\d+$/.test(port)) {
    const [start, end] = port.split(':').map(p => parseInt(p, 10));
    return start >= 1 && start <= 65535 && end >= 1 && end <= 65535 && start < end;
  }

  return false;
}

/**
 * 获取当前防火墙规则
 */
export async function getCurrentFirewallRules(): Promise<string> {
  try {
    const { stdout } = await execAsync('iptables -L UROUTEROS_CUSTOM -n --line-numbers -v');
    return stdout;
  } catch (error) {
    console.error('Failed to get current firewall rules:', error);
    return '';
  }
}
