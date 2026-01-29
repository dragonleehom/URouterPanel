/**
 * Netplan网络配置后端
 * Ubuntu 18.04+ 默认使用Netplan
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as yaml from 'yaml';
import type { NetworkBackendInterface, SystemNetworkConfig, ConfiguredPort } from './types';
import { physicalInterfaceMonitor } from './physicalInterfaceMonitor';

const execAsync = promisify(exec);

export class NetplanBackend implements NetworkBackendInterface {
  private readonly configPath = '/etc/netplan/99-urouteros.yaml';
  
  async readSystemConfig(): Promise<SystemNetworkConfig> {
    // 获取物理接口列表
    const interfaces = await physicalInterfaceMonitor.listPhysicalInterfaces();
    
    // 读取Netplan配置
    const configuredPorts: ConfiguredPort[] = [];
    
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const config = yaml.parse(content);
      
      if (config?.network?.ethernets) {
        for (const [ifname, ifconfig] of Object.entries(config.network.ethernets)) {
          const port = this.parseNetplanInterface(ifname, ifconfig as any);
          if (port) {
            configuredPorts.push(port);
          }
        }
      }
      
      if (config?.network?.bridges) {
        for (const [ifname, ifconfig] of Object.entries(config.network.bridges)) {
          const port = this.parseNetplanBridge(ifname, ifconfig as any);
          if (port) {
            configuredPorts.push(port);
          }
        }
      }
    } catch (error) {
      console.log('[Netplan] No existing config found, will create new');
    }
    
    return {
      interfaces,
      configuredPorts,
    };
  }
  
  private parseNetplanInterface(ifname: string, config: any): ConfiguredPort | null {
    // 判断类型(WAN/LAN)
    const type = ifname.toLowerCase().includes('wan') ? 'wan' : 'lan';
    
    let protocol: 'static' | 'dhcp' | 'pppoe' = 'static';
    let ipaddr: string | undefined;
    let netmask: string | undefined;
    let gateway: string | undefined;
    let dns: string | undefined;
    
    if (config.dhcp4 === true) {
      protocol = 'dhcp';
    } else if (config.addresses && config.addresses.length > 0) {
      protocol = 'static';
      const [ip, cidr] = config.addresses[0].split('/');
      ipaddr = ip;
      netmask = this.cidrToNetmask(parseInt(cidr));
      
      if (config.routes && config.routes.length > 0) {
        gateway = config.routes[0].via;
      }
      
      if (config.nameservers?.addresses) {
        dns = config.nameservers.addresses.join(',');
      }
    }
    
    return {
      name: ifname,
      type,
      physicalInterfaces: [ifname],
      protocol,
      enabled: true,
      ipaddr,
      netmask,
      gateway,
      dns,
    };
  }
  
  private parseNetplanBridge(ifname: string, config: any): ConfiguredPort | null {
    const type = ifname.toLowerCase().includes('wan') ? 'wan' : 'lan';
    
    let protocol: 'static' | 'dhcp' | 'pppoe' = 'static';
    let ipaddr: string | undefined;
    let netmask: string | undefined;
    let gateway: string | undefined;
    let dns: string | undefined;
    
    if (config.dhcp4 === true) {
      protocol = 'dhcp';
    } else if (config.addresses && config.addresses.length > 0) {
      protocol = 'static';
      const [ip, cidr] = config.addresses[0].split('/');
      ipaddr = ip;
      netmask = this.cidrToNetmask(parseInt(cidr));
      
      if (config.routes && config.routes.length > 0) {
        gateway = config.routes[0].via;
      }
      
      if (config.nameservers?.addresses) {
        dns = config.nameservers.addresses.join(',');
      }
    }
    
    const physicalInterfaces = config.interfaces || [];
    
    return {
      name: ifname,
      type,
      physicalInterfaces,
      protocol,
      enabled: true,
      ipaddr,
      netmask,
      gateway,
      dns,
    };
  }
  
  async applyConfig(port: ConfiguredPort): Promise<void> {
    // 读取现有配置
    let config: any = {
      network: {
        version: 2,
        renderer: 'networkd',
        ethernets: {},
        bridges: {},
      },
    };
    
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      config = yaml.parse(content) || config;
    } catch (error) {
      // 文件不存在,使用默认配置
    }
    
    // 如果有多个物理接口,创建网桥
    if (port.physicalInterfaces.length > 1) {
      // 创建网桥
      const bridgeConfig: any = {
        interfaces: port.physicalInterfaces,
      };
      
      if (port.protocol === 'dhcp') {
        bridgeConfig.dhcp4 = true;
      } else if (port.protocol === 'static' && port.ipaddr && port.netmask) {
        const cidr = this.netmaskToCIDR(port.netmask);
        bridgeConfig.addresses = [`${port.ipaddr}/${cidr}`];
        
        if (port.gateway) {
          bridgeConfig.routes = [
            {
              to: 'default',
              via: port.gateway,
            },
          ];
        }
        
        if (port.dns) {
          bridgeConfig.nameservers = {
            addresses: port.dns.split(',').map(s => s.trim()),
          };
        }
      }
      
      config.network.bridges = config.network.bridges || {};
      config.network.bridges[port.name] = bridgeConfig;
      
      // 确保物理接口不被单独配置
      for (const iface of port.physicalInterfaces) {
        delete config.network.ethernets[iface];
      }
    } else {
      // 单个物理接口
      const ifname = port.physicalInterfaces[0] || port.name;
      const ethConfig: any = {};
      
      if (port.protocol === 'dhcp') {
        ethConfig.dhcp4 = true;
      } else if (port.protocol === 'static' && port.ipaddr && port.netmask) {
        const cidr = this.netmaskToCIDR(port.netmask);
        ethConfig.addresses = [`${port.ipaddr}/${cidr}`];
        
        if (port.gateway) {
          ethConfig.routes = [
            {
              to: 'default',
              via: port.gateway,
            },
          ];
        }
        
        if (port.dns) {
          ethConfig.nameservers = {
            addresses: port.dns.split(',').map(s => s.trim()),
          };
        }
      }
      
      config.network.ethernets = config.network.ethernets || {};
      config.network.ethernets[ifname] = ethConfig;
    }
    
    // 写入配置文件
    const yamlContent = yaml.stringify(config);
    await fs.writeFile(this.configPath, yamlContent, 'utf-8');
    
    // 应用配置
    await execAsync('netplan apply');
    
    console.log(`[Netplan] Applied config for ${port.name}`);
  }
  
  async validateConfig(port: ConfiguredPort): Promise<boolean> {
    // 基本验证
    if (!port.name || !port.physicalInterfaces || port.physicalInterfaces.length === 0) {
      return false;
    }
    
    if (port.protocol === 'static') {
      if (!port.ipaddr || !port.netmask) {
        return false;
      }
      
      // 验证IP地址格式
      if (!/^\d+\.\d+\.\d+\.\d+$/.test(port.ipaddr)) {
        return false;
      }
      
      if (port.gateway && !/^\d+\.\d+\.\d+\.\d+$/.test(port.gateway)) {
        return false;
      }
    }
    
    return true;
  }
  
  async removeConfig(portName: string): Promise<void> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const config = yaml.parse(content);
      
      if (config?.network?.ethernets) {
        delete config.network.ethernets[portName];
      }
      
      if (config?.network?.bridges) {
        delete config.network.bridges[portName];
      }
      
      const yamlContent = yaml.stringify(config);
      await fs.writeFile(this.configPath, yamlContent, 'utf-8');
      
      await execAsync('netplan apply');
      
      console.log(`[Netplan] Removed config for ${portName}`);
    } catch (error) {
      console.error(`[Netplan] Failed to remove config:`, error);
      throw error;
    }
  }
  
  private netmaskToCIDR(netmask: string): number {
    const parts = netmask.split('.').map(Number);
    let cidr = 0;
    for (const part of parts) {
      cidr += part.toString(2).split('1').length - 1;
    }
    return cidr;
  }
  
  private cidrToNetmask(cidr: number): string {
    const mask = [];
    for (let i = 0; i < 4; i++) {
      const n = Math.min(cidr, 8);
      mask.push(256 - Math.pow(2, 8 - n));
      cidr -= n;
    }
    return mask.join('.');
  }
}
