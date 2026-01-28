import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

interface SystemStats {
  cpu: {
    usage: number; // 百分比
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number; // bytes
    used: number;
    free: number;
    usage: number; // 百分比
  };
  disk: {
    total: number; // bytes
    used: number;
    free: number;
    usage: number; // 百分比
  };
  network: {
    interfaces: Array<{
      name: string;
      rxBytes: number;
      txBytes: number;
      rxRate: number; // bytes/s
      txRate: number; // bytes/s
    }>;
  };
  timestamp: number;
}

interface ServiceStatus {
  docker: {
    running: boolean;
    containers: {
      total: number;
      running: number;
      stopped: number;
    };
  };
  vms: {
    total: number;
    running: number;
    stopped: number;
  };
}

// 历史数据缓存(最多保留300个数据点,约25分钟)
const historyData: SystemStats[] = [];
const MAX_HISTORY_POINTS = 300;

// 上一次网络统计数据
let lastNetworkStats: Map<string, { rxBytes: number; txBytes: number; timestamp: number }> = new Map();

/**
 * 获取CPU使用率
 */
async function getCPUUsage(): Promise<{ usage: number; cores: number; loadAverage: number[] }> {
  try {
    const cpuInfo = await fs.readFile('/proc/cpuinfo', 'utf-8');
    const cores = (cpuInfo.match(/processor/g) || []).length;

    // 读取/proc/stat获取CPU时间
    const stat = await fs.readFile('/proc/stat', 'utf-8');
    const cpuLine = stat.split('\n')[0];
    const cpuValues = cpuLine.split(/\s+/).slice(1).map(Number);
    
    const idle = cpuValues[3];
    const total = cpuValues.reduce((a, b) => a + b, 0);
    
    // 等待100ms后再次读取计算差值
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const stat2 = await fs.readFile('/proc/stat', 'utf-8');
    const cpuLine2 = stat2.split('\n')[0];
    const cpuValues2 = cpuLine2.split(/\s+/).slice(1).map(Number);
    
    const idle2 = cpuValues2[3];
    const total2 = cpuValues2.reduce((a, b) => a + b, 0);
    
    const idleDelta = idle2 - idle;
    const totalDelta = total2 - total;
    
    const usage = totalDelta === 0 ? 0 : ((totalDelta - idleDelta) / totalDelta) * 100;

    // 获取负载平均值
    const loadavg = await fs.readFile('/proc/loadavg', 'utf-8');
    const loadAverage = loadavg.split(' ').slice(0, 3).map(Number);

    return {
      usage: Math.round(usage * 100) / 100,
      cores,
      loadAverage
    };
  } catch (error) {
    console.error('Error getting CPU usage:', error);
    return { usage: 0, cores: 1, loadAverage: [0, 0, 0] };
  }
}

/**
 * 获取内存使用情况
 */
async function getMemoryUsage(): Promise<{ total: number; used: number; free: number; usage: number }> {
  try {
    const meminfo = await fs.readFile('/proc/meminfo', 'utf-8');
    const lines = meminfo.split('\n');
    
    const getValue = (key: string): number => {
      const line = lines.find(l => l.startsWith(key));
      if (!line) return 0;
      const match = line.match(/(\d+)/);
      return match ? parseInt(match[1]) * 1024 : 0; // 转换为bytes
    };

    const total = getValue('MemTotal');
    const free = getValue('MemFree');
    const buffers = getValue('Buffers');
    const cached = getValue('Cached');
    const sReclaimable = getValue('SReclaimable');
    
    const used = total - free - buffers - cached - sReclaimable;
    const usage = total === 0 ? 0 : (used / total) * 100;

    return {
      total,
      used,
      free: free + buffers + cached + sReclaimable,
      usage: Math.round(usage * 100) / 100
    };
  } catch (error) {
    console.error('Error getting memory usage:', error);
    return { total: 0, used: 0, free: 0, usage: 0 };
  }
}

/**
 * 获取磁盘使用情况
 */
async function getDiskUsage(): Promise<{ total: number; used: number; free: number; usage: number }> {
  try {
    const { stdout } = await execAsync('df -B1 / | tail -1');
    const parts = stdout.trim().split(/\s+/);
    
    const total = parseInt(parts[1]);
    const used = parseInt(parts[2]);
    const free = parseInt(parts[3]);
    const usage = total === 0 ? 0 : (used / total) * 100;

    return {
      total,
      used,
      free,
      usage: Math.round(usage * 100) / 100
    };
  } catch (error) {
    console.error('Error getting disk usage:', error);
    return { total: 0, used: 0, free: 0, usage: 0 };
  }
}

