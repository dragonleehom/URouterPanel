/**
 * 无线网络服务
 * 检测无线硬件支持和管理无线网络配置
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface WirelessDevice {
  interface: string;
  driver: string;
  chipset: string;
  supported: boolean;
}

export interface WirelessCapability {
  hasWirelessHardware: boolean;
  devices: WirelessDevice[];
  message?: string;
}

/**
 * 检测系统是否支持无线网络
 */
export async function checkWirelessCapability(): Promise<WirelessCapability> {
  try {
    // 方法1: 使用iw命令检测无线设备
    try {
      const { stdout } = await execAsync('iw dev 2>/dev/null');
      if (stdout.trim()) {
        const devices = parseIwDevOutput(stdout);
        if (devices.length > 0) {
          return {
            hasWirelessHardware: true,
            devices,
            message: `检测到 ${devices.length} 个无线网卡`,
          };
        }
      }
    } catch (error) {
      // iw命令可能不存在或没有权限,继续尝试其他方法
    }

    // 方法2: 检查/sys/class/net目录下的无线接口
    try {
      const { stdout } = await execAsync('ls /sys/class/net/');
      const interfaces = stdout.trim().split('\n');
      const wirelessInterfaces: WirelessDevice[] = [];

      for (const iface of interfaces) {
        try {
          // 检查是否存在wireless目录(表示是无线接口)
          await execAsync(`test -d /sys/class/net/${iface}/wireless`);
          
          // 获取驱动信息
          let driver = 'unknown';
          try {
            const { stdout: driverOut } = await execAsync(`readlink /sys/class/net/${iface}/device/driver 2>/dev/null`);
            driver = driverOut.trim().split('/').pop() || 'unknown';
          } catch (e) {
            // 忽略错误
          }

          wirelessInterfaces.push({
            interface: iface,
            driver,
            chipset: 'unknown',
            supported: true,
          });
        } catch (error) {
          // 不是无线接口,跳过
        }
      }

      if (wirelessInterfaces.length > 0) {
        return {
          hasWirelessHardware: true,
          devices: wirelessInterfaces,
          message: `检测到 ${wirelessInterfaces.length} 个无线网卡`,
        };
      }
    } catch (error) {
      console.error('Failed to check /sys/class/net:', error);
    }

    // 方法3: 使用lspci检测无线网卡硬件
    try {
      const { stdout } = await execAsync('lspci | grep -i "network\\|wireless\\|wi-fi" 2>/dev/null');
      if (stdout.trim()) {
        const lines = stdout.trim().split('\n');
        const devices: WirelessDevice[] = lines.map((line, index) => ({
          interface: `未配置`,
          driver: 'unknown',
          chipset: line.split(':').slice(2).join(':').trim(),
          supported: false,
        }));

        return {
          hasWirelessHardware: true,
          devices,
          message: `检测到无线网卡硬件,但可能需要安装驱动或配置接口`,
        };
      }
    } catch (error) {
      // lspci可能不存在
    }

    // 没有检测到无线硬件
    return {
      hasWirelessHardware: false,
      devices: [],
      message: '未检测到无线网卡硬件。请确认:\n1. 硬件是否已正确安装\n2. 驱动是否已加载\n3. 是否需要外接USB无线网卡',
    };
  } catch (error) {
    console.error('Failed to check wireless capability:', error);
    return {
      hasWirelessHardware: false,
      devices: [],
      message: `检测失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * 解析iw dev命令输出
 */
function parseIwDevOutput(output: string): WirelessDevice[] {
  const devices: WirelessDevice[] = [];
  const lines = output.split('\n');
  let currentInterface: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // 匹配接口名称: "Interface wlan0"
    const interfaceMatch = trimmed.match(/^Interface\s+(\S+)/);
    if (interfaceMatch) {
      currentInterface = interfaceMatch[1];
      devices.push({
        interface: currentInterface,
        driver: 'unknown',
        chipset: 'unknown',
        supported: true,
      });
    }
  }

  return devices;
}

/**
 * 获取无线接口列表
 */
export async function getWirelessInterfaces(): Promise<WirelessDevice[]> {
  const capability = await checkWirelessCapability();
  return capability.devices;
}

/**
 * 检查指定接口是否为无线接口
 */
export async function isWirelessInterface(interfaceName: string): Promise<boolean> {
  try {
    await execAsync(`test -d /sys/class/net/${interfaceName}/wireless`);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * WiFi配置接口
 */
export interface WiFiConfig {
  ssid: string;
  password?: string;
  channel: number;
  interface: string;
  enabled: boolean;
  hidden?: boolean;
  country_code?: string;
}

export interface WiFiStatus {
  running: boolean;
  configured: boolean;
  ssid?: string;
  channel?: number;
  clients_count?: number;
}

export interface WiFiClient {
  mac: string;
  signal: number;
  rx_rate: number;
  tx_rate: number;
  connected_time: number;
}

const HOSTAPD_CONFIG_FILE = '/etc/hostapd/hostapd.conf';
const HOSTAPD_SERVICE = 'hostapd';

/**
 * 生成hostapd配置文件
 */
async function generateHostapdConfig(config: WiFiConfig): Promise<string> {
  const lines = [
    '# URouterOS hostapd configuration',
    `interface=${config.interface}`,
    `ssid=${config.ssid}`,
    `channel=${config.channel}`,
    `hw_mode=g`,
    `ieee80211n=1`,
    `wmm_enabled=1`,
    '',
  ];

  if (config.password && config.password.length >= 8) {
    lines.push('# WPA2 security');
    lines.push('wpa=2');
    lines.push(`wpa_passphrase=${config.password}`);
    lines.push('wpa_key_mgmt=WPA-PSK');
    lines.push('wpa_pairwise=TKIP CCMP');
    lines.push('rsn_pairwise=CCMP');
  } else {
    lines.push('# Open network (no security)');
  }

  if (config.hidden) {
    lines.push('');
    lines.push('# Hidden SSID');
    lines.push('ignore_broadcast_ssid=1');
  }

  if (config.country_code) {
    lines.push('');
    lines.push(`country_code=${config.country_code}`);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * 获取WiFi配置
 */
export async function getWiFiConfig(): Promise<WiFiConfig | null> {
  try {
    const fs = await import('fs/promises');
    const content = await fs.readFile(HOSTAPD_CONFIG_FILE, 'utf-8');
    
    const config: Partial<WiFiConfig> = {
      enabled: true,
    };

    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed) continue;

      if (trimmed.startsWith('interface=')) {
        config.interface = trimmed.split('=')[1];
      } else if (trimmed.startsWith('ssid=')) {
        config.ssid = trimmed.split('=')[1];
      } else if (trimmed.startsWith('channel=')) {
        config.channel = parseInt(trimmed.split('=')[1]);
      } else if (trimmed.startsWith('wpa_passphrase=')) {
        config.password = trimmed.split('=')[1];
      } else if (trimmed.startsWith('ignore_broadcast_ssid=')) {
        config.hidden = trimmed.split('=')[1] === '1';
      } else if (trimmed.startsWith('country_code=')) {
        config.country_code = trimmed.split('=')[1];
      }
    }

    return config as WiFiConfig;
  } catch (error) {
    console.error('Failed to read WiFi config:', error);
    return null;
  }
}

/**
 * 配置WiFi
 */
export async function configureWiFi(config: WiFiConfig): Promise<{ success: boolean; message: string }> {
  try {
    const fs = await import('fs/promises');
    
    // 验证配置
    if (!config.ssid || config.ssid.length < 1) {
      return { success: false, message: 'SSID不能为空' };
    }

    if (config.password && config.password.length > 0 && config.password.length < 8) {
      return { success: false, message: '密码长度至少为8个字符' };
    }

    if (!config.interface) {
      return { success: false, message: '未指定无线接口' };
    }

    // 检查接口是否存在
    const isWireless = await isWirelessInterface(config.interface);
    if (!isWireless) {
      return { success: false, message: `接口 ${config.interface} 不是无线接口` };
    }

    // 生成配置文件
    const configContent = await generateHostapdConfig(config);
    
    // 确保目录存在
    try {
      await fs.mkdir('/etc/hostapd', { recursive: true });
    } catch (error) {
      // 目录可能已存在
    }

    // 写入配置文件 (需要root权限)
    await execAsync(`echo '${configContent.replace(/'/g, "'\\''")}' | sudo tee ${HOSTAPD_CONFIG_FILE} > /dev/null`);

    return { success: true, message: 'WiFi配置已保存' };
  } catch (error) {
    console.error('Failed to configure WiFi:', error);
    return { success: false, message: `配置失败: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * 获取WiFi状态
 */
export async function getWiFiStatus(): Promise<WiFiStatus> {
  try {
    // 检查hostapd服务状态
    try {
      await execAsync(`systemctl is-active ${HOSTAPD_SERVICE}`);
      
      // 服务正在运行,获取详细信息
      const config = await getWiFiConfig();
      
      // 尝试获取客户端数量
      let clientsCount = 0;
      if (config?.interface) {
        try {
          const { stdout } = await execAsync(`iw dev ${config.interface} station dump | grep Station | wc -l`);
          clientsCount = parseInt(stdout.trim()) || 0;
        } catch (error) {
          // 无法获取客户端数量
        }
      }

      return {
        running: true,
        configured: config !== null,
        ssid: config?.ssid,
        channel: config?.channel,
        clients_count: clientsCount,
      };
    } catch (error) {
      // 服务未运行
      const config = await getWiFiConfig();
      return {
        running: false,
        configured: config !== null,
        ssid: config?.ssid,
        channel: config?.channel,
        clients_count: 0,
      };
    }
  } catch (error) {
    console.error('Failed to get WiFi status:', error);
    return {
      running: false,
      configured: false,
      clients_count: 0,
    };
  }
}

/**
 * 启动WiFi
 */
export async function startWiFi(): Promise<{ success: boolean; message: string }> {
  try {
    // 检查配置是否存在
    const config = await getWiFiConfig();
    if (!config) {
      return { success: false, message: '请先配置WiFi' };
    }

    // 启用无线接口 (需要root权限)
    await execAsync(`sudo ip link set ${config.interface} up`);

    // 启动hostapd服务 (需要root权限)
    await execAsync(`sudo systemctl start ${HOSTAPD_SERVICE}`);

    // 等待一下让服务启动
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 检查服务是否真的启动了
    try {
      await execAsync(`systemctl is-active ${HOSTAPD_SERVICE}`);
      return { success: true, message: 'WiFi已启动' };
    } catch (error) {
      // 获取服务日志
      const { stdout } = await execAsync(`sudo journalctl -u ${HOSTAPD_SERVICE} -n 10 --no-pager`);
      return { success: false, message: `WiFi启动失败,请检查日志:\n${stdout}` };
    }
  } catch (error) {
    console.error('Failed to start WiFi:', error);
    return { success: false, message: `启动失败: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * 停止WiFi
 */
export async function stopWiFi(): Promise<{ success: boolean; message: string }> {
  try {
    await execAsync(`sudo systemctl stop ${HOSTAPD_SERVICE}`);
    return { success: true, message: 'WiFi已停止' };
  } catch (error) {
    console.error('Failed to stop WiFi:', error);
    return { success: false, message: `停止失败: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * 重启WiFi
 */
export async function restartWiFi(): Promise<{ success: boolean; message: string }> {
  try {
    await execAsync(`sudo systemctl restart ${HOSTAPD_SERVICE}`);
    
    // 等待一下让服务重启
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 检查服务是否真的启动了
    try {
      await execAsync(`systemctl is-active ${HOSTAPD_SERVICE}`);
      return { success: true, message: 'WiFi已重启' };
    } catch (error) {
      return { success: false, message: 'WiFi重启失败,服务未能启动' };
    }
  } catch (error) {
    console.error('Failed to restart WiFi:', error);
    return { success: false, message: `重启失败: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * 获取WiFi客户端列表
 */
export async function getWiFiClients(iface: string): Promise<WiFiClient[]> {
  try {
    const { stdout } = await execAsync(`iw dev ${iface} station dump`);
    const clients: WiFiClient[] = [];
    
    const lines = stdout.split('\n');
    let currentMac: string | null = null;
    let currentClient: Partial<WiFiClient> = {};

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('Station ')) {
        // 保存上一个客户端
        if (currentMac && currentClient.mac) {
          clients.push(currentClient as WiFiClient);
        }
        
        // 开始新客户端
        currentMac = trimmed.split(' ')[1];
        currentClient = {
          mac: currentMac,
          signal: 0,
          rx_rate: 0,
          tx_rate: 0,
          connected_time: 0,
        };
      } else if (trimmed.startsWith('signal:')) {
        const signal = parseInt(trimmed.split(':')[1].trim().split(' ')[0]);
        currentClient.signal = signal;
      } else if (trimmed.startsWith('rx bitrate:')) {
        const rate = parseFloat(trimmed.split(':')[1].trim().split(' ')[0]);
        currentClient.rx_rate = rate;
      } else if (trimmed.startsWith('tx bitrate:')) {
        const rate = parseFloat(trimmed.split(':')[1].trim().split(' ')[0]);
        currentClient.tx_rate = rate;
      } else if (trimmed.startsWith('connected time:')) {
        const time = parseInt(trimmed.split(':')[1].trim().split(' ')[0]);
        currentClient.connected_time = time;
      }
    }

    // 保存最后一个客户端
    if (currentMac && currentClient.mac) {
      clients.push(currentClient as WiFiClient);
    }

    return clients;
  } catch (error) {
    console.error('Failed to get WiFi clients:', error);
    return [];
  }
}

/**
 * 断开WiFi客户端
 */
export async function disconnectWiFiClient(iface: string, mac: string): Promise<{ success: boolean; message: string }> {
  try {
    await execAsync(`sudo iw dev ${iface} station del ${mac}`);
    return { success: true, message: '客户端已断开' };
  } catch (error) {
    console.error('Failed to disconnect WiFi client:', error);
    return { success: false, message: `断开失败: ${error instanceof Error ? error.message : String(error)}` };
  }
}
