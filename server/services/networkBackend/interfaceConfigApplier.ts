/**
 * Interface Configuration Applier Service
 * 
 * This module applies network interface configurations to the system.
 * It handles DHCP client, DNS, IPv6, routing, DHCP server, and firewall configurations.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile } from 'fs/promises';

const execAsync = promisify(exec);

export interface InterfaceConfig {
  interfaceName: string;
  protocol: string;
  
  // DHCP Client Settings
  autoStart?: boolean;
  dhcpHostname?: string;
  useBroadcastFlag?: boolean;
  overrideDhcpServerId?: string;
  overrideDhcpClientId?: string;
  
  // DNS Settings
  useDefaultGateway?: boolean;
  useCustomDns?: boolean;
  customDnsServers?: string;
  
  // IPv6 Settings
  delegateIpv6Prefix?: boolean;
  ipv6AssignmentLength?: number;
  ipv6PrefixFilter?: string;
  ipv6Suffix?: string;
  
  // Routing Settings
  overrideIpv4RouteTable?: string;
  overrideIpv6RouteTable?: string;
  useGatewayMetric?: boolean;
  gatewayMetric?: number;
  
  // DHCP Server Settings
  dhcpServerEnabled?: boolean;
  dhcpStartIp?: string;
  dhcpEndIp?: string;
  dhcpLeaseTime?: string;
  
  // Firewall Settings
  firewallZone?: string;
}

/**
 * Apply interface configuration to the system
 */
