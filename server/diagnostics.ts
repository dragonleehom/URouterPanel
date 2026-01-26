import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface PingResult {
  seq: number;
  time: number;
  ttl: number;
  status: "success" | "timeout";
}

export interface PingStats {
  sent: number;
  received: number;
  lost: number;
  min: number;
  max: number;
  avg: number;
}

export interface TracerouteHop {
  hop: number;
  ip: string;
  hostname: string;
  time1: number;
  time2: number;
  time3: number;
}

export interface PortScanResult {
  port: number;
  protocol: string;
  status: "open" | "closed" | "filtered";
  service: string;
}

export interface DNSResult {
  type: string;
  value: string;
  ttl?: number;
}

/**
 * 执行Ping命令
 */
export async function executePing(
  target: string,
  count: number = 4
): Promise<{ results: PingResult[]; stats: PingStats }> {
  try {
    const { stdout } = await execAsync(`ping -c ${count} -W 2 ${target}`);
    
    const results: PingResult[] = [];
    const lines = stdout.split("\n");
    
    // 解析每一行ping结果
    let seq = 0;
    for (const line of lines) {
      if (line.includes("bytes from")) {
        seq++;
        const timeMatch = line.match(/time=([\d.]+)/);
        const ttlMatch = line.match(/ttl=(\d+)/);
        
        if (timeMatch && ttlMatch) {
          results.push({
            seq,
            time: parseFloat(timeMatch[1]),
            ttl: parseInt(ttlMatch[1]),
            status: "success",
          });
        }
      } else if (line.includes("timeout") || line.includes("no answer")) {
        seq++;
        results.push({
          seq,
          time: 0,
          ttl: 0,
          status: "timeout",
        });
      }
    }
    
    // 解析统计信息
    const statsLine = lines.find((l) => l.includes("packets transmitted"));
    const rttLine = lines.find((l) => l.includes("rtt min/avg/max"));
    
    let stats: PingStats = {
      sent: count,
      received: 0,
      lost: 0,
      min: 0,
      max: 0,
      avg: 0,
    };
    
    if (statsLine) {
      const match = statsLine.match(/(\d+) packets transmitted, (\d+) received/);
      if (match) {
        stats.sent = parseInt(match[1]);
        stats.received = parseInt(match[2]);
        stats.lost = stats.sent - stats.received;
      }
    }
    
    if (rttLine) {
      const match = rttLine.match(/([\d.]+)\/([\d.]+)\/([\d.]+)/);
      if (match) {
        stats.min = parseFloat(match[1]);
        stats.avg = parseFloat(match[2]);
        stats.max = parseFloat(match[3]);
      }
    }
    
    return { results, stats };
  } catch (error: any) {
    // Ping失败,返回超时结果
    const results: PingResult[] = Array.from({ length: count }, (_, i) => ({
      seq: i + 1,
      time: 0,
      ttl: 0,
      status: "timeout" as const,
    }));
    
    return {
      results,
      stats: {
        sent: count,
        received: 0,
        lost: count,
        min: 0,
        max: 0,
        avg: 0,
      },
    };
  }
}

/**
 * 执行Traceroute命令
 */
export async function executeTraceroute(
  target: string,
  maxHops: number = 30
): Promise<TracerouteHop[]> {
  try {
    const { stdout } = await execAsync(`traceroute -m ${maxHops} -w 2 ${target}`);
    
    const results: TracerouteHop[] = [];
    const lines = stdout.split("\n");
    
    for (const line of lines) {
      // 跳过标题行
      if (line.includes("traceroute to") || line.trim() === "") continue;
      
      // 解析每一跳: 1  gateway (192.168.1.1)  0.123 ms  0.456 ms  0.789 ms
      const match = line.match(/^\s*(\d+)\s+([^\s]+)\s+\(([^)]+)\)\s+([\d.]+)\s+ms\s+([\d.]+)\s+ms\s+([\d.]+)\s+ms/);
      
      if (match) {
        results.push({
          hop: parseInt(match[1]),
          hostname: match[2],
          ip: match[3],
          time1: parseFloat(match[4]),
          time2: parseFloat(match[5]),
          time3: parseFloat(match[6]),
        });
      } else {
        // 处理超时的跳: 1  * * *
        const timeoutMatch = line.match(/^\s*(\d+)\s+\*/);
        if (timeoutMatch) {
          results.push({
            hop: parseInt(timeoutMatch[1]),
            hostname: "*",
            ip: "*",
            time1: 0,
            time2: 0,
            time3: 0,
          });
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error("Traceroute error:", error);
    return [];
  }
}

/**
 * 执行端口扫描
 */
export async function executePortScan(
  target: string,
  ports: number[]
): Promise<PortScanResult[]> {
  const results: PortScanResult[] = [];
  
  const serviceMap: Record<number, string> = {
    21: "FTP",
    22: "SSH",
    23: "Telnet",
    25: "SMTP",
    53: "DNS",
    80: "HTTP",
    110: "POP3",
    143: "IMAP",
    443: "HTTPS",
    3306: "MySQL",
    3389: "RDP",
    5432: "PostgreSQL",
    6379: "Redis",
    8080: "HTTP-Alt",
    27017: "MongoDB",
  };
  
  // 使用nc (netcat)或nmap进行端口扫描
  for (const port of ports) {
    try {
      // 使用nc测试端口,超时1秒
      await execAsync(`nc -z -w 1 ${target} ${port}`);
      
      results.push({
        port,
        protocol: "TCP",
        status: "open",
        service: serviceMap[port] || "Unknown",
      });
    } catch (error) {
      // 端口关闭或过滤
      results.push({
        port,
        protocol: "TCP",
        status: "closed",
        service: serviceMap[port] || "Unknown",
      });
    }
  }
  
  return results;
}

/**
 * 执行DNS查询
 */
export async function executeDNSQuery(
  domain: string,
  type: string = "A"
): Promise<DNSResult[]> {
  try {
    const { stdout } = await execAsync(`dig +short ${domain} ${type}`);
    
    const results: DNSResult[] = [];
    const lines = stdout.trim().split("\n");
    
    for (const line of lines) {
      if (line.trim()) {
        results.push({
          type,
          value: line.trim(),
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error("DNS query error:", error);
    return [];
  }
}

/**
 * 执行Nslookup查询
 */
export async function executeNslookup(domain: string): Promise<string[]> {
  try {
    const { stdout } = await execAsync(`nslookup ${domain}`);
    
    const results: string[] = [];
    const lines = stdout.split("\n");
    
    for (const line of lines) {
      if (line.includes("Address:") && !line.includes("#53")) {
        const match = line.match(/Address:\s+(.+)/);
        if (match) {
          results.push(match[1].trim());
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error("Nslookup error:", error);
    return [];
  }
}
