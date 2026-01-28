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
