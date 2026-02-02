/**
 * 静态路由配置应用器
 * 负责将数据库中的路由配置应用到系统
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface StaticRoute {
  id: number;
  name: string;
  interface: string;
  target: string;
  netmask: string | null;
  gateway: string | null;
  metric: number | null;
  mtu: number | null;
  table: string | null;
  type: string | null;
  enabled: number | null;
}

/**
 * 应用所有静态路由到系统
 */
export async function applyStaticRoutes(routes: StaticRoute[]): Promise<{ success: boolean; message: string }> {
  try {
    // 只使用启用的路由
    const enabledRoutes = routes.filter(r => r.enabled === 1);

    // 清除现有的自定义路由(保留系统默认路由)
    // 注意: 这里需要谨慎处理,避免删除系统关键路由
    
    // 添加新路由
    const errors: string[] = [];
    let successCount = 0;

    for (const route of enabledRoutes) {
      try {
        const cmd = buildRouteCommand(route);
        await execAsync(cmd);
        successCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`路由 ${route.name}: ${errorMsg}`);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: `部分路由应用失败(成功${successCount}/${enabledRoutes.length}):\n${errors.join('\n')}`,
      };
    }

    return { 
      success: true, 
      message: `成功应用${successCount}条静态路由配置` 
    };
  } catch (error) {
    console.error('Failed to apply static routes:', error);
    return { 
      success: false, 
      message: `应用配置失败: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * 构建ip route命令
 */
function buildRouteCommand(route: StaticRoute): string {
  const parts = ['ip', 'route', 'add'];

  // 目标网络
  parts.push(route.target);

  // 网关
  if (route.gateway) {
    parts.push('via', route.gateway);
  }

  // 出口接口
  if (route.interface) {
    parts.push('dev', route.interface);
  }

  // Metric
  if (route.metric !== null && route.metric !== undefined) {
    parts.push('metric', String(route.metric));
  }

  // MTU
  if (route.mtu !== null && route.mtu !== undefined) {
    parts.push('mtu', String(route.mtu));
  }

  // 路由表
  if (route.table) {
    parts.push('table', route.table);
  }

  return parts.join(' ');
}

/**
 * 删除指定路由
 */
export async function deleteRoute(target: string, gateway?: string): Promise<{ success: boolean; message: string }> {
  try {
    const parts = ['ip', 'route', 'del', target];
    if (gateway) {
      parts.push('via', gateway);
    }

    await execAsync(parts.join(' '));
    return { success: true, message: '路由已删除' };
  } catch (error) {
    console.error('Failed to delete route:', error);
    return { 
      success: false, 
      message: `删除失败: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * 获取当前系统路由表
 */
export async function getCurrentRoutes(): Promise<any[]> {
  try {
    const { stdout } = await execAsync('ip -j route show');
    return JSON.parse(stdout);
  } catch (error) {
    console.error('Failed to get current routes:', error);
    return [];
  }
}

/**
 * 验证CIDR格式
 */
export function validateCIDR(cidr: string): boolean {
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  if (!cidrRegex.test(cidr)) {
    return false;
  }

  const [ip, prefix] = cidr.split('/');
  const parts = ip.split('.');
  
  // 验证IP地址
  if (!parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  })) {
    return false;
  }

  // 验证前缀长度
  const prefixNum = parseInt(prefix, 10);
  return prefixNum >= 0 && prefixNum <= 32;
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