export async function applyInterfaceConfig(config: InterfaceConfig): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`[InterfaceConfigApplier] Applying configuration for ${config.interfaceName}`);
    
    // 1. Apply DHCP client configuration
    if (config.protocol === 'dhcp') {
      await applyDhcpClientConfig(config);
    }
    
    // 2. Apply DNS configuration
    if (config.useCustomDns && config.customDnsServers) {
      await applyDnsConfig(config);
    }
    
    // 3. Apply IPv6 configuration
    if (config.delegateIpv6Prefix) {
      await applyIpv6Config(config);
    }
    
    // 4. Apply routing configuration
    if (config.overrideIpv4RouteTable || config.overrideIpv6RouteTable) {
      await applyRoutingConfig(config);
    }
    
    // 5. Apply DHCP server configuration
    if (config.dhcpServerEnabled) {
      await applyDhcpServerConfig(config);
    }
    
    // 6. Apply firewall zone binding
    if (config.firewallZone) {
      await applyFirewallZone(config);
    }
    
    console.log(`[InterfaceConfigApplier] Configuration applied successfully for ${config.interfaceName}`);
    return { success: true, message: '配置应用成功' };
    
  } catch (error) {
    console.error(`[InterfaceConfigApplier] Failed to apply configuration:`, error);
    return { 
      success: false, 
      message: `配置应用失败: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Apply DHCP client configuration using NetworkManager
 */
async function applyDhcpClientConfig(config: InterfaceConfig): Promise<void> {
  const { interfaceName, dhcpHostname, useBroadcastFlag } = config;
  
  console.log(`[DHCP Client] Configuring ${interfaceName}`);
  
  // Check if NetworkManager is available
  try {
    await execAsync('which nmcli');
  } catch {
    console.warn('[DHCP Client] NetworkManager not available, skipping DHCP client configuration');
    return;
  }
  
  // Set DHCP hostname if specified
  if (dhcpHostname && dhcpHostname !== 'default') {
    try {
      await execAsync(`nmcli connection modify ${interfaceName} ipv4.dhcp-hostname "${dhcpHostname}"`);
      console.log(`[DHCP Client] Set DHCP hostname to ${dhcpHostname}`);
    } catch (error) {
      console.error('[DHCP Client] Failed to set DHCP hostname:', error);
    }
  }
  
  // Set broadcast flag if enabled
  if (useBroadcastFlag) {
    try {
      await execAsync(`nmcli connection modify ${interfaceName} ipv4.dhcp-send-hostname yes`);
      console.log('[DHCP Client] Enabled broadcast flag');
    } catch (error) {
      console.error('[DHCP Client] Failed to set broadcast flag:', error);
    }
  }
  
  // Restart the connection to apply changes
  try {
    await execAsync(`nmcli connection down ${interfaceName} && nmcli connection up ${interfaceName}`);
    console.log(`[DHCP Client] Restarted connection ${interfaceName}`);
  } catch (error) {
    console.error('[DHCP Client] Failed to restart connection:', error);
  }
}

/**
 * Apply DNS configuration
 */
async function applyDnsConfig(config: InterfaceConfig): Promise<void> {
  const { customDnsServers } = config;
  
  if (!customDnsServers) return;
  
  console.log(`[DNS] Configuring DNS servers: ${customDnsServers}`);
  
  const dnsServers = customDnsServers.split(',').map(s => s.trim());
  const resolvConfContent = dnsServers.map(dns => `nameserver ${dns}`).join('\n') + '\n';
  
  try {
    // Backup existing resolv.conf
    await execAsync('cp /etc/resolv.conf /etc/resolv.conf.backup');
    
    // Write new resolv.conf
    await writeFile('/etc/resolv.conf', resolvConfContent);
    console.log('[DNS] DNS configuration applied');
  } catch (error) {
    console.error('[DNS] Failed to apply DNS configuration:', error);
    throw error;
  }
}

/**
 * Apply IPv6 configuration using sysctl
 */
async function applyIpv6Config(config: InterfaceConfig): Promise<void> {
  const { interfaceName, ipv6AssignmentLength, ipv6Suffix } = config;
  
  console.log(`[IPv6] Configuring IPv6 for ${interfaceName}`);
  
  try {
    // Enable IPv6 forwarding
    await execAsync('sysctl -w net.ipv6.conf.all.forwarding=1');
    
    // Enable IPv6 on the interface
    await execAsync(`sysctl -w net.ipv6.conf.${interfaceName}.disable_ipv6=0`);
    
    // Accept Router Advertisements
    await execAsync(`sysctl -w net.ipv6.conf.${interfaceName}.accept_ra=2`);
    
    console.log('[IPv6] IPv6 configuration applied');
  } catch (error) {
    console.error('[IPv6] Failed to apply IPv6 configuration:', error);
    throw error;
  }
}

/**
 * Apply routing configuration
 */
async function applyRoutingConfig(config: InterfaceConfig): Promise<void> {
  const { interfaceName, overrideIpv4RouteTable, overrideIpv6RouteTable, gatewayMetric } = config;
  
  console.log(`[Routing] Configuring routing for ${interfaceName}`);
  
  try {
    // Apply IPv4 route table override
    if (overrideIpv4RouteTable && overrideIpv4RouteTable !== 'default') {
      const tableId = parseInt(overrideIpv4RouteTable);
      if (!isNaN(tableId)) {
        await execAsync(`ip route add default dev ${interfaceName} table ${tableId}`);
        console.log(`[Routing] Added IPv4 route to table ${tableId}`);
      }
    }
    
    // Apply IPv6 route table override
    if (overrideIpv6RouteTable && overrideIpv6RouteTable !== 'default') {
      const tableId = parseInt(overrideIpv6RouteTable);
      if (!isNaN(tableId)) {
        await execAsync(`ip -6 route add default dev ${interfaceName} table ${tableId}`);
        console.log(`[Routing] Added IPv6 route to table ${tableId}`);
      }
    }
    
    // Apply gateway metric
    if (gatewayMetric && gatewayMetric > 0) {
      await execAsync(`ip route change default dev ${interfaceName} metric ${gatewayMetric}`);
      console.log(`[Routing] Set gateway metric to ${gatewayMetric}`);
    }
    
  } catch (error) {
    console.error('[Routing] Failed to apply routing configuration:', error);
    // Don't throw - routing errors are non-fatal
  }
}

/**
 * Apply DHCP server configuration using dnsmasq
 */
async function applyDhcpServerConfig(config: InterfaceConfig): Promise<void> {
  const { interfaceName, dhcpStartIp, dhcpEndIp, dhcpLeaseTime } = config;
  
  console.log(`[DHCP Server] Configuring DHCP server for ${interfaceName}`);
  
  if (!dhcpStartIp || !dhcpEndIp) {
    console.warn('[DHCP Server] Missing DHCP IP range, skipping');
    return;
  }
  
  try {
    // Check if dnsmasq is available
    await execAsync('which dnsmasq');
  } catch {
    console.warn('[DHCP Server] dnsmasq not available, skipping DHCP server configuration');
    return;
  }
  
  // Generate dnsmasq configuration
  const leaseTime = dhcpLeaseTime || '12h';
  const dnsmasqConfig = `
# DHCP configuration for ${interfaceName}
interface=${interfaceName}
dhcp-range=${dhcpStartIp},${dhcpEndIp},${leaseTime}
`;
  
  try {
    // Write dnsmasq configuration
    await writeFile(`/etc/dnsmasq.d/${interfaceName}.conf`, dnsmasqConfig);
    
    // Restart dnsmasq
    await execAsync('systemctl restart dnsmasq');
    console.log('[DHCP Server] DHCP server configuration applied');
  } catch (error) {
    console.error('[DHCP Server] Failed to apply DHCP server configuration:', error);
    throw error;
  }
}

/**
 * Apply firewall zone binding using firewalld
 */
async function applyFirewallZone(config: InterfaceConfig): Promise<void> {
  const { interfaceName, firewallZone } = config;
  
  if (!firewallZone) return;
  
  console.log(`[Firewall] Binding ${interfaceName} to zone ${firewallZone}`);
  
  try {
    // Check if firewalld is available
    await execAsync('which firewall-cmd');
  } catch {
    console.warn('[Firewall] firewalld not available, skipping firewall zone binding');
    return;
  }
  
  try {
    // Remove interface from all zones first
    const { stdout: zones } = await execAsync('firewall-cmd --get-zones');
    for (const zone of zones.trim().split(/\s+/)) {
      try {
        await execAsync(`firewall-cmd --zone=${zone} --remove-interface=${interfaceName} --permanent`);
      } catch {
        // Interface might not be in this zone, ignore error
      }
    }
    
    // Add interface to the specified zone
    await execAsync(`firewall-cmd --zone=${firewallZone} --add-interface=${interfaceName} --permanent`);
    
    // Reload firewalld
    await execAsync('firewall-cmd --reload');
    
    console.log(`[Firewall] Interface ${interfaceName} bound to zone ${firewallZone}`);
  } catch (error) {
    console.error('[Firewall] Failed to bind interface to zone:', error);
    throw error;
  }
}

/**
 * Validate interface configuration
 */
export function validateInterfaceConfig(config: InterfaceConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate DHCP IP range
  if (config.dhcpServerEnabled && config.dhcpStartIp && config.dhcpEndIp) {
    if (!isValidIpAddress(config.dhcpStartIp)) {
      errors.push('DHCP起始IP地址格式不正确');
    }
    if (!isValidIpAddress(config.dhcpEndIp)) {
      errors.push('DHCP结束IP地址格式不正确');
    }
  }
  
  // Validate DNS servers
  if (config.useCustomDns && config.customDnsServers) {
    const dnsServers = config.customDnsServers.split(',').map(s => s.trim());
    for (const dns of dnsServers) {
      if (!isValidIpAddress(dns)) {
        errors.push(`DNS服务器地址格式不正确: ${dns}`);
      }
    }
  }
  
  // Validate gateway metric
  if (config.gatewayMetric !== undefined && (config.gatewayMetric < 0 || config.gatewayMetric > 9999)) {
    errors.push('网关跃点值必须在0-9999之间');
  }
  
  // Validate IPv6 assignment length
  if (config.ipv6AssignmentLength !== undefined && (config.ipv6AssignmentLength < 0 || config.ipv6AssignmentLength > 128)) {
    errors.push('IPv6分配长度必须在0-128之间');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if a string is a valid IP address
 */
function isValidIpAddress(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
  
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part);
      return num >= 0 && num <= 255;
    });
  }
  
  return ipv6Regex.test(ip);
}
