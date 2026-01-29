/**
 * 防火墙服务
 * 管理iptables规则、NAT、端口转发等
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export interface FirewallRule {
  id: string;
  name: string;
  chain: 'INPUT' | 'OUTPUT' | 'FORWARD';
  protocol: 'tcp' | 'udp' | 'both' | 'all';
  source_ip: string;
  source_port: string;
  dest_ip: string;
  dest_port: string;
  action: 'ACCEPT' | 'DROP' | 'REJECT';
  enabled: boolean;
}

export interface PortForwardRule {
  id: string;
  name: string;
  protocol: 'tcp' | 'udp' | 'both';
  external_port: string;
  internal_ip: string;
  internal_port: string;
  enabled: boolean;
}

export interface NATRule {
  id: string;
  name: string;
  type: 'SNAT' | 'DNAT' | 'MASQUERADE';
  source_network: string;
  dest_network: string;
  interface: string;
  enabled: boolean;
}

const RULES_CONFIG_FILE = '/etc/urouteros/firewall_rules.json';

interface FirewallConfig {
  rules: FirewallRule[];
  portForwards: PortForwardRule[];
  natRules: NATRule[];
}

/**
 * 加载防火墙配置
 */
async function loadConfig(): Promise<FirewallConfig> {
  try {
    const content = await fs.readFile(RULES_CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return {
      rules: [],
      portForwards: [],
      natRules: [],
    };
  }
}

/**
 * 保存防火墙配置
 */
async function saveConfig(config: FirewallConfig): Promise<void> {
  try {
    await fs.mkdir('/etc/urouteros', { recursive: true });
    await fs.writeFile(RULES_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save firewall config:', error);
    throw new Error(`保存配置失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 解析iptables规则
 */
async function parseIptablesRules(): Promise<FirewallRule[]> {
  try {
    const { stdout } = await execAsync('iptables -L -n -v --line-numbers');
    const rules: FirewallRule[] = [];
    
    // 这里简化处理,实际应该解析iptables输出
    // 由于iptables输出格式复杂,我们主要依赖配置文件
    
    return rules;
  } catch (error) {
    console.error('Failed to parse iptables rules:', error);
    return [];
  }
}

/**
 * 构建iptables命令
 */
function buildIptablesCommand(rule: FirewallRule, action: 'add' | 'delete'): string {
  const cmd = action === 'add' ? 'iptables -A' : 'iptables -D';
  let command = `${cmd} ${rule.chain}`;
  
  // 协议
  if (rule.protocol !== 'all') {
    if (rule.protocol === 'both') {
      // 需要分别添加TCP和UDP规则
      command += ' -p tcp';
    } else {
      command += ` -p ${rule.protocol}`;
    }
  }
  
  // 源IP
  if (rule.source_ip && rule.source_ip !== '*' && rule.source_ip !== '0.0.0.0/0') {
    command += ` -s ${rule.source_ip}`;
  }
  
  // 源端口
  if (rule.source_port && rule.source_port !== '*') {
    command += ` --sport ${rule.source_port}`;
  }
  
  // 目标IP
  if (rule.dest_ip && rule.dest_ip !== '*') {
    command += ` -d ${rule.dest_ip}`;
  }
  
  // 目标端口
  if (rule.dest_port && rule.dest_port !== '*') {
    command += ` --dport ${rule.dest_port}`;
  }
  
  // 动作
  command += ` -j ${rule.action}`;
  
  // 添加注释
  command += ` -m comment --comment "${rule.name}"`;
  
  return command;
}

/**
 * 应用iptables规则
 */
async function applyIptablesRule(rule: FirewallRule): Promise<void> {
  try {
    const command = buildIptablesCommand(rule, 'add');
    
    // 如果是both协议,需要分别添加TCP和UDP规则
    if (rule.protocol === 'both') {
      const tcpCommand = command.replace('-p tcp', '-p tcp');
      const udpCommand = command.replace('-p tcp', '-p udp');
      await execAsync(tcpCommand);
      await execAsync(udpCommand);
    } else {
      await execAsync(command);
    }
  } catch (error) {
    throw new Error(`应用规则失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 删除iptables规则
 */
async function removeIptablesRule(rule: FirewallRule): Promise<void> {
  try {
    const command = buildIptablesCommand(rule, 'delete');
    
    if (rule.protocol === 'both') {
      const tcpCommand = command.replace('-p tcp', '-p tcp');
      const udpCommand = command.replace('-p tcp', '-p udp');
      try {
        await execAsync(tcpCommand);
      } catch (e) {
        // 忽略删除失败
      }
      try {
        await execAsync(udpCommand);
      } catch (e) {
        // 忽略删除失败
      }
    } else {
      try {
        await execAsync(command);
      } catch (e) {
        // 忽略删除失败
      }
    }
  } catch (error) {
    console.error('Failed to remove iptables rule:', error);
  }
}

/**
 * 列出所有防火墙规则
 */
export async function listFirewallRules(): Promise<FirewallRule[]> {
  const config = await loadConfig();
  return config.rules;
}

/**
 * 添加防火墙规则
 */
export async function addFirewallRule(rule: Omit<FirewallRule, 'id'>): Promise<FirewallRule> {
  const config = await loadConfig();
  
  const newRule: FirewallRule = {
    ...rule,
    id: generateId(),
  };
  
  // 如果启用,立即应用到iptables
  if (newRule.enabled) {
    await applyIptablesRule(newRule);
  }
  
  config.rules.push(newRule);
  await saveConfig(config);
  
  return newRule;
}

/**
 * 更新防火墙规则
 */
export async function updateFirewallRule(id: string, updates: Partial<FirewallRule>): Promise<FirewallRule> {
  const config = await loadConfig();
  const ruleIndex = config.rules.findIndex(r => r.id === id);
  
  if (ruleIndex === -1) {
    throw new Error('规则不存在');
  }
  
  const oldRule = config.rules[ruleIndex];
  
  // 如果规则已启用,先删除旧规则
  if (oldRule.enabled) {
    await removeIptablesRule(oldRule);
  }
  
  // 更新规则
  const updatedRule = {
    ...oldRule,
    ...updates,
  };
  
  // 如果新规则启用,应用到iptables
  if (updatedRule.enabled) {
    await applyIptablesRule(updatedRule);
  }
  
  config.rules[ruleIndex] = updatedRule;
  await saveConfig(config);
  
  return updatedRule;
}

/**
 * 删除防火墙规则
 */
export async function deleteFirewallRule(id: string): Promise<void> {
  const config = await loadConfig();
  const rule = config.rules.find(r => r.id === id);
  
  if (!rule) {
    throw new Error('规则不存在');
  }
  
  // 如果规则已启用,从iptables删除
  if (rule.enabled) {
    await removeIptablesRule(rule);
  }
  
  config.rules = config.rules.filter(r => r.id !== id);
  await saveConfig(config);
}

/**
 * 启用/禁用防火墙规则
 */
export async function toggleFirewallRule(id: string, enabled: boolean): Promise<void> {
  const config = await loadConfig();
  const rule = config.rules.find(r => r.id === id);
  
  if (!rule) {
    throw new Error('规则不存在');
  }
  
  if (enabled && !rule.enabled) {
    // 启用规则
    await applyIptablesRule(rule);
    rule.enabled = true;
  } else if (!enabled && rule.enabled) {
    // 禁用规则
    await removeIptablesRule(rule);
    rule.enabled = false;
  }
  
  await saveConfig(config);
}

/**
 * 列出所有端口转发规则
 */
export async function listPortForwardRules(): Promise<PortForwardRule[]> {
  const config = await loadConfig();
  return config.portForwards;
}

/**
 * 添加端口转发规则
 */
export async function addPortForwardRule(rule: Omit<PortForwardRule, 'id'>): Promise<PortForwardRule> {
  const config = await loadConfig();
  
  const newRule: PortForwardRule = {
    ...rule,
    id: generateId(),
  };
  
  // 如果启用,立即应用
  if (newRule.enabled) {
    await applyPortForward(newRule);
  }
  
  config.portForwards.push(newRule);
  await saveConfig(config);
  
  return newRule;
}

/**
 * 应用端口转发规则
 */
async function applyPortForward(rule: PortForwardRule): Promise<void> {
  try {
    const protocols = rule.protocol === 'both' ? ['tcp', 'udp'] : [rule.protocol];
    
    for (const proto of protocols) {
      // DNAT规则(目标地址转换)
      const dnatCmd = `iptables -t nat -A PREROUTING -p ${proto} --dport ${rule.external_port} -j DNAT --to-destination ${rule.internal_ip}:${rule.internal_port}`;
      await execAsync(dnatCmd);
      
      // FORWARD规则(允许转发)
      const forwardCmd = `iptables -A FORWARD -p ${proto} -d ${rule.internal_ip} --dport ${rule.internal_port} -j ACCEPT`;
      await execAsync(forwardCmd);
    }
  } catch (error) {
    throw new Error(`应用端口转发失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 删除端口转发规则
 */
export async function deletePortForwardRule(id: string): Promise<void> {
  const config = await loadConfig();
  const rule = config.portForwards.find(r => r.id === id);
  
  if (!rule) {
    throw new Error('规则不存在');
  }
  
  if (rule.enabled) {
    await removePortForward(rule);
  }
  
  config.portForwards = config.portForwards.filter(r => r.id !== id);
  await saveConfig(config);
}

/**
 * 删除端口转发规则
 */
async function removePortForward(rule: PortForwardRule): Promise<void> {
  try {
    const protocols = rule.protocol === 'both' ? ['tcp', 'udp'] : [rule.protocol];
    
    for (const proto of protocols) {
      try {
        const dnatCmd = `iptables -t nat -D PREROUTING -p ${proto} --dport ${rule.external_port} -j DNAT --to-destination ${rule.internal_ip}:${rule.internal_port}`;
        await execAsync(dnatCmd);
      } catch (e) {
        // 忽略删除失败
      }
      
      try {
        const forwardCmd = `iptables -D FORWARD -p ${proto} -d ${rule.internal_ip} --dport ${rule.internal_port} -j ACCEPT`;
        await execAsync(forwardCmd);
      } catch (e) {
        // 忽略删除失败
      }
    }
  } catch (error) {
    console.error('Failed to remove port forward:', error);
  }
}

/**
 * 列出所有NAT规则
 */
export async function listNATRules(): Promise<NATRule[]> {
  const config = await loadConfig();
  return config.natRules;
}

/**
 * 添加NAT规则
 */
export async function addNATRule(rule: Omit<NATRule, 'id'>): Promise<NATRule> {
  const config = await loadConfig();
  
  const newRule: NATRule = {
    ...rule,
    id: generateId(),
  };
  
  if (newRule.enabled) {
    await applyNATRule(newRule);
  }
  
  config.natRules.push(newRule);
  await saveConfig(config);
  
  return newRule;
}

/**
 * 应用NAT规则
 */
async function applyNATRule(rule: NATRule): Promise<void> {
  try {
    let command = 'iptables -t nat -A POSTROUTING';
    
    if (rule.source_network) {
      command += ` -s ${rule.source_network}`;
    }
    
    if (rule.dest_network) {
      command += ` -d ${rule.dest_network}`;
    }
    
    if (rule.interface) {
      command += ` -o ${rule.interface}`;
    }
    
    if (rule.type === 'MASQUERADE') {
      command += ' -j MASQUERADE';
    } else {
      command += ` -j ${rule.type}`;
    }
    
    await execAsync(command);
  } catch (error) {
    throw new Error(`应用NAT规则失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 删除NAT规则
 */
export async function deleteNATRule(id: string): Promise<void> {
  const config = await loadConfig();
  const rule = config.natRules.find(r => r.id === id);
  
  if (!rule) {
    throw new Error('规则不存在');
  }
  
  if (rule.enabled) {
    await removeNATRule(rule);
  }
  
  config.natRules = config.natRules.filter(r => r.id !== id);
  await saveConfig(config);
}

/**
 * 删除NAT规则
 */
async function removeNATRule(rule: NATRule): Promise<void> {
  try {
    let command = 'iptables -t nat -D POSTROUTING';
    
    if (rule.source_network) {
      command += ` -s ${rule.source_network}`;
    }
    
    if (rule.dest_network) {
      command += ` -d ${rule.dest_network}`;
    }
    
    if (rule.interface) {
      command += ` -o ${rule.interface}`;
    }
    
    if (rule.type === 'MASQUERADE') {
      command += ' -j MASQUERADE';
    } else {
      command += ` -j ${rule.type}`;
    }
    
    try {
      await execAsync(command);
    } catch (e) {
      // 忽略删除失败
    }
  } catch (error) {
    console.error('Failed to remove NAT rule:', error);
  }
}

/**
 * 重新加载所有防火墙规则
 */
export async function reloadAllRules(): Promise<void> {
  const config = await loadConfig();
  
  // 清空现有规则
  try {
    await execAsync('iptables -F');
    await execAsync('iptables -t nat -F');
  } catch (error) {
    console.error('Failed to flush iptables:', error);
  }
  
  // 重新应用所有启用的规则
  for (const rule of config.rules) {
    if (rule.enabled) {
      try {
        await applyIptablesRule(rule);
      } catch (error) {
        console.error(`Failed to apply rule ${rule.name}:`, error);
      }
    }
  }
  
  for (const rule of config.portForwards) {
    if (rule.enabled) {
      try {
        await applyPortForward(rule);
      } catch (error) {
        console.error(`Failed to apply port forward ${rule.name}:`, error);
      }
    }
  }
  
  for (const rule of config.natRules) {
    if (rule.enabled) {
      try {
        await applyNATRule(rule);
      } catch (error) {
        console.error(`Failed to apply NAT rule ${rule.name}:`, error);
      }
    }
  }
}

/**
 * 获取防火墙区域列表
 * 从系统配置中读取实际存在的防火墙区域
 */
export async function listFirewallZones(): Promise<string[]> {
  try {
    // 尝试从 firewalld 读取区域
    try {
      const { stdout } = await execAsync('firewall-cmd --get-zones 2>/dev/null');
      if (stdout.trim()) {
        return stdout.trim().split(/\s+/);
      }
    } catch (error) {
      // firewalld 不可用，继续尝试其他方法
    }
    
    // 尝试从 /etc/firewalld/zones 目录读取
    try {
      const zonesDir = '/etc/firewalld/zones';
      const files = await fs.readdir(zonesDir);
      const zones = files
        .filter(f => f.endsWith('.xml'))
        .map(f => f.replace('.xml', ''));
      if (zones.length > 0) {
        return zones;
      }
    } catch (error) {
      // 目录不存在
    }
    
    // 如果以上方法都失败，返回默认的常用区域
    return ['wan', 'lan', 'guest', 'dmz'];
  } catch (error) {
    console.error('Failed to list firewall zones:', error);
    // 发生错误时返回默认区域
    return ['wan', 'lan', 'guest', 'dmz'];
  }
}

/**
 * 获取防火墙状态
 */
export async function getFirewallStatus(): Promise<{
  enabled: boolean;
  rulesCount: number;
  chains: string[];
}> {
  try {
    const { stdout } = await execAsync('iptables -L -n');
    const lines = stdout.split('\n');
    
    // 统计规则数量
    const rulesCount = lines.filter(line => line.trim() && !line.startsWith('Chain') && !line.startsWith('target')).length;
    
    // 提取链名称
    const chains: string[] = [];
    for (const line of lines) {
      const match = line.match(/^Chain (\S+)/);
      if (match) {
        chains.push(match[1]);
      }
    }
    
    return {
      enabled: true,
      rulesCount,
      chains,
    };
  } catch (error) {
    return {
      enabled: false,
      rulesCount: 0,
      chains: [],
    };
  }
}
