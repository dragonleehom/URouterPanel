import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export interface PCIDevice {
  slot: string;
  class: string;
  vendor: string;
  device: string;
  subsystem?: string;
  driver?: string;
  iommuGroup?: string;
}

export interface GPUDevice extends PCIDevice {
  type: 'NVIDIA' | 'AMD' | 'Intel' | 'Unknown';
  model: string;
  vgpuSupport?: boolean;
}

export interface NetworkDevice extends PCIDevice {
  interface: string;
  sriovSupport?: boolean;
  maxVFs?: number;
}

export interface CPUInfo {
  model: string;
  cores: number;
  threads: number;
  sockets: number;
  vendor: 'Intel' | 'AMD' | 'Unknown';
  features: {
    vtx: boolean; // Intel VT-x
    amdv: boolean; // AMD-V
    ept: boolean; // Extended Page Tables
    npt: boolean; // Nested Page Tables
  };
}

export interface NUMAInfo {
  nodes: number;
  nodeInfo: Array<{
    node: number;
    cpus: number[];
    memory: number; // MB
  }>;
}

export interface HardwareInfo {
  iommuEnabled: boolean;
  kvmSupported: boolean;
  cpu: CPUInfo;
  numa: NUMAInfo;
  pciDevices: PCIDevice[];
  gpuDevices: GPUDevice[];
  networkDevices: NetworkDevice[];
  storageControllers: PCIDevice[];
}

/**
 * 检测IOMMU是否启用
 */
export async function checkIOMMU(): Promise<boolean> {
  try {
    // 检查内核参数
    const { stdout: cmdline } = await execAsync('cat /proc/cmdline');
    const hasIOMMUParam = cmdline.includes('intel_iommu=on') || cmdline.includes('amd_iommu=on');
    
    // 检查IOMMU组
    try {
      await fs.access('/sys/kernel/iommu_groups');
      const { stdout: groups } = await execAsync('find /sys/kernel/iommu_groups -type l | wc -l');
      const groupCount = parseInt(groups.trim());
      return hasIOMMUParam && groupCount > 0;
    } catch {
      return false;
    }
  } catch (error) {
    console.error('Error checking IOMMU:', error);
    return false;
  }
}

/**
 * 检测KVM支持
 */
export async function checkKVMSupport(): Promise<boolean> {
  try {
    // 检查/dev/kvm是否存在
    await fs.access('/dev/kvm');
    
    // 检查kvm模块是否加载
    const { stdout } = await execAsync('lsmod | grep kvm');
    return stdout.includes('kvm');
  } catch {
    return false;
  }
}

/**
 * 获取CPU信息
 */
export async function getCPUInfo(): Promise<CPUInfo> {
  try {
    const { stdout: cpuinfo } = await execAsync('cat /proc/cpuinfo');
    const { stdout: lscpu } = await execAsync('lscpu');
    
    // 解析CPU型号
    const modelMatch = cpuinfo.match(/model name\s*:\s*(.+)/);
    const model = modelMatch ? modelMatch[1].trim() : 'Unknown';
    
    // 解析核心数和线程数
    const coresMatch = lscpu.match(/Core\(s\) per socket:\s*(\d+)/);
    const socketsMatch = lscpu.match(/Socket\(s\):\s*(\d+)/);
    const threadsMatch = lscpu.match(/Thread\(s\) per core:\s*(\d+)/);
    
    const cores = coresMatch ? parseInt(coresMatch[1]) : 1;
    const sockets = socketsMatch ? parseInt(socketsMatch[1]) : 1;
    const threadsPerCore = threadsMatch ? parseInt(threadsMatch[1]) : 1;
    const threads = cores * sockets * threadsPerCore;
    
    // 检测厂商
    let vendor: 'Intel' | 'AMD' | 'Unknown' = 'Unknown';
    if (model.includes('Intel')) vendor = 'Intel';
    else if (model.includes('AMD')) vendor = 'AMD';
    
    // 检测虚拟化特性
    const flags = cpuinfo.match(/flags\s*:\s*(.+)/)?.[1] || '';
    const features = {
      vtx: flags.includes('vmx'), // Intel VT-x
      amdv: flags.includes('svm'), // AMD-V
      ept: flags.includes('ept'), // Extended Page Tables
      npt: flags.includes('npt'), // Nested Page Tables
    };
    
    return { model, cores, threads, sockets, vendor, features };
  } catch (error) {
    console.error('Error getting CPU info:', error);
    return {
      model: 'Unknown',
      cores: 1,
      threads: 1,
      sockets: 1,
      vendor: 'Unknown',
      features: { vtx: false, amdv: false, ept: false, npt: false },
    };
  }
}

/**
 * 获取NUMA信息
 */
export async function getNUMAInfo(): Promise<NUMAInfo> {
  try {
    const { stdout } = await execAsync('numactl --hardware 2>/dev/null || echo "NUMA not available"');
    
    if (stdout.includes('NUMA not available')) {
      return { nodes: 1, nodeInfo: [] };
    }
    
    const nodesMatch = stdout.match(/available: (\d+) nodes/);
    const nodes = nodesMatch ? parseInt(nodesMatch[1]) : 1;
    
    const nodeInfo: Array<{ node: number; cpus: number[]; memory: number }> = [];
    const nodeMatches = Array.from(stdout.matchAll(/node (\d+) cpus: ([\d\s]+)/g));
    
    for (const match of nodeMatches) {
      const node = parseInt(match[1]);
      const cpus = match[2].trim().split(/\s+/).map((n: string) => parseInt(n));
      
      // 获取内存信息
      const memMatch = stdout.match(new RegExp(`node ${node} size: (\\d+) MB`));
      const memory = memMatch ? parseInt(memMatch[1]) : 0;
      
      nodeInfo.push({ node, cpus, memory });
    }
    
    return { nodes, nodeInfo };
  } catch (error) {
    console.error('Error getting NUMA info:', error);
    return { nodes: 1, nodeInfo: [] };
  }
}

