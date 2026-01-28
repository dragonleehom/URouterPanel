/**
 * 网络流量监控服务
 * 采集Linux网络接口的流量统计数据
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * 网络接口流量统计
 */
export interface NetworkTrafficStats {
  interfaceName: string;
  timestamp: number;
  rx: {
    bytes: number;
    packets: number;
    errors: number;
    dropped: number;
  };
  tx: {
    bytes: number;
    packets: number;
    errors: number;
    dropped: number;
  };
  bandwidth?: {
    rxBytesPerSec: number;
    txBytesPerSec: number;
  };
}

/**
 * 历史流量数据缓存
 * Key: interfaceName, Value: 最近300个数据点(约25分钟,每5秒一个点)
 */
const trafficHistory = new Map<string, NetworkTrafficStats[]>();

/**
 * 上一次采集的数据(用于计算带宽)
 */
const lastStats = new Map<string, NetworkTrafficStats>();

/**
 * 解析ip命令的输出,提取流量统计
 */
function parseIpStats(output: string, interfaceName: string): NetworkTrafficStats | null {
  try {
    // 查找指定接口的统计信息
    const lines = output.split("\n");
    let foundInterface = false;
    let rxLine = "";
    let txLine = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 查找接口名称行
      if (line.includes(interfaceName) && line.includes("state")) {
        foundInterface = true;
        continue;
      }

      // 找到接口后,读取RX和TX行
      if (foundInterface) {
        if (line.trim().startsWith("RX:")) {
          rxLine = line;
        } else if (line.trim().startsWith("TX:")) {
          txLine = line;
          break; // 已获取所需数据
        }
      }
    }

    if (!rxLine || !txLine) {
      return null;
    }

    // 解析RX行: RX: bytes  packets  errors  dropped  missed  mcast
    const rxMatch = rxLine.match(/RX:\s+bytes\s+packets\s+errors\s+dropped/);
    const rxValues = lines[lines.indexOf(rxLine) + 1].trim().split(/\s+/);
    
    // 解析TX行: TX: bytes  packets  errors  dropped  carrier  collsns
    const txMatch = txLine.match(/TX:\s+bytes\s+packets\s+errors\s+dropped/);
    const txValues = lines[lines.indexOf(txLine) + 1].trim().split(/\s+/);

    if (!rxMatch || !txMatch || rxValues.length < 4 || txValues.length < 4) {
      return null;
    }

    return {
      interfaceName,
      timestamp: Date.now(),
      rx: {
        bytes: parseInt(rxValues[0]) || 0,
        packets: parseInt(rxValues[1]) || 0,
        errors: parseInt(rxValues[2]) || 0,
        dropped: parseInt(rxValues[3]) || 0,
      },
      tx: {
        bytes: parseInt(txValues[0]) || 0,
        packets: parseInt(txValues[1]) || 0,
        errors: parseInt(txValues[2]) || 0,
        dropped: parseInt(txValues[3]) || 0,
      },
    };
  } catch (error) {
    console.error(`Failed to parse ip stats for ${interfaceName}:`, error);
    return null;
  }
}

/**
 * 计算带宽(bytes/s)
 */
function calculateBandwidth(
  current: NetworkTrafficStats,
  previous: NetworkTrafficStats
): { rxBytesPerSec: number; txBytesPerSec: number } {
  const timeDiff = (current.timestamp - previous.timestamp) / 1000; // 转换为秒
  
  if (timeDiff <= 0) {
    return { rxBytesPerSec: 0, txBytesPerSec: 0 };
  }

  const rxBytesDiff = current.rx.bytes - previous.rx.bytes;
  const txBytesDiff = current.tx.bytes - previous.tx.bytes;

  return {
    rxBytesPerSec: Math.max(0, rxBytesDiff / timeDiff),
    txBytesPerSec: Math.max(0, txBytesDiff / timeDiff),
  };
}

/**
 * 采集指定网络接口的流量统计
 */
export async function collectTrafficStats(
  interfaceName: string
): Promise<NetworkTrafficStats | null> {
  try {
    // 使用ip命令获取接口统计
    const { stdout } = await execAsync(`ip -s link show ${interfaceName}`);
    
    const stats = parseIpStats(stdout, interfaceName);
    if (!stats) {
      return null;
    }

    // 计算带宽
    const previous = lastStats.get(interfaceName);
    if (previous) {
      stats.bandwidth = calculateBandwidth(stats, previous);
    }

    // 更新缓存
    lastStats.set(interfaceName, stats);

    // 保存到历史记录
    let history = trafficHistory.get(interfaceName);
    if (!history) {
      history = [];
      trafficHistory.set(interfaceName, history);
    }
    
    history.push(stats);
    
    // 限制历史记录长度(最多300个点)
    if (history.length > 300) {
      history.shift();
    }

    return stats;
  } catch (error: any) {
    console.error(`Failed to collect traffic stats for ${interfaceName}:`, error.message);
    return null;
  }
}

/**
 * 获取网络接口的历史流量数据
 */
export function getTrafficHistory(
  interfaceName: string,
  maxPoints: number = 60
): NetworkTrafficStats[] {
  const history = trafficHistory.get(interfaceName) || [];
  
  // 返回最近的N个数据点
  if (history.length <= maxPoints) {
    return history;
  }
  
  return history.slice(history.length - maxPoints);
}

/**
 * 获取所有已监控接口的最新流量统计
 */
export function getAllLatestStats(): NetworkTrafficStats[] {
  return Array.from(lastStats.values());
}

/**
 * 清除指定接口的历史数据
 */
export function clearTrafficHistory(interfaceName: string): void {
  trafficHistory.delete(interfaceName);
  lastStats.delete(interfaceName);
}

/**
 * 启动定时采集任务
 */
export function startTrafficMonitoring(
  interfaces: string[],
  intervalMs: number = 5000
): NodeJS.Timeout {
  const timer = setInterval(async () => {
    for (const iface of interfaces) {
      await collectTrafficStats(iface);
    }
  }, intervalMs);

  return timer;
}

/**
 * 停止定时采集任务
 */
export function stopTrafficMonitoring(timer: NodeJS.Timeout): void {
  clearInterval(timer);
}
