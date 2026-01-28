import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export interface CPUPinningConfig {
  vcpu: number;
  pcpu: number;
}

export interface NUMAConfig {
  node: number;
  cpus: number[];
  memory: string; // e.g., "4G"
}

export interface HugepagesConfig {
  size: string; // "2M" or "1G"
  count: number;
}

/**
 * 获取CPU拓扑信息
 */
export async function getCPUTopology(): Promise<{
  totalCores: number;
  coresPerSocket: number;
  sockets: number;
  threadsPerCore: number;
}> {
  try {
    const { stdout } = await execAsync('lscpu');
    const lines = stdout.split('\n');
    
    let totalCores = 0;
    let coresPerSocket = 0;
    let sockets = 0;
    let threadsPerCore = 0;
    
    for (const line of lines) {
      if (line.includes('CPU(s):')) {
        totalCores = parseInt(line.split(':')[1].trim());
      } else if (line.includes('Core(s) per socket:')) {
        coresPerSocket = parseInt(line.split(':')[1].trim());
      } else if (line.includes('Socket(s):')) {
        sockets = parseInt(line.split(':')[1].trim());
      } else if (line.includes('Thread(s) per core:')) {
        threadsPerCore = parseInt(line.split(':')[1].trim());
      }
    }
    
    return {
      totalCores,
      coresPerSocket,
      sockets,
      threadsPerCore,
    };
  } catch (error) {
    throw new Error(`Failed to get CPU topology: ${error}`);
  }
}

/**
 * 获取NUMA拓扑信息
 */
export async function getNUMATopology(): Promise<{
  nodes: Array<{
    node: number;
    cpus: number[];
    memory: string;
  }>;
}> {
  try {
    const { stdout } = await execAsync('numactl --hardware 2>/dev/null || echo ""');
    
    if (!stdout) {
      return { nodes: [] };
    }
    
    const nodes: Array<{ node: number; cpus: number[]; memory: string }> = [];
    const lines = stdout.split('\n');
    
    let currentNode = -1;
    
    for (const line of lines) {
      if (line.includes('node') && line.includes('cpus:')) {
        const match = line.match(/node (\d+) cpus: ([\d\s]+)/);
        if (match) {
          currentNode = parseInt(match[1]);
          const cpus = match[2].trim().split(/\s+/).map(c => parseInt(c));
          nodes.push({ node: currentNode, cpus, memory: '' });
        }
      } else if (line.includes('node') && line.includes('size:')) {
        const match = line.match(/node (\d+) size: (\d+) MB/);
        if (match) {
          const nodeNum = parseInt(match[1]);
          const memory = `${match[2]} MB`;
          const nodeObj = nodes.find(n => n.node === nodeNum);
          if (nodeObj) {
            nodeObj.memory = memory;
          }
        }
      }
    }
    
    return { nodes };
  } catch (error) {
    console.error('Failed to get NUMA topology:', error);
    return { nodes: [] };
  }
}

/**
 * 检查大页内存支持
 */
export async function checkHugepagesSupport(): Promise<{
  supported: boolean;
  sizes: string[];
  available: { [size: string]: number };
}> {
  try {
    const { stdout } = await execAsync('cat /proc/meminfo | grep Huge');
    
    const sizes: string[] = [];
    const available: { [size: string]: number } = {};
    
    if (stdout.includes('Hugepagesize:')) {
      const match = stdout.match(/Hugepagesize:\s+(\d+)\s+kB/);
      if (match) {
        const sizeKB = parseInt(match[1]);
        if (sizeKB === 2048) sizes.push('2M');
        if (sizeKB === 1048576) sizes.push('1G');
      }
    }
    
    if (stdout.includes('HugePages_Free:')) {
      const match = stdout.match(/HugePages_Free:\s+(\d+)/);
      if (match) {
        available['2M'] = parseInt(match[1]);
      }
    }
    
    return {
      supported: sizes.length > 0,
      sizes,
      available,
    };
  } catch (error) {
    return {
      supported: false,
      sizes: [],
      available: {},
    };
  }
}

/**
 * 配置大页内存
 */
export async function configureHugepages(config: HugepagesConfig): Promise<void> {
  try {
    const sysfsPath = config.size === '2M' 
      ? '/sys/kernel/mm/hugepages/hugepages-2048kB/nr_hugepages'
      : '/sys/kernel/mm/hugepages/hugepages-1048576kB/nr_hugepages';
    
    await execAsync(`echo ${config.count} | sudo tee ${sysfsPath}`);
  } catch (error) {
    throw new Error(`Failed to configure hugepages: ${error}`);
  }
}

/**
 * 生成CPU Pinning的QEMU参数
 */
export function generateCPUPinningArgs(pinning: CPUPinningConfig[]): string[] {
  const args: string[] = [];
  
  for (const pin of pinning) {
    args.push('-vcpu', `vcpunum=${pin.vcpu},affinity=${pin.pcpu}`);
  }
  
  return args;
}

