import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export interface CPUInfo {
  model: string;
  cores: number;
  threads: number;
  frequency: string;
  temperature: number | null;
  architecture: string;
}

export interface MemoryInfo {
  total: number;
  used: number;
  free: number;
  available: number;
  type: string;
  speed: string;
  slots: MemorySlot[];
}

export interface MemorySlot {
  slot: string;
  size: string;
  type: string;
  speed: string;
}

export interface DiskInfo {
  device: string;
  model: string;
  size: string;
  type: string;
  health: string;
  temperature: number | null;
  smart: SmartData | null;
}

export interface SmartData {
  powerOnHours: number;
  powerCycleCount: number;
  reallocatedSectors: number;
  pendingSectors: number;
}

export interface NetworkInterfaceInfo {
  name: string;
  mac: string;
  speed: string;
  duplex: string;
  state: string;
  ipv4: string[];
  ipv6: string[];
}

export interface GPUInfo {
  model: string;
  vendor: string;
  driver: string;
  temperature: number | null;
  utilization: number | null;
  memory: {
    total: number;
    used: number;
  } | null;
}

export interface MotherboardInfo {
  manufacturer: string;
  product: string;
  version: string;
  biosVendor: string;
  biosVersion: string;
  biosDate: string;
}

/**
 * 获取CPU详细信息
 */
export async function getCPUInfo(): Promise<CPUInfo> {
  try {
    // 读取/proc/cpuinfo获取CPU信息
    const cpuinfoContent = await fs.readFile('/proc/cpuinfo', 'utf-8');
    const lines = cpuinfoContent.split('\n');
    
    let model = 'Unknown';
    let cores = 0;
    let threads = 0;
    let frequency = 'Unknown';
    let architecture = 'Unknown';
    
    // 解析CPU型号
    const modelLine = lines.find(l => l.startsWith('model name'));
    if (modelLine) {
      model = modelLine.split(':')[1].trim();
    }
    
    // 统计核心数和线程数
    const processorLines = lines.filter(l => l.startsWith('processor'));
    threads = processorLines.length;
    
    // 尝试获取物理核心数
    try {
      const { stdout: coreCount } = await execAsync('lscpu | grep "Core(s) per socket" | awk \'{print $4}\'');
      const { stdout: socketCount } = await execAsync('lscpu | grep "Socket(s)" | awk \'{print $2}\'');
      cores = parseInt(coreCount.trim()) * parseInt(socketCount.trim());
    } catch {
      cores = threads; // 如果获取失败,假设核心数等于线程数
    }
    
    // 获取CPU频率
    try {
      const { stdout: freqOutput } = await execAsync('lscpu | grep "CPU MHz" | awk \'{print $3}\'');
      const freq = parseFloat(freqOutput.trim());
      frequency = `${(freq / 1000).toFixed(2)} GHz`;
    } catch {
      frequency = 'Unknown';
    }
    
    // 获取架构
    try {
      const { stdout: archOutput } = await execAsync('uname -m');
      architecture = archOutput.trim();
    } catch {
      architecture = 'Unknown';
    }
    
    // 获取CPU温度
    let temperature: number | null = null;
    try {
      // 尝试从thermal_zone读取温度
      const thermalZones = await fs.readdir('/sys/class/thermal');
      for (const zone of thermalZones) {
        if (zone.startsWith('thermal_zone')) {
          try {
            const tempContent = await fs.readFile(`/sys/class/thermal/${zone}/temp`, 'utf-8');
            const temp = parseInt(tempContent.trim()) / 1000;
            if (temp > 0 && temp < 150) { // 合理的温度范围
              temperature = temp;
              break;
            }
          } catch {}
        }
      }
    } catch {}
    
    return {
      model,
      cores,
      threads,
      frequency,
      temperature,
      architecture
    };
  } catch (error) {
    console.error('Failed to get CPU info:', error);
    return {
      model: 'Unknown',
      cores: 0,
      threads: 0,
      frequency: 'Unknown',
      temperature: null,
      architecture: 'Unknown'
    };
  }
}