/**
 * 获取网络流量统计
 */
async function getNetworkStats(): Promise<Array<{
  name: string;
  rxBytes: number;
  txBytes: number;
  rxRate: number;
  txRate: number;
}>> {
  try {
    const netdev = await fs.readFile('/proc/net/dev', 'utf-8');
    const lines = netdev.split('\n').slice(2); // 跳过前两行标题
    
    const interfaces: Array<{
      name: string;
      rxBytes: number;
      txBytes: number;
      rxRate: number;
      txRate: number;
    }> = [];

    const now = Date.now();

    for (const line of lines) {
      if (!line.trim()) continue;
      
      const parts = line.trim().split(/\s+/);
      const name = parts[0].replace(':', '');
      
      // 跳过lo接口
      if (name === 'lo') continue;
      
      const rxBytes = parseInt(parts[1]);
      const txBytes = parseInt(parts[9]);

      // 计算速率
      let rxRate = 0;
      let txRate = 0;
      
      const lastStats = lastNetworkStats.get(name);
      if (lastStats) {
        const timeDelta = (now - lastStats.timestamp) / 1000; // 秒
        if (timeDelta > 0) {
          rxRate = (rxBytes - lastStats.rxBytes) / timeDelta;
          txRate = (txBytes - lastStats.txBytes) / timeDelta;
        }
      }

      // 更新缓存
      lastNetworkStats.set(name, { rxBytes, txBytes, timestamp: now });

      interfaces.push({
        name,
        rxBytes,
        txBytes,
        rxRate: Math.max(0, Math.round(rxRate)),
        txRate: Math.max(0, Math.round(txRate))
      });
    }

    return interfaces;
  } catch (error) {
    console.error('Error getting network stats:', error);
    return [];
  }
}

/**
 * 获取系统统计信息
 */
export async function getSystemStats(): Promise<SystemStats> {
  const [cpu, memory, disk, networkInterfaces] = await Promise.all([
    getCPUUsage(),
    getMemoryUsage(),
    getDiskUsage(),
    getNetworkStats()
  ]);

  const stats: SystemStats = {
    cpu,
    memory,
    disk,
    network: { interfaces: networkInterfaces },
    timestamp: Date.now()
  };

  // 添加到历史数据
  historyData.push(stats);
  if (historyData.length > MAX_HISTORY_POINTS) {
    historyData.shift();
  }

  return stats;
}

/**
 * 获取历史统计数据
 */
export function getSystemHistory(minutes: number = 5): SystemStats[] {
  const cutoffTime = Date.now() - minutes * 60 * 1000;
  return historyData.filter(stat => stat.timestamp >= cutoffTime);
}

/**
 * 获取服务状态
 */
export async function getServiceStatus(): Promise<ServiceStatus> {
  try {
    // 检查Docker状态
    let dockerRunning = false;
    let containerStats = { total: 0, running: 0, stopped: 0 };
    
    try {
      await execAsync('docker info');
      dockerRunning = true;
      
      // 获取容器统计
      const { stdout: psOutput } = await execAsync('docker ps -a --format "{{.Status}}"');
      const statuses = psOutput.trim().split('\n').filter(s => s);
      
      containerStats.total = statuses.length;
      containerStats.running = statuses.filter(s => s.startsWith('Up')).length;
      containerStats.stopped = containerStats.total - containerStats.running;
    } catch (error) {
      // Docker未运行或未安装
    }

    // TODO: 获取虚拟机统计(需要实现虚拟机列表API)
    const vmStats = { total: 0, running: 0, stopped: 0 };

    return {
      docker: {
        running: dockerRunning,
        containers: containerStats
      },
      vms: vmStats
    };
  } catch (error) {
    console.error('Error getting service status:', error);
    return {
      docker: {
        running: false,
        containers: { total: 0, running: 0, stopped: 0 }
      },
      vms: { total: 0, running: 0, stopped: 0 }
    };
  }
}

// 启动定时采集任务(每5秒采集一次)
setInterval(() => {
  getSystemStats().catch(err => console.error('Error in system stats collection:', err));
}, 5000);

// 立即采集一次
getSystemStats().catch(err => console.error('Error in initial system stats collection:', err));
