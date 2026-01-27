/**
 * API集成工具函数库
 * 提供通用的API调用模式、数据适配和错误处理
 */

import { toast } from "sonner";

/**
 * 数据适配器类型定义
 */
export type DataAdapter<TBackend, TFrontend> = (data: TBackend) => TFrontend;

/**
 * API响应包装器
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 通用错误处理
 */
export function handleApiError(error: unknown, context: string = "操作"): void {
  console.error(`${context}失败:`, error);
  
  if (error instanceof Error) {
    toast.error(`${context}失败: ${error.message}`);
  } else {
    toast.error(`${context}失败: 未知错误`);
  }
}

/**
 * 通用成功提示
 */
export function handleApiSuccess(message: string): void {
  toast.success(message);
}

/**
 * 数据适配器 - 将后端数据转换为前端格式
 */
export function adaptData<TBackend, TFrontend>(
  data: TBackend | undefined,
  adapter: DataAdapter<TBackend, TFrontend>,
  fallback: TFrontend
): TFrontend {
  if (!data) return fallback;
  try {
    return adapter(data);
  } catch (error) {
    console.error("数据适配失败:", error);
    return fallback;
  }
}

/**
 * 列表数据适配器
 */
export function adaptList<TBackend, TFrontend>(
  data: TBackend[] | undefined,
  adapter: DataAdapter<TBackend, TFrontend>
): TFrontend[] {
  if (!data || !Array.isArray(data)) return [];
  try {
    return data.map(adapter);
  } catch (error) {
    console.error("列表数据适配失败:", error);
    return [];
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 格式化字节大小
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 格式化带宽速率
 */
export function formatBandwidth(bps: number, decimals: number = 2): string {
  if (bps === 0) return '0 bps';
  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];
  const i = Math.floor(Math.log(bps) / Math.log(k));
  return parseFloat((bps / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 格式化运行时间
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0) parts.push(`${minutes}分钟`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`);

  return parts.join(' ');
}

/**
 * 验证IP地址
 */
export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return false;
  
  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}

/**
 * 验证MAC地址
 */
export function isValidMAC(mac: string): boolean {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
}

/**
 * 验证端口号
 */
export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

/**
 * 验证CIDR
 */
export function isValidCIDR(cidr: string): boolean {
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  if (!cidrRegex.test(cidr)) return false;
  
  const [ip, mask] = cidr.split('/');
  const maskNum = parseInt(mask, 10);
  
  return isValidIP(ip) && maskNum >= 0 && maskNum <= 32;
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 安全的JSON解析
 */
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error("JSON解析失败:", error);
    return fallback;
  }
}

/**
 * 延迟执行
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试函数
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, onRetry } = options;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      if (onRetry) onRetry(attempt, error);
      await sleep(delay * attempt);
    }
  }
  
  throw new Error("Retry failed");
}

/**
 * 批量操作辅助函数
 */
export async function batchOperation<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  options: {
    batchSize?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<R[]> {
  const { batchSize = 5, onProgress } = options;
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(operation));
    results.push(...batchResults);
    
    if (onProgress) {
      onProgress(Math.min(i + batchSize, items.length), items.length);
    }
  }
  
  return results;
}

/**
 * 状态颜色映射
 */
export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    'running': 'text-green-600',
    'stopped': 'text-red-600',
    'error': 'text-red-600',
    'warning': 'text-yellow-600',
    'pending': 'text-blue-600',
    'success': 'text-green-600',
    'active': 'text-green-600',
    'inactive': 'text-gray-600',
    'enabled': 'text-green-600',
    'disabled': 'text-gray-600',
  };
  
  return statusMap[status.toLowerCase()] || 'text-gray-600';
}

/**
 * 状态徽章样式
 */
export function getStatusBadgeClass(status: string): string {
  const statusMap: Record<string, string> = {
    'running': 'bg-green-100 text-green-800',
    'stopped': 'bg-red-100 text-red-800',
    'error': 'bg-red-100 text-red-800',
    'warning': 'bg-yellow-100 text-yellow-800',
    'pending': 'bg-blue-100 text-blue-800',
    'success': 'bg-green-100 text-green-800',
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-gray-100 text-gray-800',
    'enabled': 'bg-green-100 text-green-800',
    'disabled': 'bg-gray-100 text-gray-800',
  };
  
  return statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
}