/**
 * 获取内存详细信息
 */
export async function getMemoryInfo(): Promise<MemoryInfo> {
  try {
    const meminfoContent = await fs.readFile('/proc/meminfo', 'utf-8');
    const lines = meminfoContent.split('\n');
    
    const getValue = (key: string): number => {
      const line = lines.find(l => l.startsWith(key));
      if (line) {
        const match = line.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      }
      return 0;
    };
    
    const total = getValue('MemTotal');
    const free = getValue('MemFree');
    const available = getValue('MemAvailable');
    const used = total - available;
    
    // 尝试获取内存类型和频率
    let type = 'Unknown';
    let speed = 'Unknown';
    const slots: MemorySlot[] = [];
    
    try {
      const { stdout: dmidecodeOutput } = await execAsync('sudo dmidecode -t memory 2>/dev/null || echo ""');
      if (dmidecodeOutput) {
        const memoryBlocks = dmidecodeOutput.split('Memory Device');
        for (const block of memoryBlocks.slice(1)) {
          const sizeMatch = block.match(/Size: (.+)/);
          const typeMatch = block.match(/Type: (.+)/);
          const speedMatch = block.match(/Speed: (.+)/);
          const locatorMatch = block.match(/Locator: (.+)/);
          
          if (sizeMatch && sizeMatch[1] !== 'No Module Installed') {
            const slot: MemorySlot = {
              slot: locatorMatch ? locatorMatch[1].trim() : 'Unknown',
              size: sizeMatch[1].trim(),
              type: typeMatch ? typeMatch[1].trim() : 'Unknown',
              speed: speedMatch ? speedMatch[1].trim() : 'Unknown'
            };
            slots.push(slot);
            
            if (type === 'Unknown' && typeMatch) {
              type = typeMatch[1].trim();
            }
            if (speed === 'Unknown' && speedMatch) {
              speed = speedMatch[1].trim();
            }
          }
        }
      }
    } catch (error) {
      console.log('dmidecode not available, skipping memory details');
    }
    
    return {
      total,
      used,
      free,
      available,
      type,
      speed,
      slots
    };
  } catch (error) {
    console.error('Failed to get memory info:', error);
    return {
      total: 0,
      used: 0,
      free: 0,
      available: 0,
      type: 'Unknown',
      speed: 'Unknown',
      slots: []
    };
  }
}

/**
 * 获取磁盘详细信息
 */
export async function getDiskInfo(): Promise<DiskInfo[]> {
  const disks: DiskInfo[] = [];
  
  try {
    // 获取所有块设备
    const { stdout: lsblkOutput } = await execAsync('lsblk -d -o NAME,SIZE,TYPE,MODEL -n');
    const lines = lsblkOutput.trim().split('\n');
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 3) continue;
      
      const device = parts[0];
      const size = parts[1];
      const type = parts[2];
      const model = parts.slice(3).join(' ') || 'Unknown';
      
      // 只处理磁盘设备,跳过分区和loop设备
      if (type !== 'disk') continue;
      
      let health = 'Unknown';
      let temperature: number | null = null;
      let smart: SmartData | null = null;
      
      // 尝试获取SMART数据
      try {
        const { stdout: smartOutput } = await execAsync(`sudo smartctl -A /dev/${device} 2>/dev/null || echo ""`);
        if (smartOutput) {
          health = 'Good';
          
          // 解析SMART属性
          const powerOnMatch = smartOutput.match(/Power_On_Hours.*?(\d+)/);
          const powerCycleMatch = smartOutput.match(/Power_Cycle_Count.*?(\d+)/);
          const reallocatedMatch = smartOutput.match(/Reallocated_Sector.*?(\d+)/);
          const pendingMatch = smartOutput.match(/Current_Pending_Sector.*?(\d+)/);
          const tempMatch = smartOutput.match(/Temperature_Celsius.*?(\d+)/);
          
          if (powerOnMatch || powerCycleMatch || reallocatedMatch || pendingMatch) {
            smart = {
              powerOnHours: powerOnMatch ? parseInt(powerOnMatch[1]) : 0,
              powerCycleCount: powerCycleMatch ? parseInt(powerCycleMatch[1]) : 0,
              reallocatedSectors: reallocatedMatch ? parseInt(reallocatedMatch[1]) : 0,
              pendingSectors: pendingMatch ? parseInt(pendingMatch[1]) : 0
            };
            
            // 判断健康状态
            if (smart.reallocatedSectors > 0 || smart.pendingSectors > 0) {
              health = 'Warning';
            }
          }
          
          if (tempMatch) {
            temperature = parseInt(tempMatch[1]);
          }
        }
      } catch (error) {
        console.log(`SMART data not available for ${device}`);
      }
      
      disks.push({
        device: `/dev/${device}`,
        model,
        size,
        type: type === 'disk' ? 'HDD/SSD' : type,
        health,
        temperature,
        smart
      });
    }
  } catch (error) {
    console.error('Failed to get disk info:', error);
  }
  
  return disks;
}

