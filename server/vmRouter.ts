/**
 * 虚拟机管理tRPC路由
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import * as vmService from "./vmService";
import * as hardwareDetection from "./hardwareDetection";
import * as pciPassthrough from "./pciPassthrough";
import * as perfOpt from "./performanceOptimization";

export const vmRouter = router({
  /**
   * 获取硬件信息(用于高性能虚拟机配置)
   */
  getHardwareInfo: publicProcedure.query(async () => {
    return await hardwareDetection.getHardwareInfo();
  }),

  /**
   * 获取可直通PCI设备列表
   */
  getPassthroughDevices: publicProcedure.query(async () => {
    return await pciPassthrough.getPassthroughDevices();
  }),

  /**
   * 绑定PCI设备到vfio-pci驱动
   */
  bindDeviceToVFIO: publicProcedure
    .input(z.object({ slot: z.string() }))
    .mutation(async ({ input }) => {
      const { vendorId, deviceId } = await pciPassthrough.getDeviceIDs(input.slot);
      await pciPassthrough.bindToVFIO(input.slot, vendorId, deviceId);
      return {
        success: true,
        message: `设备 ${input.slot} 已绑定到vfio-pci`,
      };
    }),

  /**
   * 从vfio-pci解绑PCI设备
   */
  unbindDeviceFromVFIO: publicProcedure
    .input(z.object({ slot: z.string() }))
    .mutation(async ({ input }) => {
      await pciPassthrough.unbindFromVFIO(input.slot);
      return {
        success: true,
        message: `设备 ${input.slot} 已从vfio-pci解绑`,
      };
    }),

  /**
   * 启用SR-IOV
   */
  enableSRIOV: publicProcedure
    .input(z.object({ slot: z.string(), numVFs: z.number().min(1).max(64) }))
    .mutation(async ({ input }) => {
      await pciPassthrough.enableSRIOV(input.slot, input.numVFs);
      return {
        success: true,
        message: `SR-IOV已启用,创建了 ${input.numVFs} 个虚拟功能`,
      };
    }),

  /**
   * 禁用SR-IOV
   */
  disableSRIOV: publicProcedure
    .input(z.object({ slot: z.string() }))
    .mutation(async ({ input }) => {
      await pciPassthrough.disableSRIOV(input.slot);
      return {
        success: true,
        message: `SR-IOV已禁用`,
      };
    }),

  /**
   * 获取CPU拓扑信息
   */
  getCPUTopology: publicProcedure.query(async () => {
    return await perfOpt.getCPUTopology();
  }),

  /**
   * 获取NUMA拓扑信息
   */
  getNUMATopology: publicProcedure.query(async () => {
    return await perfOpt.getNUMATopology();
  }),

  /**
   * 检查大页内存支持
   */
  checkHugepagesSupport: publicProcedure.query(async () => {
    return await perfOpt.checkHugepagesSupport();
  }),

  /**
   * 配置大页内存
   */
  configureHugepages: publicProcedure
    .input(z.object({ size: z.enum(['2M', '1G']), count: z.number().min(0) }))
    .mutation(async ({ input }) => {
      await perfOpt.configureHugepages(input);
      return {
        success: true,
        message: `大页内存已配置: ${input.count} x ${input.size}`,
      };
    }),

  /**
   * 检查CPU隔离配置
   */
  checkCPUIsolation: publicProcedure.query(async () => {
    return await perfOpt.checkCPUIsolation();
  }),

  /**
   * 获取性能优化建议
   */
  getPerformanceRecommendations: publicProcedure.query(async () => {
    return await perfOpt.getPerformanceRecommendations();
  }),

  /**
   * 检查KVM支持
   */
  checkKVM: publicProcedure.query(async () => {
    const supported = await vmService.checkKVMSupport();
    return {
      supported,
      message: supported
        ? "系统支持KVM硬件加速"
        : "系统不支持KVM,将使用QEMU软件模拟",
    };
  }),

  /**
   * 列出所有虚拟机
   */
  list: publicProcedure.query(async () => {
    return await vmService.listVMs();
  }),

  /**
   * 获取虚拟机详情
   */
  detail: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      const vm = await vmService.getVMInfo(input.name);
      if (!vm) {
        throw new Error(`VM not found: ${input.name}`);
      }
      return vm;
    }),

  /**
   * 创建虚拟机
   */
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        memory: z.number().min(512).max(32768), // 512MB - 32GB
        cpus: z.number().min(1).max(16),
        diskSize: z.number().min(1).max(500), // 1GB - 500GB
        isoPath: z.string().optional(),
        network: z.enum(["nat", "bridge"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // 检查虚拟机是否已存在
      const existing = await vmService.getVMInfo(input.name);
      if (existing) {
        throw new Error(`VM already exists: ${input.name}`);
      }

      // 创建虚拟磁盘
      const diskPath = await vmService.createVMDisk(input.name, input.diskSize);

      return {
        success: true,
        message: `虚拟机 ${input.name} 创建成功`,
        diskPath,
      };
    }),

  /**
   * 启动虚拟机
   */
  start: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      const vm = await vmService.getVMInfo(input.name);
      if (!vm) {
        throw new Error(`VM not found: ${input.name}`);
      }

      if (vm.status === "running") {
        throw new Error(`VM is already running: ${input.name}`);
      }

      const { pid, vncPort } = await vmService.startVM({
        name: input.name,
        memory: 2048, // TODO: 从配置读取
        cpus: 2,
        diskSize: 0, // 不需要,磁盘已存在
        network: "nat",
      });

      return {
        success: true,
        message: `虚拟机 ${input.name} 已启动`,
        pid,
        vncPort,
        vncUrl: `vnc://localhost:${vncPort}`,
      };
    }),

  /**
   * 停止虚拟机
   */
  stop: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      await vmService.stopVM(input.name);
      return {
        success: true,
        message: `虚拟机 ${input.name} 已停止`,
      };
    }),

  /**
   * 删除虚拟机
   */
  delete: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      await vmService.deleteVM(input.name);
      return {
        success: true,
        message: `虚拟机 ${input.name} 已删除`,
      };
    }),
});