/**
 * 枚举所有PCI设备
 */
export async function enumeratePCIDevices(): Promise<PCIDevice[]> {
  try {
    const { stdout } = await execAsync('lspci -vmm');
    const devices: PCIDevice[] = [];
    
    const deviceBlocks = stdout.split('\n\n').filter(block => block.trim());
    
    for (const block of deviceBlocks) {
      const lines = block.split('\n');
      const device: Partial<PCIDevice> = {};
      
      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        
        switch (key.trim()) {
          case 'Slot':
            device.slot = value;
            break;
          case 'Class':
            device.class = value;
            break;
          case 'Vendor':
            device.vendor = value;
            break;
          case 'Device':
            device.device = value;
            break;
          case 'SVendor':
          case 'SDevice':
            device.subsystem = (device.subsystem || '') + ' ' + value;
            break;
          case 'Driver':
            device.driver = value;
            break;
        }
      }
      
      if (device.slot) {
        // 获取IOMMU组
        try {
          const iommuPath = `/sys/bus/pci/devices/${device.slot}/iommu_group`;
          const { stdout: iommuGroup } = await execAsync(`readlink ${iommuPath} 2>/dev/null || echo ""`);
          if (iommuGroup) {
            device.iommuGroup = iommuGroup.trim().split('/').pop();
          }
        } catch {
          // IOMMU组不存在
        }
        
        devices.push(device as PCIDevice);
      }
    }
    
    return devices;
  } catch (error) {
    console.error('Error enumerating PCI devices:', error);
    return [];
  }
}

/**
 * 识别GPU设备
 */
export async function detectGPUDevices(pciDevices: PCIDevice[]): Promise<GPUDevice[]> {
  const gpuDevices: GPUDevice[] = [];
  
  for (const device of pciDevices) {
    if (device.class.includes('VGA') || device.class.includes('3D') || device.class.includes('Display')) {
      let type: 'NVIDIA' | 'AMD' | 'Intel' | 'Unknown' = 'Unknown';
      let vgpuSupport = false;
      
      if (device.vendor.includes('NVIDIA')) {
        type = 'NVIDIA';
        // 检测vGPU支持(需要nvidia-smi)
        try {
          await execAsync('nvidia-smi vgpu -q 2>/dev/null');
          vgpuSupport = true;
        } catch {
          vgpuSupport = false;
        }
      } else if (device.vendor.includes('AMD') || device.vendor.includes('ATI')) {
        type = 'AMD';
      } else if (device.vendor.includes('Intel')) {
        type = 'Intel';
        // Intel GVT-g检测
        try {
          await fs.access(`/sys/bus/pci/devices/${device.slot}/mdev_supported_types`);
          vgpuSupport = true;
        } catch {
          vgpuSupport = false;
        }
      }
      
      gpuDevices.push({
        ...device,
        type,
        model: device.device,
        vgpuSupport,
      });
    }
  }
  
  return gpuDevices;
}

/**
 * 识别网卡设备
 */
export async function detectNetworkDevices(pciDevices: PCIDevice[]): Promise<NetworkDevice[]> {
  const networkDevices: NetworkDevice[] = [];
  
  for (const device of pciDevices) {
    if (device.class.includes('Ethernet') || device.class.includes('Network')) {
      // 获取网络接口名称
      let interfaceName = '';
      try {
        const { stdout } = await execAsync(`ls /sys/bus/pci/devices/${device.slot}/net 2>/dev/null || echo ""`);
        interfaceName = stdout.trim().split('\n')[0];
      } catch {
        interfaceName = 'unknown';
      }
      
      // 检测SR-IOV支持
      let sriovSupport = false;
      let maxVFs = 0;
      try {
        const sriovPath = `/sys/bus/pci/devices/${device.slot}/sriov_totalvfs`;
        const { stdout } = await execAsync(`cat ${sriovPath} 2>/dev/null || echo "0"`);
        maxVFs = parseInt(stdout.trim());
        sriovSupport = maxVFs > 0;
      } catch {
        sriovSupport = false;
      }
      
      networkDevices.push({
        ...device,
        interface: interfaceName,
        sriovSupport,
        maxVFs,
      });
    }
  }
  
  return networkDevices;
}

/**
 * 识别存储控制器
 */
export function detectStorageControllers(pciDevices: PCIDevice[]): PCIDevice[] {
  return pciDevices.filter(device =>
    device.class.includes('SATA') ||
    device.class.includes('SCSI') ||
    device.class.includes('NVMe') ||
    device.class.includes('RAID') ||
    device.class.includes('storage')
  );
}

/**
 * 获取完整的硬件信息
 */
export async function getHardwareInfo(): Promise<HardwareInfo> {
  const [iommuEnabled, kvmSupported, cpu, numa, pciDevices] = await Promise.all([
    checkIOMMU(),
    checkKVMSupport(),
    getCPUInfo(),
    getNUMAInfo(),
    enumeratePCIDevices(),
  ]);
  
  const gpuDevices = await detectGPUDevices(pciDevices);
  const networkDevices = await detectNetworkDevices(pciDevices);
  const storageControllers = detectStorageControllers(pciDevices);
  
  return {
    iommuEnabled,
    kvmSupported,
    cpu,
    numa,
    pciDevices,
    gpuDevices,
    networkDevices,
    storageControllers,
  };
}