/**
 * 获取网络接口详细信息
 */
export async function getNetworkInterfaceInfo(): Promise<NetworkInterfaceInfo[]> {
  const interfaces: NetworkInterfaceInfo[] = [];
  
  try {
    // 获取所有网络接口
    const { stdout: ipOutput } = await execAsync('ip -o link show');
    const lines = ipOutput.trim().split('\n');
    
    for (const line of lines) {
      const match = line.match(/^\d+:\s+(\S+):\s+<(.+)>.*link\/\w+\s+(\S+)/);
      if (!match) continue;
      
      const name = match[1];
      const flags = match[2];
      const mac = match[3];
      
      // 跳过loopback接口
      if (name === 'lo') continue;
      
      const state = flags.includes('UP') ? 'up' : 'down';
      
      // 获取速率和双工模式
      let speed = 'Unknown';
      let duplex = 'Unknown';
      try {
        const { stdout: ethtoolOutput } = await execAsync(`sudo ethtool ${name} 2>/dev/null || echo ""`);
        const speedMatch = ethtoolOutput.match(/Speed: (.+)/);
        const duplexMatch = ethtoolOutput.match(/Duplex: (.+)/);
        if (speedMatch) speed = speedMatch[1].trim();
        if (duplexMatch) duplex = duplexMatch[1].trim();
      } catch {}
      
      // 获取IP地址
      const ipv4: string[] = [];
      const ipv6: string[] = [];
      try {
        const { stdout: addrOutput } = await execAsync(`ip -o addr show ${name}`);
        const addrLines = addrOutput.trim().split('\n');
        for (const addrLine of addrLines) {
          const inet4Match = addrLine.match(/inet\s+(\S+)/);
          const inet6Match = addrLine.match(/inet6\s+(\S+)/);
          if (inet4Match) ipv4.push(inet4Match[1]);
          if (inet6Match) ipv6.push(inet6Match[1]);
        }
      } catch {}
      
      interfaces.push({
        name,
        mac,
        speed,
        duplex,
        state,
        ipv4,
        ipv6
      });
    }
  } catch (error) {
    console.error('Failed to get network interface info:', error);
  }
  
  return interfaces;
}

/**
 * 获取GPU信息
 */