/**
 * 生成NUMA配置的QEMU参数
 */
export function generateNUMAArgs(config: NUMAConfig[]): string[] {
  const args: string[] = [];
  
  for (const numa of config) {
    args.push(
      '-object',
      `memory-backend-ram,id=ram-node${numa.node},size=${numa.memory}`,
      '-numa',
      `node,nodeid=${numa.node},cpus=${numa.cpus.join('-')},memdev=ram-node${numa.node}`
    );
  }
  
  return args;
}

/**
 * 生成大页内存的QEMU参数
 */
export function generateHugepagesArgs(config: HugepagesConfig): string[] {
  const path = config.size === '2M' ? '/dev/hugepages' : '/dev/hugepages-1G';
  
  return [
    '-mem-path', path,
    '-mem-prealloc',
  ];
}

/**
 * 生成GPU直通的QEMU参数
 */
export function generateGPUPassthroughArgs(pciSlot: string): string[] {
  return [
    '-device',
    `vfio-pci,host=${pciSlot}`,
  ];
}

/**
 * 生成网卡直通的QEMU参数
 */
export function generateNetworkPassthroughArgs(pciSlot: string, mac?: string): string[] {
  const args = [
    '-device',
    `vfio-pci,host=${pciSlot}`,
  ];
  
  if (mac) {
    args[1] += `,mac=${mac}`;
  }
  
  return args;
}

/**
 * 生成存储直通的QEMU参数
 */
export function generateStoragePassthroughArgs(device: string): string[] {
  return [
    '-drive',
    `file=${device},format=raw,if=virtio,cache=none,aio=native`,
  ];
}

/**
 * 生成硬盘直通的QEMU参数
 */
export function generateDiskPassthroughArgs(device: string): string[] {
  return [
    '-drive',
    `file=${device},format=raw,if=virtio,cache=none,aio=native,discard=unmap`,
  ];
}

/**
 * 生成CPU模型优化参数
 */
export function generateCPUModelArgs(model: string = 'host'): string[] {
  return [
    '-cpu', `${model},+x2apic,+tsc-deadline,+hypervisor,+invtsc,+pdpe1gb`,
  ];
}

/**
 * 生成机器类型优化参数
 */
export function generateMachineTypeArgs(): string[] {
  return [
    '-machine', 'type=q35,accel=kvm,kernel_irqchip=on',
  ];
}

/**
 * 生成I/O线程优化参数
 */
export function generateIOThreadArgs(count: number = 2): string[] {
  const args: string[] = [];
  
  for (let i = 0; i < count; i++) {
    args.push('-object', `iothread,id=iothread${i}`);
  }
  
  return args;
}

/**
 * 检查CPU隔离配置
 */
export async function checkCPUIsolation(): Promise<{
  enabled: boolean;
  isolatedCPUs: number[];
}> {
  try {
    const { stdout } = await execAsync('cat /sys/devices/system/cpu/isolated 2>/dev/null || echo ""');
    
    if (!stdout.trim()) {
      return { enabled: false, isolatedCPUs: [] };
    }
    
    const isolatedCPUs: number[] = [];
    const parts = stdout.trim().split(',');
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n));
        for (let i = start; i <= end; i++) {
          isolatedCPUs.push(i);
        }
      } else {
        isolatedCPUs.push(parseInt(part));
      }
    }
    
    return {
      enabled: true,
      isolatedCPUs,
    };
  } catch (error) {
    return { enabled: false, isolatedCPUs: [] };
  }
}

/**
 * 获取性能优化建议
 */
export async function getPerformanceRecommendations(): Promise<{
  cpuPinning: boolean;
  hugepages: boolean;
  numa: boolean;
  cpuIsolation: boolean;
  recommendations: string[];
}> {
  const recommendations: string[] = [];
  
  // 检查CPU拓扑
  const cpuTopology = await getCPUTopology();
  const cpuPinning = cpuTopology.totalCores >= 4;
  if (cpuPinning) {
    recommendations.push('建议启用CPU Pinning以提升性能');
  }
  
  // 检查大页内存
  const hugepagesInfo = await checkHugepagesSupport();
  const hugepages = hugepagesInfo.supported;
  if (hugepages) {
    recommendations.push('建议启用大页内存(Hugepages)以减少TLB Miss');
  }
  
  // 检查NUMA
  const numaTopology = await getNUMATopology();
  const numa = numaTopology.nodes.length > 1;
  if (numa) {
    recommendations.push('检测到NUMA架构,建议配置NUMA节点绑定');
  }
  
  // 检查CPU隔离
  const cpuIsolationInfo = await checkCPUIsolation();
  const cpuIsolation = cpuIsolationInfo.enabled;
  if (!cpuIsolation && cpuTopology.totalCores >= 8) {
    recommendations.push('建议在内核参数中启用CPU隔离(isolcpus)');
  }
  
  return {
    cpuPinning,
    hugepages,
    numa,
    cpuIsolation,
    recommendations,
  };
}