export async function getGPUInfo(): Promise<GPUInfo[]> {
  const gpus: GPUInfo[] = [];
  
  try {
    // 尝试使用lspci获取GPU信息
    const { stdout: lspciOutput } = await execAsync('lspci | grep -i vga');
    const lines = lspciOutput.trim().split('\n');
    
    for (const line of lines) {
      const match = line.match(/VGA compatible controller: (.+?)(?:\[(.+?)\])?$/);
      if (!match) continue;
      
      const fullName = match[1].trim();
      let vendor = 'Unknown';
      let model = fullName;
      
      // 尝试分离厂商和型号
      if (fullName.includes('Intel')) {
        vendor = 'Intel';
        model = fullName.replace('Intel Corporation', '').trim();
      } else if (fullName.includes('NVIDIA')) {
        vendor = 'NVIDIA';
        model = fullName.replace('NVIDIA Corporation', '').trim();
      } else if (fullName.includes('AMD') || fullName.includes('ATI')) {
        vendor = 'AMD';
        model = fullName.replace(/AMD|ATI|Advanced Micro Devices/gi, '').trim();
      }
      
      let driver = 'Unknown';
      let temperature: number | null = null;
      let utilization: number | null = null;
      let memory: { total: number; used: number } | null = null;
      
      // 尝试获取NVIDIA GPU信息
      if (vendor === 'NVIDIA') {
        try {
          const { stdout: nvidiaSmiOutput } = await execAsync('nvidia-smi --query-gpu=driver_version,temperature.gpu,utilization.gpu,memory.total,memory.used --format=csv,noheader,nounits');
          const values = nvidiaSmiOutput.trim().split(',').map(v => v.trim());
          if (values.length >= 5) {
            driver = values[0];
            temperature = parseFloat(values[1]);
            utilization = parseFloat(values[2]);
            memory = {
              total: parseFloat(values[3]),
              used: parseFloat(values[4])
            };
          }
        } catch {}
      }
      
      gpus.push({
        model,
        vendor,
        driver,
        temperature,
        utilization,
        memory
      });
    }
  } catch (error) {
    console.log('No GPU detected or lspci not available');
  }
  
  return gpus;
}

/**
 * 获取主板和BIOS信息
 */
export async function getMotherboardInfo(): Promise<MotherboardInfo> {
  try {
    let manufacturer = 'Unknown';
    let product = 'Unknown';
    let version = 'Unknown';
    let biosVendor = 'Unknown';
    let biosVersion = 'Unknown';
    let biosDate = 'Unknown';
    
    try {
      const { stdout: dmidecodeOutput } = await execAsync('sudo dmidecode -t baseboard,bios 2>/dev/null || echo ""');
      if (dmidecodeOutput) {
        const manufacturerMatch = dmidecodeOutput.match(/Manufacturer: (.+)/);
        const productMatch = dmidecodeOutput.match(/Product Name: (.+)/);
        const versionMatch = dmidecodeOutput.match(/Version: (.+)/);
        const biosVendorMatch = dmidecodeOutput.match(/Vendor: (.+)/);
        const biosVersionMatch = dmidecodeOutput.match(/BIOS.*Version: (.+)/);
        const biosDateMatch = dmidecodeOutput.match(/Release Date: (.+)/);
        
        if (manufacturerMatch) manufacturer = manufacturerMatch[1].trim();
        if (productMatch) product = productMatch[1].trim();
        if (versionMatch) version = versionMatch[1].trim();
        if (biosVendorMatch) biosVendor = biosVendorMatch[1].trim();
        if (biosVersionMatch) biosVersion = biosVersionMatch[1].trim();
        if (biosDateMatch) biosDate = biosDateMatch[1].trim();
      }
    } catch (error) {
      console.log('dmidecode not available, skipping motherboard info');
    }
    
    return {
      manufacturer,
      product,
      version,
      biosVendor,
      biosVersion,
      biosDate
    };
  } catch (error) {
    console.error('Failed to get motherboard info:', error);
    return {
      manufacturer: 'Unknown',
      product: 'Unknown',
      version: 'Unknown',
      biosVendor: 'Unknown',
      biosVersion: 'Unknown',
      biosDate: 'Unknown'
    };
  }
}

/**
 * 获取所有硬件信息
 */
export async function getAllHardwareInfo() {
  const [cpu, memory, disks, networkInterfaces, gpus, motherboard] = await Promise.all([
    getCPUInfo(),
    getMemoryInfo(),
    getDiskInfo(),
    getNetworkInterfaceInfo(),
    getGPUInfo(),
    getMotherboardInfo()
  ]);
  
  return {
    cpu,
    memory,
    disks,
    networkInterfaces,
    gpus,
    motherboard
  };
}
